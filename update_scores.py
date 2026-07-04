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
    "New Zealand": "New Zealand",
    "Saudi Arabia": "Saudi Arabia",
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

def build_api_lookup(api_matches: list) -> dict:
    """
    Build a lookup dict keyed by (normalised_team1, normalised_team2, date_str).
    Date is YYYY-MM-DD in UTC so it aligns with our matches.json dates.
    """
    lookup = {}
    for m in api_matches:
        home = normalise(m.get("homeTeam", {}).get("name", ""))
        away = normalise(m.get("awayTeam", {}).get("name", ""))
        utc_date = m.get("utcDate", "")  # "2026-06-11T19:00:00Z"
        date_str = utc_date[:10]         # "2026-06-11"

        # Store under both orderings so we can match regardless of home/away
        lookup[(home, away, date_str)] = m
        lookup[(away, home, date_str)] = m

    return lookup


def get_score_for_match(our_match: dict, lookup: dict) -> dict | None:
    """
    Try to find a corresponding API fixture for one of our matches.json entries.
    Returns a dict with keys: team1_score, team2_score, status — or None.
    """
    t1 = our_match.get("team1", {}).get("name", "")
    t2 = our_match.get("team2", {}).get("name", "")
    date_str = our_match.get("date", "")[:10]

    # Try direct lookup
    api_match = lookup.get((t1, t2, date_str))
    if not api_match:
        # Some matches share the same date; try with normalised names just in case
        api_match = lookup.get((normalise(t1), normalise(t2), date_str))

    if not api_match:
        return None

    status = api_match.get("status", "")  # SCHEDULED, IN_PLAY, PAUSED, FINISHED, ...
    score_data = api_match.get("score", {})

    # fullTime is the authoritative final score; currentScore during a live match
    full_time = score_data.get("fullTime", {})
    home_score = full_time.get("home")
    away_score = full_time.get("away")

    # For live matches, fall back to the running score
    if (home_score is None or away_score is None) and status in ("IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY"):
        current = score_data.get("regularTime") or score_data.get("halfTime") or {}
        home_score = current.get("home")
        away_score = current.get("away")

    if home_score is None or away_score is None:
        return None

    # Determine which team was home/away in the API response
    api_home = normalise(api_match.get("homeTeam", {}).get("name", ""))
    api_away = normalise(api_match.get("awayTeam", {}).get("name", ""))

    if normalise(t1) == api_home:
        team1_score, team2_score = int(home_score), int(away_score)
    else:
        team1_score, team2_score = int(away_score), int(home_score)

    # Map API status to our status field
    if status == "FINISHED":
        our_status = "finished"
    elif status in ("IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY"):
        our_status = "live"
    else:
        our_status = status.lower()

    return {
        "team1_score": team1_score,
        "team2_score": team2_score,
        "status": our_status,
    }


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
    lookup = build_api_lookup(api_matches)

    path = locate_matches_file()
    matches = load_matches(path)

    now = datetime.now(timezone.utc)
    updated_count = 0
    live_count = 0

    for match in matches:
        # Skip non-match special events
        if match.get("stage") in ("Opening Ceremony", "Halftime Show"):
            continue

        # Skip if no real teams yet (knockout TBD slots)
        t1_name = match.get("team1", {}).get("name", "")
        t2_name = match.get("team2", {}).get("name", "")
        if t1_name in ("TBD", "") or t2_name in ("TBD", ""):
            continue

        # Skip future matches that haven't started yet (give 30 min buffer for kickoff)
        try:
            match_time = datetime.fromisoformat(match["date"].replace("Z", "+00:00"))
        except Exception:
            continue

        if match_time > now:
            continue  # Not started yet

        # Skip matches that are already marked finished AND have scores
        already_done = (
            match.get("status") == "finished"
            and "score" in match.get("team1", {})
            and "score" in match.get("team2", {})
        )
        if already_done:
            continue  # Nothing to update

        # Try to get score data from the API
        result = get_score_for_match(match, lookup)

        if result:
            old_t1 = match["team1"].get("score")
            old_t2 = match["team2"].get("score")
            old_status = match.get("status")

            match["team1"]["score"] = result["team1_score"]
            match["team2"]["score"] = result["team2_score"]
            match["status"] = result["status"]

            changed = (
                old_t1 != result["team1_score"]
                or old_t2 != result["team2_score"]
                or old_status != result["status"]
            )

            if changed:
                updated_count += 1
                label = "🔴 LIVE" if result["status"] == "live" else "✅ FINAL"
                print(
                    f"  [{label}] {t1_name} {result['team1_score']}–{result['team2_score']} {t2_name}"
                )
                if result["status"] == "live":
                    live_count += 1
        else:
            print(f"  ⏳ No score yet: {t1_name} vs {t2_name} ({match['date'][:10]})")

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
