#!/usr/bin/env python3
"""
Update World Cup match scores from API-Football
Runs every 3 hours via GitHub Actions
"""

import requests
import json
from datetime import datetime, timedelta, timezone
import os
import sys

def load_matches():
    """Load matches from matches.json"""
    try:
        # Try current directory first
        if os.path.exists('matches.json'):
            with open('matches.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        # Try parent directory (when running from scripts folder)
        elif os.path.exists('../matches.json'):
            with open('../matches.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            print("Error: matches.json not found in current or parent directory")
            print(f"Current directory: {os.getcwd()}")
            print(f"Files in current directory: {os.listdir('.')}")
            sys.exit(1)
    except Exception as e:
        print(f"Error loading matches.json: {e}")
        sys.exit(1)

def save_matches(matches):
    """Save updated matches to matches.json"""
    try:
        # Save to the same location where we found it
        if os.path.exists('matches.json'):
            filepath = 'matches.json'
        elif os.path.exists('../matches.json'):
            filepath = '../matches.json'
        else:
            filepath = 'matches.json'  # Default to current directory
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(matches, f, indent=2, ensure_ascii=False)
        print(f"Saved to: {os.path.abspath(filepath)}")
        return True
    except Exception as e:
        print(f"Error saving matches.json: {e}")
        return False

def fetch_match_score_from_api(team1_name, team2_name, match_date):
    """
    Fetch match score from TheSportsDB API (100% FREE, no API key needed!)
    Returns: {'team1_score': int, 'team2_score': int, 'status': 'finished'} or None
    """
    try:
        # TheSportsDB free API endpoint
        url = "https://www.thesportsdb.com/api/v1/json/3/searchevents.php"
        
        # Format date for API (YYYY-MM-DD)
        match_date_obj = datetime.fromisoformat(match_date.replace('Z', '+00:00'))
        date_str = match_date_obj.strftime('%Y-%m-%d')
        
        # Try searching by team names
        search_terms = [team1_name, team2_name]
        
        for search_term in search_terms:
            querystring = {
                "e": search_term,
                "s": "Soccer"
            }
            
            response = requests.get(url, params=querystring, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if not data.get('event'):
                continue
            
            # Find the specific match on this date
            for event in data['event']:
                event_date = event.get('dateEvent', '')
                home_team = event.get('strHomeTeam', '')
                away_team = event.get('strAwayTeam', '')
                
                # Check if this is our match (same date and teams match)
                if event_date == date_str:
                    # Check if team names match (case-insensitive, partial match)
                    team1_match = (team1_name.lower() in home_team.lower() or
                                  home_team.lower() in team1_name.lower() or
                                  team1_name.lower() in away_team.lower() or
                                  away_team.lower() in team1_name.lower())
                    
                    team2_match = (team2_name.lower() in home_team.lower() or
                                  home_team.lower() in team2_name.lower() or
                                  team2_name.lower() in away_team.lower() or
                                  away_team.lower() in team2_name.lower())
                    
                    if team1_match and team2_match:
                        # Check if match is finished
                        status = event.get('strStatus', '')
                        home_score = event.get('intHomeScore')
                        away_score = event.get('intAwayScore')
                        
                        if status == 'Match Finished' and home_score is not None and away_score is not None:
                            # Determine which team is team1 and team2
                            if team1_name.lower() in home_team.lower() or home_team.lower() in team1_name.lower():
                                return {
                                    'team1_score': int(home_score),
                                    'team2_score': int(away_score),
                                    'status': 'finished'
                                }
                            else:
                                return {
                                    'team1_score': int(away_score),
                                    'team2_score': int(home_score),
                                    'status': 'finished'
                                }
        
        return None
        
    except requests.exceptions.RequestException as e:
        print(f"API request error: {e}")
        return None
    except Exception as e:
        print(f"Error fetching score: {e}")
        return None

def update_match_scores():
    """Main function to update match scores"""
    print("Starting score update process...")
    
    matches = load_matches()
    now = datetime.now(timezone.utc)
    six_hours_ago = now - timedelta(hours=6)
    
    updated_count = 0
    checked_count = 0
    
    for match in matches:
        # Skip special events
        if match.get('stage') in ['Opening Ceremony', 'Halftime Show']:
            continue
        
        # Parse match date
        try:
            match_time = datetime.fromisoformat(match['date'].replace('Z', '+00:00'))
        except:
            continue
        
        # Skip if match hasn't started yet
        if match_time > now:
            continue
        
        # Skip if match already has a score
        if 'score' in match.get('team1', {}):
            continue
        
        # Skip if match started more than 6 hours ago (likely already processed)
        if match_time < six_hours_ago:
            continue
        
        # This match needs checking
        checked_count += 1
        print(f"Checking: {match['team1']['name']} vs {match['team2']['name']}")
        
        # Fetch score from API
        score_data = fetch_match_score_from_api(
            match['team1']['name'],
            match['team2']['name'],
            match['date']
        )
        
        if score_data:
            match['team1']['score'] = score_data['team1_score']
            match['team2']['score'] = score_data['team2_score']
            match['status'] = score_data['status']
            updated_count += 1
            print(f"✓ Updated: {match['team1']['name']} {score_data['team1_score']}-{score_data['team2_score']} {match['team2']['name']}")
        else:
            print(f"  No score available yet")
    
    print(f"\nSummary:")
    print(f"- Matches checked: {checked_count}")
    print(f"- Scores updated: {updated_count}")
    
    if updated_count > 0:
        if save_matches(matches):
            print("✓ matches.json updated successfully!")
            return True
        else:
            print("✗ Failed to save matches.json")
            return False
    else:
        print("No new scores to update")
        return False

if __name__ == '__main__':
    try:
        update_match_scores()
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)

# Made with Bob
