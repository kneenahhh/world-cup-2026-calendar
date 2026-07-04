#!/usr/bin/env python3
"""
Update World Cup 2026 match scores and schedule from football-data.org
Runs hourly via GitHub Actions during the tournament.

API: https://www.football-data.org/
Competition: WC (FIFA World Cup 2026)
Endpoint: GET /v4/competitions/WC/matches
Free tier: 10 requests/minute, no daily cap.
"""

import requests
import json
from datetime import datetime, timezone
import os
import sys

# ── Name normalisation ────────────────────────────────────────────────────────
# Maps football-data.org team names → our matches.json team names.
# Add entries here whenever a name differs between the two sources.
TEAM_NAME_MAP = {
    "USA": "USA",
    "United States": "USA",
    "Korea Republic": "South Korea",
    "Republic of Korea": "South Korea",
    "Bosnia and Herzegovina": "Bosnia & Herzegovina",
    "Bosnia-Herzegovina": "Bosnia & Herzegovina",
    "Türkiye": "Türkiye",
    "Turkey": "Türkiye",
    "Ivory Coast": "Ivory Coast",
    "Côte d'Ivoire": "Ivory Coast",
    "DR Congo": "Congo DR",
    "Congo DR": "Congo DR",
    "Democratic Republic of the Congo": "Congo DR",
    "Czechia": "Czech Republic",
    "Czech Republic": "Czech Republic",
    "Cape Verde": "Cape Verde",
    "Cabo Verde": "Cape Verde",
    "Cape Verde Islands": "Cape Verde",
    "New Zealand": "New Zealand",
    "Saudi Arabia": "Saudi Arabia",
    "England": "England",
    "Wales": "Wales",
    "Northern Ireland": "Northern Ireland",
}


def normalise(name: str) -> str:
    """Return our canonical team name for a given API name."""
    return TEAM_NAME_MAP.get(name, name)


# ── File I/O ──────────────────────────────────────────────────────────────────

def locate_matches_file() -> str:
    """Return path to matches.json, searching common locations."""
    candidates = ["matches.json", "../matches.json"]
    for path in candidates:
        if os.path.exists(path):
            return path
    print("ERROR: matches.json not found.")
    print(f"  cwd: {os.getcwd()}")
    print(f"  files: {os.listdir('.')}")
    sys.exit(1)


def load_matches(path: str) -> list:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"ERROR loading {path}: {e}")
        sys.exit(1)


def save_matches(matches: list, path: str) -> bool:
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(matches, f, indent=2, ensure_ascii=False)
        print(f"Saved → {os.path.abspath(path)}")
        return True
    except Exception as e:
        print(f"ERROR saving {path}: {e}")
        return False


# ── API call ──────────────────────────────────────────────────────────────────

def fetch_all_wc_matches(api_key: str) -> list | None:
    """
    Fetch all FIFA World Cup 2026 matches in a single API call.
    Returns a list of fixture dicts from football-data.org, or None on error.
    """
    url = "https://api.football-data.org/v4/competitions/WC/matches"
    headers = {"X-Auth-Token": api_key}

    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()
        return data.get("matches", [])
    except requests.exceptions.HTTPError as e:
        print(f"HTTP error from football-data.org: {e}")
        if response.status_code == 403:
            print("  → 403 Forbidden: check your API key and that it has WC access.")
        elif response.status_code == 429:
            print("  → 429 Rate limited: too many requests.")
        return None
    except Exception as e:
        print(f"Error fetching from football-data.org: {e}")
        return None


# ── Matching logic ────────────────────────────────────────────────────────────

# Placeholder patterns that mean the team hasn't been determined yet
_TBD_PATTERNS = ("TBD", "Winner", "Place", "Loser", "3rd Place", "")

def is_tbd(name: str) -> bool:
    """Return True if this team name is a bracket placeholder, not a real country."""
    if not name:
        return True
    return any(p in name for p in _TBD_PATTERNS)


def build_api_lookup(api_matches: list) -> dict:
    """
    Build two lookup dicts:
      - by_teams: (norm_home, norm_away, date_str) → fixture  (for group stage)
      - by_datetime: "YYYY-MM-DDTHH:MM" → fixture             (for knockout stage)
    Returns both as a tuple.
    """
    by_teams = {}
    by_datetime = {}

    for m in api_matches:
        home = normalise(m.get("homeTeam", {}).get("name", ""))
        away = normalise(m.get("awayTeam", {}).get("name", ""))
        utc_date = m.get("utcDate", "")        # "2026-06-11T19:00:00Z"
        date_str = utc_date[:10]               # "2026-06-11"
        datetime_key = utc_date[:16]           # "2026-06-11T19:00"

        # Team-name lookup (both orderings)
        by_teams[(home, away, date_str)] = m
        by_teams[(away, home, date_str)] = m

        # Date+time lookup (unique per slot, used for knockout TBD matches)
        by_datetime[datetime_key] = m

    return by_teams, by_datetime


def get_api_match(our_match: dict, by_teams: dict, by_datetime: dict) -> tuple[dict | None, bool]:
    """
    Find the API fixture for one of our matches.json entries.
    Returns (api_match, team1_is_home).
    Falls back to date+time lookup for knockout slots with TBD team names.
    """
    t1 = our_match.get("team1", {}).get("name", "")
    t2 = our_match.get("team2", {}).get("name", "")
    date_str = our_match.get("date", "")[:10]
    datetime_key = our_match.get("date", "")[:16]

    # Try team-name lookup first (reliable for group stage)
    api_match = by_teams.get((t1, t2, date_str)) or \
                by_teams.get((normalise(t1), normalise(t2), date_str))

    if api_match:
        api_home = normalise(api_match.get("homeTeam", {}).get("name", ""))
        return api_match, (normalise(t1) == api_home)

    # For knockout TBD slots, fall back to matching by exact UTC date+time
    if is_tbd(t1) or is_tbd(t2):
        api_match = by_datetime.get(datetime_key)
        if api_match:
            # team1 in our file = home team from API (arbitrary but consistent)
            return api_match, True

    return None, True


def get_score_for_match(our_match: dict, by_teams: dict, by_datetime: dict) -> dict | None:
    """
    Try to find score + real team info for one of our matches.json entries.
    Returns a result dict or None if no data is available yet.
    """
    api_match, team1_is_home = get_api_match(our_match, by_teams, by_datetime)
    if not api_match:
        return None

    status = api_match.get("status", "")
    score_data = api_match.get("score", {})

    full_time = score_data.get("fullTime", {})
    home_score = full_time.get("home")
    away_score = full_time.get("away")

    # For live matches fall back to running score
    if (home_score is None or away_score is None) and status in ("IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY"):
        current = score_data.get("regularTime") or score_data.get("halfTime") or {}
        home_score = current.get("home")
        away_score = current.get("away")

    # Real team names from the API (may still be None/empty if not yet determined)
    api_home_name = api_match.get("homeTeam", {}).get("name") or ""
    api_away_name = api_match.get("awayTeam", {}).get("name") or ""
    api_home_flag = flag_for(api_home_name)
    api_away_flag = flag_for(api_away_name)

    if team1_is_home:
        real_t1_name, real_t1_flag = normalise(api_home_name), api_home_flag
        real_t2_name, real_t2_flag = normalise(api_away_name), api_away_flag
        t1_score = int(home_score) if home_score is not None else None
        t2_score = int(away_score) if away_score is not None else None
    else:
        real_t1_name, real_t1_flag = normalise(api_away_name), api_away_flag
        real_t2_name, real_t2_flag = normalise(api_home_name), api_home_flag
        t1_score = int(away_score) if away_score is not None else None
        t2_score = int(home_score) if home_score is not None else None

    # Map API status
    if status == "FINISHED":
        our_status = "finished"
    elif status in ("IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY"):
        our_status = "live"
    elif status == "TIMED":
        our_status = "scheduled"
    else:
        our_status = status.lower()

    return {
        "real_t1_name": real_t1_name,
        "real_t1_flag": real_t1_flag,
        "real_t2_name": real_t2_name,
        "real_t2_flag": real_t2_flag,
        "team1_score": t1_score,
        "team2_score": t2_score,
        "status": our_status,
    }


# ── Flag lookup ───────────────────────────────────────────────────────────────
# Maps canonical team name → flag emoji for real teams.
FLAG_MAP = {
    "Mexico": "🇲🇽", "South Africa": "🇿🇦", "South Korea": "🇰🇷",
    "Czech Republic": "🇨🇿", "Canada": "🇨🇦", "Bosnia & Herzegovina": "🇧🇦",
    "USA": "🇺🇸", "Paraguay": "🇵🇾", "Qatar": "🇶🇦", "Switzerland": "🇨🇭",
    "Brazil": "🇧🇷", "Morocco": "🇲🇦", "Haiti": "🇭🇹", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "Australia": "🇦🇺", "Türkiye": "🇹🇷", "Germany": "🇩🇪", "Curaçao": "🇨🇼",
    "Netherlands": "🇳🇱", "Japan": "🇯🇵", "Ecuador": "🇪🇨", "Ivory Coast": "🇨🇮",
    "Sweden": "🇸🇪", "Tunisia": "🇹🇳", "Spain": "🇪🇸", "Cape Verde": "🇨🇻",
    "Belgium": "🇧🇪", "Egypt": "🇪🇬", "Uruguay": "🇺🇾", "Saudi Arabia": "🇸🇦",
    "Iran": "🇮🇷", "New Zealand": "🇳🇿", "France": "🇫🇷", "Senegal": "🇸🇳",
    "Iraq": "🇮🇶", "Norway": "🇳🇴", "Argentina": "🇦🇷", "Algeria": "🇩🇿",
    "Austria": "🇦🇹", "Jordan": "🇯🇴", "Portugal": "🇵🇹", "Congo DR": "🇨🇩",
    "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croatia": "🇭🇷", "Panama": "🇵🇦", "Ghana": "🇬🇭",
    "Colombia": "🇨🇴", "Uzbekistan": "🇺🇿",
}

def flag_for(name: str) -> str:
    """Return the flag emoji for a team name, or ⚽ if not found."""
    canonical = normalise(name)
    return FLAG_MAP.get(canonical, "⚽")


# ── Main ──────────────────────────────────────────────────────────────────────

def update_match_scores():
    api_key = os.environ.get("FOOTBALL_DATA_API_KEY", "").strip()
    if not api_key:
        print("ERROR: FOOTBALL_DATA_API_KEY environment variable not set.")
        print("  Set it in your shell or add it as a GitHub Actions secret.")
        sys.exit(1)

    print("Fetching all WC 2026 fixtures from football-data.org …")
    api_matches = fetch_all_wc_matches(api_key)
    if api_matches is None:
        print("Could not fetch API data — aborting.")
        sys.exit(1)

    print(f"  Got {len(api_matches)} fixtures from API.")
    by_teams, by_datetime = build_api_lookup(api_matches)

    path = locate_matches_file()
    matches = load_matches(path)

    now = datetime.now(timezone.utc)
    updated_count = 0
    live_count = 0

    for match in matches:
        # Skip non-match special events
        if match.get("stage") in ("Opening Ceremony", "Halftime Show"):
            continue

        t1_name = match.get("team1", {}).get("name", "")
        t2_name = match.get("team2", {}).get("name", "")

        # Skip future matches that haven't started yet
        try:
            match_time = datetime.fromisoformat(match["date"].replace("Z", "+00:00"))
        except Exception:
            continue

        if match_time > now:
            continue  # Not started yet

        # Normalise whatever name is currently in matches.json so we can
        # detect whether it's a real country regardless of spelling variants
        t1_norm = normalise(t1_name)
        t2_norm = normalise(t2_name)
        t1_has_real_name = not is_tbd(t1_norm)
        t2_has_real_name = not is_tbd(t2_norm)

        # Ensure any previously-written name variants are corrected to canonical form
        if t1_has_real_name and match["team1"]["name"] != t1_norm:
            match["team1"]["name"] = t1_norm
            match["team1"]["flag"] = flag_for(t1_norm)
        if t2_has_real_name and match["team2"]["name"] != t2_norm:
            match["team2"]["name"] = t2_norm
            match["team2"]["flag"] = flag_for(t2_norm)

        # Skip matches already finished with real team names and scores
        already_done = (
            match.get("status") == "finished"
            and "score" in match.get("team1", {})
            and "score" in match.get("team2", {})
            and t1_has_real_name
            and t2_has_real_name
        )
        if already_done:
            # Still save if name was just corrected above
            if match["team1"]["name"] != t1_name or match["team2"]["name"] != t2_name:
                updated_count += 1
            continue

        # Try to get score + real team data from the API
        result = get_score_for_match(match, by_teams, by_datetime)

        if result:
            changed = False

            # Update real team names only for slots that still have TBD placeholders
            if is_tbd(t1_name) and result["real_t1_name"] and not is_tbd(result["real_t1_name"]):
                match["team1"]["label"] = t1_name
                match["team1"]["name"]  = result["real_t1_name"]
                match["team1"]["flag"]  = result["real_t1_flag"]
                match["team1"]["code"]  = result["real_t1_name"][:3].upper()
                changed = True
            if is_tbd(t2_name) and result["real_t2_name"] and not is_tbd(result["real_t2_name"]):
                match["team2"]["label"] = t2_name
                match["team2"]["name"]  = result["real_t2_name"]
                match["team2"]["flag"]  = result["real_t2_flag"]
                match["team2"]["code"]  = result["real_t2_name"][:3].upper()
                changed = True

            # Update scores only when they are new or changed
            if result["team1_score"] is not None and result["team2_score"] is not None:
                if match["team1"].get("score") != result["team1_score"] \
                        or match["team2"].get("score") != result["team2_score"]:
                    match["team1"]["score"] = result["team1_score"]
                    match["team2"]["score"] = result["team2_score"]
                    changed = True

            if result["status"] not in ("scheduled", "") \
                    and match.get("status") != result["status"]:
                match["status"] = result["status"]
                changed = True

            if changed:
                updated_count += 1
                t1_display = match["team1"]["name"]
                t2_display = match["team2"]["name"]
                s1 = match["team1"].get("score", "?")
                s2 = match["team2"].get("score", "?")
                label = "🔴 LIVE" if result["status"] == "live" else "✅ FINAL" if result["status"] == "finished" else "📋 UPDATED"
                print(f"  [{label}] {t1_display} {s1}–{s2} {t2_display}")
                if result["status"] == "live":
                    live_count += 1
        else:
            print(f"  ⏳ No data yet: {t1_name} vs {t2_name} ({match['date'][:10]})")

    print(f"\nSummary: {updated_count} updated ({live_count} live)")

    if updated_count > 0:
        return save_matches(matches, path)

    print("No changes — matches.json not modified.")
    return False


if __name__ == "__main__":
    try:
        update_match_scores()
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)

# Made with IBM Bob
