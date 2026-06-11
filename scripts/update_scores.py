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
    Fetch match score from API-Football (RapidAPI)
    Returns: {'team1_score': int, 'team2_score': int, 'status': 'finished'} or None
    """
    api_key = os.environ.get('RAPIDAPI_KEY')
    
    if not api_key:
        print("Warning: RAPIDAPI_KEY not found in environment variables")
        return None
    
    try:
        # API-Football endpoint for World Cup 2026
        url = "https://api-football-v1.p.rapidapi.com/v3/fixtures"
        
        # Format date for API (YYYY-MM-DD)
        match_date_obj = datetime.fromisoformat(match_date.replace('Z', '+00:00'))
        date_str = match_date_obj.strftime('%Y-%m-%d')
        
        headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com"
        }
        
        # Query parameters - World Cup 2026 (league ID: 1)
        querystring = {
            "league": "1",  # World Cup
            "season": "2026",
            "date": date_str
        }
        
        response = requests.get(url, headers=headers, params=querystring, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('response'):
            # Find matching fixture
            for fixture in data['response']:
                home_team = fixture['teams']['home']['name']
                away_team = fixture['teams']['away']['name']
                
                # Match teams (case-insensitive)
                if (team1_name.lower() in home_team.lower() or home_team.lower() in team1_name.lower()) and \
                   (team2_name.lower() in away_team.lower() or away_team.lower() in team2_name.lower()):
                    
                    # Check if match is finished
                    if fixture['fixture']['status']['short'] in ['FT', 'AET', 'PEN']:
                        return {
                            'team1_score': fixture['goals']['home'],
                            'team2_score': fixture['goals']['away'],
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
