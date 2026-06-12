/**
 * World Cup 2026 Calendar Application
 * Main application logic
 */

class WorldCupCalendar {
    constructor() {
        this.matches = [];
        this.filteredMatches = [];
        this.selectedMatches = new Set();
        this.currentTimezone = 'America/New_York';
        this.currentView = 'list';
        this.currentMonth = new Date(2026, 5); // June 2026
        this.icsGenerator = new ICSGenerator();
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            await this.loadMatches();
            this.populateTeamFilter();
            this.setupEventListeners();
            this.loadUserPreferences();
            this.renderMatches();
            this.updateSelectionCount();
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to load matches. Please refresh the page.');
        }
    }

    /**
     * Populate team filter dropdown with all unique teams
     */
    populateTeamFilter() {
        const teams = new Set();
        const excludedNames = ['TBD', 'Opening Ceremony', 'Halftime Show', 'Mexico City', 'Toronto', 'Los Angeles', 'World Cup Final'];
        
        this.matches.forEach(match => {
            // Only add actual country teams, not special events
            if (!excludedNames.includes(match.team1.name)) {
                teams.add(`${match.team1.flag} ${match.team1.name}`);
            }
            if (!excludedNames.includes(match.team2.name)) {
                teams.add(`${match.team2.flag} ${match.team2.name}`);
            }
        });
        
        const sortedTeams = Array.from(teams).sort();
        const select = document.getElementById('team-filter');
        
        // Add country teams only
        sortedTeams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.split(' ').slice(1).join(' '); // Remove flag emoji
            option.textContent = team;
            select.appendChild(option);
        });
        
        // Add special events and select knockout stages only (no quarterfinals or third-place)
        const specialOptions = [
            { value: 'Opening Ceremony', text: '🎭 Opening Ceremonies' },
            { value: 'Halftime Show', text: '🎤 Halftime Show' },
            { value: 'Semifinal', text: '⚽ Semifinals' },
            { value: 'Final', text: '🏆 Final' }
        ];
        
        specialOptions.forEach(stage => {
            const option = document.createElement('option');
            option.value = stage.value;
            option.textContent = stage.text;
            select.appendChild(option);
        });
    }

    /**
     * Load matches from JSON file
     */
    async loadMatches() {
        try {
            const response = await fetch('matches.json');
            if (!response.ok) throw new Error('Failed to fetch matches');
            
            this.matches = await response.json();
            this.filteredMatches = [...this.matches];
            
            // Sort matches by date
            this.matches.sort((a, b) => new Date(a.date) - new Date(b.date));
            this.filteredMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
        } catch (error) {
            console.error('Error loading matches from file, using embedded data:', error);
            // Fallback to embedded data if fetch fails (e.g., when opening file:// directly)
            this.matches = this.getEmbeddedMatches();
            this.filteredMatches = [...this.matches];
            this.matches.sort((a, b) => new Date(a.date) - new Date(b.date));
            this.filteredMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
    }

    /**
     * Get embedded match data (fallback for file:// protocol)
     * Note: This is a subset. For complete data, use matches.json with a web server
     */
    getEmbeddedMatches() {
        // Fetch from matches.json is preferred, this is just a fallback
        // Returns first 20 matches to keep file size reasonable
        return [
            {
                        "id": "ceremony-001",
                        "date": "2026-06-11T16:30:00Z",
                        "team1": {
                                    "name": "🎉 Opening Ceremony @",
                                    "code": "CEREMONY",
                                    "flag": ""
                        },
                        "team2": {
                                    "name": "Mexico City",
                                    "code": "MEX",
                                    "flag": "🇲🇽"
                        },
                        "stadium": "Estadio Azteca",
                        "city": "Mexico City",
                        "country": "Mexico",
                        "broadcast": [
                                    "FOX",
                                    "Telemundo",
                                    "Peacock"
                        ],
                        "stage": "Opening Ceremony",
                        "group": "",
                        "description": "Performers: J Balvin, Tyla, Alejandro Fernández, Belinda, Danny Ocean, Lila Downs, Los Ángeles Azules, Maná."
            },
            {
                        "id": "match-001",
                        "date": "2026-06-11T19:00:00Z",
                        "team1": {
                                    "name": "Mexico",
                                    "code": "MEX",
                                    "flag": "🇲🇽"
                        },
                        "team2": {
                                    "name": "South Africa",
                                    "code": "RSA",
                                    "flag": "🇿🇦"
                        },
                        "stadium": "Estadio Banorte",
                        "city": "Mexico City",
                        "country": "Mexico",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "A"
            },
            {
                        "id": "match-002",
                        "date": "2026-06-12T02:00:00Z",
                        "team1": {
                                    "name": "South Korea",
                                    "code": "KOR",
                                    "flag": "🇰🇷"
                        },
                        "team2": {
                                    "name": "Czech Republic",
                                    "code": "CZE",
                                    "flag": "🇨🇿"
                        },
                        "stadium": "Estadio Akron",
                        "city": "Guadalajara",
                        "country": "Mexico",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "A"
            },
            {
                        "id": "ceremony-002",
                        "date": "2026-06-12T17:30:00Z",
                        "team1": {
                                    "name": "🎉 Opening Ceremony @",
                                    "code": "CEREMONY",
                                    "flag": ""
                        },
                        "team2": {
                                    "name": "Toronto",
                                    "code": "CAN",
                                    "flag": "🇨🇦"
                        },
                        "stadium": "BMO Field",
                        "city": "Toronto",
                        "country": "Canada",
                        "broadcast": [
                                    "FOX",
                                    "Telemundo",
                                    "Peacock"
                        ],
                        "stage": "Opening Ceremony",
                        "group": "",
                        "description": "Performers: Alanis Morissette, Alessia Cara, Elyanna, Jessie Reyez, Michael Bublé, Nora Fatehi, Sanjoy, Vegedream, William Prince."
            },
            {
                        "id": "match-003",
                        "date": "2026-06-12T19:00:00Z",
                        "team1": {
                                    "name": "Canada",
                                    "code": "CAN",
                                    "flag": "🇨🇦"
                        },
                        "team2": {
                                    "name": "Bosnia & Herzegovina",
                                    "code": "BIH",
                                    "flag": "🇧🇦"
                        },
                        "stadium": "BMO Field",
                        "city": "Toronto",
                        "country": "Canada",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "B"
            },
            {
                        "id": "ceremony-003",
                        "date": "2026-06-12T23:30:00Z",
                        "team1": {
                                    "name": "🎉 Opening Ceremony @",
                                    "code": "CEREMONY",
                                    "flag": ""
                        },
                        "team2": {
                                    "name": "Los Angeles",
                                    "code": "USA",
                                    "flag": "🇺🇸"
                        },
                        "stadium": "SoFi Stadium",
                        "city": "Inglewood, California",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Telemundo",
                                    "Peacock"
                        ],
                        "stage": "Opening Ceremony",
                        "group": "",
                        "description": "Performers: Katy Perry, Future, Anitta, LISA, Rema, Tyla."
            },
            {
                        "id": "match-004",
                        "date": "2026-06-13T01:00:00Z",
                        "team1": {
                                    "name": "USA",
                                    "code": "USA",
                                    "flag": "🇺🇸"
                        },
                        "team2": {
                                    "name": "Paraguay",
                                    "code": "PAR",
                                    "flag": "🇵🇾"
                        },
                        "stadium": "SoFi Stadium",
                        "city": "Inglewood, California",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "D"
            },
            {
                        "id": "match-005",
                        "date": "2026-06-13T19:00:00Z",
                        "team1": {
                                    "name": "Qatar",
                                    "code": "QAT",
                                    "flag": "🇶🇦"
                        },
                        "team2": {
                                    "name": "Switzerland",
                                    "code": "SUI",
                                    "flag": "🇨🇭"
                        },
                        "stadium": "Levi's Stadium",
                        "city": "Santa Clara, California",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "B"
            },
            {
                        "id": "match-006",
                        "date": "2026-06-13T22:00:00Z",
                        "team1": {
                                    "name": "Brazil",
                                    "code": "BRA",
                                    "flag": "🇧🇷"
                        },
                        "team2": {
                                    "name": "Morocco",
                                    "code": "MAR",
                                    "flag": "🇲🇦"
                        },
                        "stadium": "MetLife Stadium",
                        "city": "New York/New Jersey",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "C"
            },
            {
                        "id": "match-007",
                        "date": "2026-06-14T01:00:00Z",
                        "team1": {
                                    "name": "Haiti",
                                    "code": "HTI",
                                    "flag": "🇭🇹"
                        },
                        "team2": {
                                    "name": "Scotland",
                                    "code": "SCO",
                                    "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
                        },
                        "stadium": "Gillette Stadium",
                        "city": "Foxborough, Massachusetts",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "C"
            },
            {
                        "id": "match-008",
                        "date": "2026-06-14T04:00:00Z",
                        "team1": {
                                    "name": "Australia",
                                    "code": "AUS",
                                    "flag": "🇦🇺"
                        },
                        "team2": {
                                    "name": "Türkiye",
                                    "code": "TUR",
                                    "flag": "🇹🇷"
                        },
                        "stadium": "BC Place",
                        "city": "Vancouver",
                        "country": "Canada",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "D"
            },
            {
                        "id": "match-009",
                        "date": "2026-06-14T17:00:00Z",
                        "team1": {
                                    "name": "Germany",
                                    "code": "GER",
                                    "flag": "🇩🇪"
                        },
                        "team2": {
                                    "name": "Curaçao",
                                    "code": "CUR",
                                    "flag": "🇨🇼"
                        },
                        "stadium": "NRG Stadium",
                        "city": "Houston, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "E"
            },
            {
                        "id": "match-010",
                        "date": "2026-06-14T20:00:00Z",
                        "team1": {
                                    "name": "Netherlands",
                                    "code": "NED",
                                    "flag": "🇳🇱"
                        },
                        "team2": {
                                    "name": "Japan",
                                    "code": "JPN",
                                    "flag": "🇯🇵"
                        },
                        "stadium": "AT&T Stadium",
                        "city": "Arlington, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "F"
            },
            {
                        "id": "match-011",
                        "date": "2026-06-14T23:00:00Z",
                        "team1": {
                                    "name": "Ecuador",
                                    "code": "ECU",
                                    "flag": "🇪🇨"
                        },
                        "team2": {
                                    "name": "Ivory Coast",
                                    "code": "CIV",
                                    "flag": "🇨🇮"
                        },
                        "stadium": "Lincoln Financial Field",
                        "city": "Philadelphia, Pennsylvania",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "E"
            },
            {
                        "id": "match-012",
                        "date": "2026-06-15T02:00:00Z",
                        "team1": {
                                    "name": "Sweden",
                                    "code": "SWE",
                                    "flag": "🇸🇪"
                        },
                        "team2": {
                                    "name": "Tunisia",
                                    "code": "TUN",
                                    "flag": "🇹🇳"
                        },
                        "stadium": "Estadio BBVA",
                        "city": "Monterrey",
                        "country": "Mexico",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "F"
            },
            {
                        "id": "match-013",
                        "date": "2026-06-15T16:00:00Z",
                        "team1": {
                                    "name": "Spain",
                                    "code": "ESP",
                                    "flag": "🇪🇸"
                        },
                        "team2": {
                                    "name": "Cape Verde",
                                    "code": "CPV",
                                    "flag": "🇨🇻"
                        },
                        "stadium": "Mercedes-Benz Stadium",
                        "city": "Atlanta",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "H"
            },
            {
                        "id": "match-014",
                        "date": "2026-06-15T19:00:00Z",
                        "team1": {
                                    "name": "Belgium",
                                    "code": "BEL",
                                    "flag": "🇧🇪"
                        },
                        "team2": {
                                    "name": "Egypt",
                                    "code": "EGY",
                                    "flag": "🇪🇬"
                        },
                        "stadium": "Lumen Field",
                        "city": "Seattle",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "G"
            },
            {
                        "id": "match-015",
                        "date": "2026-06-15T22:00:00Z",
                        "team1": {
                                    "name": "Uruguay",
                                    "code": "URU",
                                    "flag": "🇺🇾"
                        },
                        "team2": {
                                    "name": "Saudi Arabia",
                                    "code": "SAU",
                                    "flag": "🇸🇦"
                        },
                        "stadium": "Hard Rock Stadium",
                        "city": "Miami",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "H"
            },
            {
                        "id": "match-016",
                        "date": "2026-06-16T01:00:00Z",
                        "team1": {
                                    "name": "Iran",
                                    "code": "IRN",
                                    "flag": "🇮🇷"
                        },
                        "team2": {
                                    "name": "New Zealand",
                                    "code": "NZL",
                                    "flag": "🇳🇿"
                        },
                        "stadium": "SoFi Stadium",
                        "city": "Inglewood, California",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "G"
            },
            {
                        "id": "match-017",
                        "date": "2026-06-16T19:00:00Z",
                        "team1": {
                                    "name": "France",
                                    "code": "FRA",
                                    "flag": "🇫🇷"
                        },
                        "team2": {
                                    "name": "Senegal",
                                    "code": "SEN",
                                    "flag": "🇸🇳"
                        },
                        "stadium": "MetLife Stadium",
                        "city": "New York/New Jersey",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "I"
            },
            {
                        "id": "match-018",
                        "date": "2026-06-16T22:00:00Z",
                        "team1": {
                                    "name": "Iraq",
                                    "code": "IRQ",
                                    "flag": "🇮🇶"
                        },
                        "team2": {
                                    "name": "Norway",
                                    "code": "NOR",
                                    "flag": "🇳🇴"
                        },
                        "stadium": "Gillette Stadium",
                        "city": "Foxborough, Massachusetts",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "I"
            },
            {
                        "id": "match-019",
                        "date": "2026-06-17T01:00:00Z",
                        "team1": {
                                    "name": "Argentina",
                                    "code": "ARG",
                                    "flag": "🇦🇷"
                        },
                        "team2": {
                                    "name": "Algeria",
                                    "code": "ALG",
                                    "flag": "🇩🇿"
                        },
                        "stadium": "Arrowhead Stadium",
                        "city": "Kansas City, Missouri",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "J"
            },
            {
                        "id": "match-020",
                        "date": "2026-06-17T04:00:00Z",
                        "team1": {
                                    "name": "Austria",
                                    "code": "AUT",
                                    "flag": "🇦🇹"
                        },
                        "team2": {
                                    "name": "Jordan",
                                    "code": "JOR",
                                    "flag": "🇯🇴"
                        },
                        "stadium": "Levi's Stadium",
                        "city": "Santa Clara, California",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "J"
            },
            {
                        "id": "match-021",
                        "date": "2026-06-17T17:00:00Z",
                        "team1": {
                                    "name": "Portugal",
                                    "code": "POR",
                                    "flag": "🇵🇹"
                        },
                        "team2": {
                                    "name": "Congo DR",
                                    "code": "COD",
                                    "flag": "🇨🇩"
                        },
                        "stadium": "NRG Stadium",
                        "city": "Houston, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "K"
            },
            {
                        "id": "match-022",
                        "date": "2026-06-17T20:00:00Z",
                        "team1": {
                                    "name": "England",
                                    "code": "ENG",
                                    "flag": "🇬🇧"
                        },
                        "team2": {
                                    "name": "Croatia",
                                    "code": "CRO",
                                    "flag": "🇭🇷"
                        },
                        "stadium": "AT&T Stadium",
                        "city": "Arlington, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "L"
            },
            {
                        "id": "match-023",
                        "date": "2026-06-17T23:00:00Z",
                        "team1": {
                                    "name": "Panama",
                                    "code": "PAN",
                                    "flag": "🇵🇦"
                        },
                        "team2": {
                                    "name": "Ghana",
                                    "code": "GHA",
                                    "flag": "🇬🇭"
                        },
                        "stadium": "BMO Field",
                        "city": "Toronto",
                        "country": "Canada",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "L"
            },
            {
                        "id": "match-024",
                        "date": "2026-06-18T02:00:00Z",
                        "team1": {
                                    "name": "Colombia",
                                    "code": "COL",
                                    "flag": "🇨🇴"
                        },
                        "team2": {
                                    "name": "Uzbekistan",
                                    "code": "UZB",
                                    "flag": "🇺🇿"
                        },
                        "stadium": "Estadio Banorte",
                        "city": "Mexico City",
                        "country": "Mexico",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "K"
            },
            {
                        "id": "match-025",
                        "date": "2026-06-18T16:00:00Z",
                        "team1": {
                                    "name": "Czech Republic",
                                    "code": "CZE",
                                    "flag": "🇨🇿"
                        },
                        "team2": {
                                    "name": "South Africa",
                                    "code": "RSA",
                                    "flag": "🇿🇦"
                        },
                        "stadium": "Mercedes-Benz Stadium",
                        "city": "Atlanta",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "A"
            },
            {
                        "id": "match-026",
                        "date": "2026-06-18T19:00:00Z",
                        "team1": {
                                    "name": "Switzerland",
                                    "code": "SUI",
                                    "flag": "🇨🇭"
                        },
                        "team2": {
                                    "name": "Bosnia & Herzegovina",
                                    "code": "BIH",
                                    "flag": "🇧🇦"
                        },
                        "stadium": "SoFi Stadium",
                        "city": "Inglewood, California",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "B"
            },
            {
                        "id": "match-027",
                        "date": "2026-06-18T22:00:00Z",
                        "team1": {
                                    "name": "Canada",
                                    "code": "CAN",
                                    "flag": "🇨🇦"
                        },
                        "team2": {
                                    "name": "Qatar",
                                    "code": "QAT",
                                    "flag": "🇶🇦"
                        },
                        "stadium": "BC Place",
                        "city": "Vancouver",
                        "country": "Canada",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "B"
            },
            {
                        "id": "match-028",
                        "date": "2026-06-19T01:00:00Z",
                        "team1": {
                                    "name": "Mexico",
                                    "code": "MEX",
                                    "flag": "🇲🇽"
                        },
                        "team2": {
                                    "name": "South Korea",
                                    "code": "KOR",
                                    "flag": "🇰🇷"
                        },
                        "stadium": "Estadio Akron",
                        "city": "Guadalajara",
                        "country": "Mexico",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "A"
            },
            {
                        "id": "match-029",
                        "date": "2026-06-19T19:00:00Z",
                        "team1": {
                                    "name": "USA",
                                    "code": "USA",
                                    "flag": "🇺🇸"
                        },
                        "team2": {
                                    "name": "Australia",
                                    "code": "AUS",
                                    "flag": "🇦🇺"
                        },
                        "stadium": "Lumen Field",
                        "city": "Seattle",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "D"
            },
            {
                        "id": "match-030",
                        "date": "2026-06-19T22:00:00Z",
                        "team1": {
                                    "name": "Scotland",
                                    "code": "SCO",
                                    "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
                        },
                        "team2": {
                                    "name": "Morocco",
                                    "code": "MAR",
                                    "flag": "🇲🇦"
                        },
                        "stadium": "Gillette Stadium",
                        "city": "Foxborough, Massachusetts",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "C"
            },
            {
                        "id": "match-031",
                        "date": "2026-06-20T00:30:00Z",
                        "team1": {
                                    "name": "Brazil",
                                    "code": "BRA",
                                    "flag": "🇧🇷"
                        },
                        "team2": {
                                    "name": "Haiti",
                                    "code": "HTI",
                                    "flag": "🇭🇹"
                        },
                        "stadium": "Lincoln Financial Field",
                        "city": "Philadelphia, Pennsylvania",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "C"
            },
            {
                        "id": "match-032",
                        "date": "2026-06-20T03:00:00Z",
                        "team1": {
                                    "name": "Türkiye",
                                    "code": "TUR",
                                    "flag": "🇹🇷"
                        },
                        "team2": {
                                    "name": "Paraguay",
                                    "code": "PAR",
                                    "flag": "🇵🇾"
                        },
                        "stadium": "Levi's Stadium",
                        "city": "Santa Clara, California",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "D"
            },
            {
                        "id": "match-033",
                        "date": "2026-06-20T17:00:00Z",
                        "team1": {
                                    "name": "Netherlands",
                                    "code": "NED",
                                    "flag": "🇳🇱"
                        },
                        "team2": {
                                    "name": "Sweden",
                                    "code": "SWE",
                                    "flag": "🇸🇪"
                        },
                        "stadium": "NRG Stadium",
                        "city": "Houston, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "F"
            },
            {
                        "id": "match-034",
                        "date": "2026-06-20T20:00:00Z",
                        "team1": {
                                    "name": "Germany",
                                    "code": "GER",
                                    "flag": "🇩🇪"
                        },
                        "team2": {
                                    "name": "Ivory Coast",
                                    "code": "CIV",
                                    "flag": "🇨🇮"
                        },
                        "stadium": "BMO Field",
                        "city": "Toronto",
                        "country": "Canada",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "E"
            },
            {
                        "id": "match-035",
                        "date": "2026-06-21T00:00:00Z",
                        "team1": {
                                    "name": "Ecuador",
                                    "code": "ECU",
                                    "flag": "🇪🇨"
                        },
                        "team2": {
                                    "name": "Curaçao",
                                    "code": "CUR",
                                    "flag": "🇨🇼"
                        },
                        "stadium": "Arrowhead Stadium",
                        "city": "Kansas City, Missouri",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "E"
            },
            {
                        "id": "match-036",
                        "date": "2026-06-21T04:00:00Z",
                        "team1": {
                                    "name": "Tunisia",
                                    "code": "TUN",
                                    "flag": "🇹🇳"
                        },
                        "team2": {
                                    "name": "Japan",
                                    "code": "JPN",
                                    "flag": "🇯🇵"
                        },
                        "stadium": "Estadio BBVA",
                        "city": "Monterrey",
                        "country": "Mexico",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "F"
            },
            {
                        "id": "match-037",
                        "date": "2026-06-21T16:00:00Z",
                        "team1": {
                                    "name": "Spain",
                                    "code": "ESP",
                                    "flag": "🇪🇸"
                        },
                        "team2": {
                                    "name": "Saudi Arabia",
                                    "code": "SAU",
                                    "flag": "🇸🇦"
                        },
                        "stadium": "Mercedes-Benz Stadium",
                        "city": "Atlanta",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "H"
            },
            {
                        "id": "match-038",
                        "date": "2026-06-21T19:00:00Z",
                        "team1": {
                                    "name": "Belgium",
                                    "code": "BEL",
                                    "flag": "🇧🇪"
                        },
                        "team2": {
                                    "name": "Iran",
                                    "code": "IRN",
                                    "flag": "🇮🇷"
                        },
                        "stadium": "SoFi Stadium",
                        "city": "Inglewood, California",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "G"
            },
            {
                        "id": "match-039",
                        "date": "2026-06-21T22:00:00Z",
                        "team1": {
                                    "name": "Uruguay",
                                    "code": "URU",
                                    "flag": "🇺🇾"
                        },
                        "team2": {
                                    "name": "Cape Verde",
                                    "code": "CPV",
                                    "flag": "🇨🇻"
                        },
                        "stadium": "Hard Rock Stadium",
                        "city": "Miami",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "H"
            },
            {
                        "id": "match-040",
                        "date": "2026-06-22T01:00:00Z",
                        "team1": {
                                    "name": "New Zealand",
                                    "code": "NZL",
                                    "flag": "🇳🇿"
                        },
                        "team2": {
                                    "name": "Egypt",
                                    "code": "EGY",
                                    "flag": "🇪🇬"
                        },
                        "stadium": "BC Place",
                        "city": "Vancouver",
                        "country": "Canada",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "G"
            },
            {
                        "id": "match-041",
                        "date": "2026-06-22T17:00:00Z",
                        "team1": {
                                    "name": "Argentina",
                                    "code": "ARG",
                                    "flag": "🇦🇷"
                        },
                        "team2": {
                                    "name": "Austria",
                                    "code": "AUT",
                                    "flag": "🇦🇹"
                        },
                        "stadium": "AT&T Stadium",
                        "city": "Arlington, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "J"
            },
            {
                        "id": "match-042",
                        "date": "2026-06-22T21:00:00Z",
                        "team1": {
                                    "name": "France",
                                    "code": "FRA",
                                    "flag": "🇫🇷"
                        },
                        "team2": {
                                    "name": "Iraq",
                                    "code": "IRQ",
                                    "flag": "🇮🇶"
                        },
                        "stadium": "Lincoln Financial Field",
                        "city": "Philadelphia, Pennsylvania",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "I"
            },
            {
                        "id": "match-043",
                        "date": "2026-06-23T00:00:00Z",
                        "team1": {
                                    "name": "Norway",
                                    "code": "NOR",
                                    "flag": "🇳🇴"
                        },
                        "team2": {
                                    "name": "Senegal",
                                    "code": "SEN",
                                    "flag": "🇸🇳"
                        },
                        "stadium": "MetLife Stadium",
                        "city": "New York/New Jersey",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "I"
            },
            {
                        "id": "match-044",
                        "date": "2026-06-23T03:00:00Z",
                        "team1": {
                                    "name": "Jordan",
                                    "code": "JOR",
                                    "flag": "🇯🇴"
                        },
                        "team2": {
                                    "name": "Algeria",
                                    "code": "ALG",
                                    "flag": "🇩🇿"
                        },
                        "stadium": "Levi's Stadium",
                        "city": "Santa Clara, California",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "J"
            },
            {
                        "id": "match-045",
                        "date": "2026-06-23T17:00:00Z",
                        "team1": {
                                    "name": "Portugal",
                                    "code": "POR",
                                    "flag": "🇵🇹"
                        },
                        "team2": {
                                    "name": "Uzbekistan",
                                    "code": "UZB",
                                    "flag": "🇺🇿"
                        },
                        "stadium": "NRG Stadium",
                        "city": "Houston, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "K"
            },
            {
                        "id": "match-046",
                        "date": "2026-06-23T20:00:00Z",
                        "team1": {
                                    "name": "England",
                                    "code": "ENG",
                                    "flag": "🇬🇧"
                        },
                        "team2": {
                                    "name": "Ghana",
                                    "code": "GHA",
                                    "flag": "🇬🇭"
                        },
                        "stadium": "Gillette Stadium",
                        "city": "Foxborough, Massachusetts",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "L"
            },
            {
                        "id": "match-047",
                        "date": "2026-06-23T23:00:00Z",
                        "team1": {
                                    "name": "Panama",
                                    "code": "PAN",
                                    "flag": "🇵🇦"
                        },
                        "team2": {
                                    "name": "Croatia",
                                    "code": "CRO",
                                    "flag": "🇭🇷"
                        },
                        "stadium": "BMO Field",
                        "city": "Toronto",
                        "country": "Canada",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "L"
            },
            {
                        "id": "match-048",
                        "date": "2026-06-24T02:00:00Z",
                        "team1": {
                                    "name": "Colombia",
                                    "code": "COL",
                                    "flag": "🇨🇴"
                        },
                        "team2": {
                                    "name": "Congo DR",
                                    "code": "COD",
                                    "flag": "🇨🇩"
                        },
                        "stadium": "Estadio Akron",
                        "city": "Guadalajara",
                        "country": "Mexico",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "K"
            },
            {
                        "id": "match-049",
                        "date": "2026-06-24T19:00:00Z",
                        "team1": {
                                    "name": "Switzerland",
                                    "code": "SUI",
                                    "flag": "🇨🇭"
                        },
                        "team2": {
                                    "name": "Canada",
                                    "code": "CAN",
                                    "flag": "🇨🇦"
                        },
                        "stadium": "BC Place",
                        "city": "Vancouver",
                        "country": "Canada",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "B"
            },
            {
                        "id": "match-050",
                        "date": "2026-06-24T19:00:00Z",
                        "team1": {
                                    "name": "Bosnia & Herzegovina",
                                    "code": "BIH",
                                    "flag": "🇧🇦"
                        },
                        "team2": {
                                    "name": "Qatar",
                                    "code": "QAT",
                                    "flag": "🇶🇦"
                        },
                        "stadium": "Lumen Field",
                        "city": "Seattle",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Universo",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "B"
            },
            {
                        "id": "match-051",
                        "date": "2026-06-24T22:00:00Z",
                        "team1": {
                                    "name": "Morocco",
                                    "code": "MAR",
                                    "flag": "🇲🇦"
                        },
                        "team2": {
                                    "name": "Haiti",
                                    "code": "HTI",
                                    "flag": "🇭🇹"
                        },
                        "stadium": "Mercedes-Benz Stadium",
                        "city": "Atlanta",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Universo",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "C"
            },
            {
                        "id": "match-052",
                        "date": "2026-06-24T22:00:00Z",
                        "team1": {
                                    "name": "Brazil",
                                    "code": "BRA",
                                    "flag": "🇧🇷"
                        },
                        "team2": {
                                    "name": "Scotland",
                                    "code": "SCO",
                                    "flag": "🏴󠁧󠁢󠁳󠁣󠁴󠁿"
                        },
                        "stadium": "Hard Rock Stadium",
                        "city": "Miami",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "C"
            },
            {
                        "id": "match-053",
                        "date": "2026-06-25T01:00:00Z",
                        "team1": {
                                    "name": "South Africa",
                                    "code": "RSA",
                                    "flag": "🇿🇦"
                        },
                        "team2": {
                                    "name": "South Korea",
                                    "code": "KOR",
                                    "flag": "🇰🇷"
                        },
                        "stadium": "Estadio BBVA",
                        "city": "Monterrey",
                        "country": "Mexico",
                        "broadcast": [
                                    "FS1",
                                    "Universo",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "A"
            },
            {
                        "id": "match-054",
                        "date": "2026-06-25T01:00:00Z",
                        "team1": {
                                    "name": "Mexico",
                                    "code": "MEX",
                                    "flag": "🇲🇽"
                        },
                        "team2": {
                                    "name": "Czech Republic",
                                    "code": "CZE",
                                    "flag": "🇨🇿"
                        },
                        "stadium": "Estadio Azteca",
                        "city": "Mexico City",
                        "country": "Mexico",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "A"
            },
            {
                        "id": "match-055",
                        "date": "2026-06-25T20:00:00Z",
                        "team1": {
                                    "name": "Curaçao",
                                    "code": "CUR",
                                    "flag": "🇨🇼"
                        },
                        "team2": {
                                    "name": "Ivory Coast",
                                    "code": "CIV",
                                    "flag": "🇨🇮"
                        },
                        "stadium": "Lincoln Financial Field",
                        "city": "Philadelphia, Pennsylvania",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Universo",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "E"
            },
            {
                        "id": "match-056",
                        "date": "2026-06-25T20:00:00Z",
                        "team1": {
                                    "name": "Ecuador",
                                    "code": "ECU",
                                    "flag": "🇪🇨"
                        },
                        "team2": {
                                    "name": "Germany",
                                    "code": "GER",
                                    "flag": "🇩🇪"
                        },
                        "stadium": "MetLife Stadium",
                        "city": "New York/New Jersey",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "E"
            },
            {
                        "id": "match-057",
                        "date": "2026-06-25T23:00:00Z",
                        "team1": {
                                    "name": "Tunisia",
                                    "code": "TUN",
                                    "flag": "🇹🇳"
                        },
                        "team2": {
                                    "name": "Netherlands",
                                    "code": "NED",
                                    "flag": "🇳🇱"
                        },
                        "stadium": "Arrowhead Stadium",
                        "city": "Kansas City, Missouri",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "F"
            },
            {
                        "id": "match-058",
                        "date": "2026-06-25T23:00:00Z",
                        "team1": {
                                    "name": "Japan",
                                    "code": "JPN",
                                    "flag": "🇯🇵"
                        },
                        "team2": {
                                    "name": "Sweden",
                                    "code": "SWE",
                                    "flag": "🇸🇪"
                        },
                        "stadium": "AT&T Stadium",
                        "city": "Arlington, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Universo",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "F"
            },
            {
                        "id": "match-059",
                        "date": "2026-06-26T02:00:00Z",
                        "team1": {
                                    "name": "Paraguay",
                                    "code": "PAR",
                                    "flag": "🇵🇾"
                        },
                        "team2": {
                                    "name": "Australia",
                                    "code": "AUS",
                                    "flag": "🇦🇺"
                        },
                        "stadium": "Levi's Stadium",
                        "city": "Santa Clara, California",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Universo",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "D"
            },
            {
                        "id": "match-060",
                        "date": "2026-06-26T02:00:00Z",
                        "team1": {
                                    "name": "USA",
                                    "code": "USA",
                                    "flag": "🇺🇸"
                        },
                        "team2": {
                                    "name": "Türkiye",
                                    "code": "TUR",
                                    "flag": "🇹🇷"
                        },
                        "stadium": "SoFi Stadium",
                        "city": "Inglewood, California",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "D"
            },
            {
                        "id": "match-061",
                        "date": "2026-06-26T19:00:00Z",
                        "team1": {
                                    "name": "Norway",
                                    "code": "NOR",
                                    "flag": "🇳🇴"
                        },
                        "team2": {
                                    "name": "France",
                                    "code": "FRA",
                                    "flag": "🇫🇷"
                        },
                        "stadium": "Gillette Stadium",
                        "city": "Foxborough, Massachusetts",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "I"
            },
            {
                        "id": "match-062",
                        "date": "2026-06-26T19:00:00Z",
                        "team1": {
                                    "name": "Senegal",
                                    "code": "SEN",
                                    "flag": "🇸🇳"
                        },
                        "team2": {
                                    "name": "Iraq",
                                    "code": "IRQ",
                                    "flag": "🇮🇶"
                        },
                        "stadium": "BMO Field",
                        "city": "Toronto",
                        "country": "Canada",
                        "broadcast": [
                                    "FS1",
                                    "Universo",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "I"
            },
            {
                        "id": "match-063",
                        "date": "2026-06-27T00:00:00Z",
                        "team1": {
                                    "name": "Cape Verde",
                                    "code": "CPV",
                                    "flag": "🇨🇻"
                        },
                        "team2": {
                                    "name": "Saudi Arabia",
                                    "code": "SAU",
                                    "flag": "🇸🇦"
                        },
                        "stadium": "NRG Stadium",
                        "city": "Houston, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Universo",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "H"
            },
            {
                        "id": "match-064",
                        "date": "2026-06-27T00:00:00Z",
                        "team1": {
                                    "name": "Uruguay",
                                    "code": "URU",
                                    "flag": "🇺🇾"
                        },
                        "team2": {
                                    "name": "Spain",
                                    "code": "ESP",
                                    "flag": "🇪🇸"
                        },
                        "stadium": "Estadio Akron",
                        "city": "Guadalajara",
                        "country": "Mexico",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "H"
            },
            {
                        "id": "match-065",
                        "date": "2026-06-27T03:00:00Z",
                        "team1": {
                                    "name": "Egypt",
                                    "code": "EGY",
                                    "flag": "🇪🇬"
                        },
                        "team2": {
                                    "name": "Iran",
                                    "code": "IRN",
                                    "flag": "🇮🇷"
                        },
                        "stadium": "Lumen Field",
                        "city": "Seattle",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Universo",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "G"
            },
            {
                        "id": "match-066",
                        "date": "2026-06-27T03:00:00Z",
                        "team1": {
                                    "name": "New Zealand",
                                    "code": "NZL",
                                    "flag": "🇳🇿"
                        },
                        "team2": {
                                    "name": "Belgium",
                                    "code": "BEL",
                                    "flag": "🇧🇪"
                        },
                        "stadium": "BC Place",
                        "city": "Vancouver",
                        "country": "Canada",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "G"
            },
            {
                        "id": "match-067",
                        "date": "2026-06-27T21:00:00Z",
                        "team1": {
                                    "name": "Croatia",
                                    "code": "CRO",
                                    "flag": "🇭🇷"
                        },
                        "team2": {
                                    "name": "Ghana",
                                    "code": "GHA",
                                    "flag": "🇬🇭"
                        },
                        "stadium": "Lincoln Financial Field",
                        "city": "Philadelphia, Pennsylvania",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Universo",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "L"
            },
            {
                        "id": "match-068",
                        "date": "2026-06-27T21:00:00Z",
                        "team1": {
                                    "name": "Panama",
                                    "code": "PAN",
                                    "flag": "🇵🇦"
                        },
                        "team2": {
                                    "name": "England",
                                    "code": "ENG",
                                    "flag": "🇬🇧"
                        },
                        "stadium": "MetLife Stadium",
                        "city": "New York/New Jersey",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "L"
            },
            {
                        "id": "match-069",
                        "date": "2026-06-27T23:30:00Z",
                        "team1": {
                                    "name": "Colombia",
                                    "code": "COL",
                                    "flag": "🇨🇴"
                        },
                        "team2": {
                                    "name": "Portugal",
                                    "code": "POR",
                                    "flag": "🇵🇹"
                        },
                        "stadium": "Hard Rock Stadium",
                        "city": "Miami",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "K"
            },
            {
                        "id": "match-070",
                        "date": "2026-06-27T23:30:00Z",
                        "team1": {
                                    "name": "Congo DR",
                                    "code": "COD",
                                    "flag": "🇨🇩"
                        },
                        "team2": {
                                    "name": "Uzbekistan",
                                    "code": "UZB",
                                    "flag": "🇺🇿"
                        },
                        "stadium": "Mercedes-Benz Stadium",
                        "city": "Atlanta",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Universo",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "K"
            },
            {
                        "id": "match-071",
                        "date": "2026-06-28T02:00:00Z",
                        "team1": {
                                    "name": "Algeria",
                                    "code": "ALG",
                                    "flag": "🇩🇿"
                        },
                        "team2": {
                                    "name": "Austria",
                                    "code": "AUT",
                                    "flag": "🇦🇹"
                        },
                        "stadium": "Arrowhead Stadium",
                        "city": "Kansas City, Missouri",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Universo",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "J"
            },
            {
                        "id": "match-072",
                        "date": "2026-06-28T02:00:00Z",
                        "team1": {
                                    "name": "Jordan",
                                    "code": "JOR",
                                    "flag": "🇯🇴"
                        },
                        "team2": {
                                    "name": "Argentina",
                                    "code": "ARG",
                                    "flag": "🇦🇷"
                        },
                        "stadium": "AT&T Stadium",
                        "city": "Arlington, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Group Stage",
                        "group": "J"
            },
            {
                        "id": "match-073",
                        "date": "2026-06-28T19:00:00Z",
                        "team1": {
                                    "name": "Group A 2nd Place",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Group B 2nd Place",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "SoFi Stadium",
                        "city": "Inglewood, California",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-074",
                        "date": "2026-06-29T17:00:00Z",
                        "team1": {
                                    "name": "Group C Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Group F 2nd Place",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "NRG Stadium",
                        "city": "Houston, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-075",
                        "date": "2026-06-29T20:30:00Z",
                        "team1": {
                                    "name": "Group E Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "3rd Place Group A/B/C/D/F",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Gillette Stadium",
                        "city": "Foxborough, Massachusetts",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-076",
                        "date": "2026-06-30T01:00:00Z",
                        "team1": {
                                    "name": "Group F Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Group C 2nd Place",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Estadio BBVA",
                        "city": "Monterrey",
                        "country": "Mexico",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-077",
                        "date": "2026-06-30T17:00:00Z",
                        "team1": {
                                    "name": "Group E 2nd Place",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Group I 2nd Place",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "AT&T Stadium",
                        "city": "Arlington, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-078",
                        "date": "2026-06-30T21:00:00Z",
                        "team1": {
                                    "name": "Group I Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Third Place Group C/D/F/G/H",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "MetLife Stadium",
                        "city": "New York/New Jersey",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-079",
                        "date": "2026-07-01T01:00:00Z",
                        "team1": {
                                    "name": "Group A Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "3rd Place Group C/E/F/H/I",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Estadio Azteca",
                        "city": "Mexico City",
                        "country": "Mexico",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-080",
                        "date": "2026-07-01T16:00:00Z",
                        "team1": {
                                    "name": "Group L Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "3rd Place Group E/H/I/J/K",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Mercedes-Benz Stadium",
                        "city": "Atlanta",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-081",
                        "date": "2026-07-01T20:00:00Z",
                        "team1": {
                                    "name": "Group G Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "3rd Place Group A/E/H/I/J",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Lumen Field",
                        "city": "Seattle",
                        "country": "United States",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-082",
                        "date": "2026-07-02T00:00:00Z",
                        "team1": {
                                    "name": "Group D Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "3rd Place Group B/E/F/I/J",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Levi's Stadium",
                        "city": "Santa Clara, California",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-083",
                        "date": "2026-07-02T19:00:00Z",
                        "team1": {
                                    "name": "Group H Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Group J 2nd Place",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "SoFi Stadium",
                        "city": "Inglewood, California",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-084",
                        "date": "2026-07-02T23:00:00Z",
                        "team1": {
                                    "name": "Group K 2nd Place",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Group L 2nd Place",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "BMO Field",
                        "city": "Toronto",
                        "country": "Canada",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-085",
                        "date": "2026-07-03T03:00:00Z",
                        "team1": {
                                    "name": "Group B Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "3rd Place E/F/G/I/J",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "BC Place",
                        "city": "Vancouver",
                        "country": "Canada",
                        "broadcast": [
                                    "FS1",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-086",
                        "date": "2026-07-03T18:00:00Z",
                        "team1": {
                                    "name": "Group D 2nd Place",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Group G 2nd Place",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "AT&T Stadium",
                        "city": "Arlington, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-087",
                        "date": "2026-07-03T22:00:00Z",
                        "team1": {
                                    "name": "Group J Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Group H 2nd Place",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Hard Rock Stadium",
                        "city": "Miami",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-088",
                        "date": "2026-07-04T01:30:00Z",
                        "team1": {
                                    "name": "Group K Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "3rd Place D/E/I/J/L",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Arrowhead Stadium",
                        "city": "Kansas City, Missouri",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 32",
                        "group": ""
            },
            {
                        "id": "match-089",
                        "date": "2026-07-04T17:00:00Z",
                        "team1": {
                                    "name": "Round of 32 1 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Round of 32 3 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "NRG Stadium",
                        "city": "Houston, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 16",
                        "group": ""
            },
            {
                        "id": "match-090",
                        "date": "2026-07-04T21:00:00Z",
                        "team1": {
                                    "name": "Round of 32 2 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Round of 32 5 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Lincoln Financial Field",
                        "city": "Philadelphia, Pennsylvania",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 16",
                        "group": ""
            },
            {
                        "id": "match-091",
                        "date": "2026-07-05T20:00:00Z",
                        "team1": {
                                    "name": "Round of 32 4 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Round of 32 6 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "MetLife Stadium",
                        "city": "New York/New Jersey",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 16",
                        "group": ""
            },
            {
                        "id": "match-092",
                        "date": "2026-07-06T00:00:00Z",
                        "team1": {
                                    "name": "Round of 32 7 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Round of 32 8 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Estadio Banorte",
                        "city": "Mexico City",
                        "country": "Mexico",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 16",
                        "group": ""
            },
            {
                        "id": "match-093",
                        "date": "2026-07-06T19:00:00Z",
                        "team1": {
                                    "name": "Round of 32 11 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Round of 32 12 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "AT&T Stadium",
                        "city": "Arlington, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 16",
                        "group": ""
            },
            {
                        "id": "match-094",
                        "date": "2026-07-07T00:00:00Z",
                        "team1": {
                                    "name": "Round of 32 9 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Round of 32 10 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Lumen Field",
                        "city": "Seattle",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 16",
                        "group": ""
            },
            {
                        "id": "match-095",
                        "date": "2026-07-07T16:00:00Z",
                        "team1": {
                                    "name": "Round of 32 14 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Round of 32 16 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Mercedes-Benz Stadium",
                        "city": "Atlanta",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 16",
                        "group": ""
            },
            {
                        "id": "match-096",
                        "date": "2026-07-07T20:00:00Z",
                        "team1": {
                                    "name": "Round of 32 13 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Round of 32 15 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "BC Place",
                        "city": "Vancouver",
                        "country": "Canada",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Round of 16",
                        "group": ""
            },
            {
                        "id": "match-097",
                        "date": "2026-07-09T20:00:00Z",
                        "team1": {
                                    "name": "Round of 16 1 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Round of 16 2 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Gillette Stadium",
                        "city": "Foxborough, Massachusetts",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Quarterfinal",
                        "group": ""
            },
            {
                        "id": "match-098",
                        "date": "2026-07-10T19:00:00Z",
                        "team1": {
                                    "name": "Round of 16 5 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Round of 16 6 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "SoFi Stadium",
                        "city": "Inglewood, California",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Quarterfinal",
                        "group": ""
            },
            {
                        "id": "match-099",
                        "date": "2026-07-11T21:00:00Z",
                        "team1": {
                                    "name": "Round of 16 3 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Round of 16 4 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Hard Rock Stadium",
                        "city": "Miami",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Quarterfinal",
                        "group": ""
            },
            {
                        "id": "match-100",
                        "date": "2026-07-12T01:00:00Z",
                        "team1": {
                                    "name": "Round of 16 7 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Round of 16 8 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Arrowhead Stadium",
                        "city": "Kansas City, Missouri",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Quarterfinal",
                        "group": ""
            },
            {
                        "id": "match-101",
                        "date": "2026-07-14T19:00:00Z",
                        "team1": {
                                    "name": "Quarterfinal 1 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Quarterfinal 2 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "AT&T Stadium",
                        "city": "Arlington, Texas",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Semifinal",
                        "group": ""
            },
            {
                        "id": "match-102",
                        "date": "2026-07-15T19:00:00Z",
                        "team1": {
                                    "name": "Quarterfinal 3 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Quarterfinal 4 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Mercedes-Benz Stadium",
                        "city": "Atlanta",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Semifinal",
                        "group": ""
            },
            {
                        "id": "match-103",
                        "date": "2026-07-18T21:00:00Z",
                        "team1": {
                                    "name": "Semifinal 1 Loser",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Semifinal 2 Loser",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "Hard Rock Stadium",
                        "city": "Miami",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Third-place game",
                        "group": ""
            },
            {
                        "id": "match-104",
                        "date": "2026-07-19T19:00:00Z",
                        "team1": {
                                    "name": "Semifinal 1 Winner",
                                    "code": "TBD",
                                    "flag": "⚽"
                        },
                        "team2": {
                                    "name": "Semifinal 2 Winner",
                                    "code": "TBD",
                                    "flag": "🏴"
                        },
                        "stadium": "MetLife Stadium",
                        "city": "New York/New Jersey",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Tele",
                                    "Peacock"
                        ],
                        "stage": "Final",
                        "group": ""
            },
            {
                        "id": "halftime-001",
                        "date": "2026-07-19T20:00:00Z",
                        "team1": {
                                    "name": "🎉 World Cup Final",
                                    "code": "HALFTIME",
                                    "flag": ""
                        },
                        "team2": {
                                    "name": "Half-Time Show",
                                    "code": "FINAL",
                                    "flag": "🏆"
                        },
                        "stadium": "MetLife Stadium",
                        "city": "East Rutherford, New Jersey",
                        "country": "United States",
                        "broadcast": [
                                    "FOX",
                                    "Telemundo",
                                    "Peacock"
                        ],
                        "stage": "Halftime Show",
                        "group": "",
                        "description": "Performers: Shakira, Madonna, and BTS. Curator: Chris Martin (Coldplay)."
            }
];
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Timezone selector
        document.getElementById('timezone-selector').addEventListener('change', (e) => {
            this.currentTimezone = e.target.value;
            this.saveUserPreferences();
            this.renderMatches();
        });

        // View toggle
        document.getElementById('list-view-btn').addEventListener('click', () => {
            this.switchView('list');
        });

        document.getElementById('calendar-view-btn').addEventListener('click', () => {
            this.switchView('calendar');
        });

        // Download buttons
        document.getElementById('download-all-btn').addEventListener('click', () => {
            this.downloadAllMatches();
        });

        document.getElementById('download-selected-btn').addEventListener('click', () => {
            this.downloadSelectedMatches();
        });

        // Team filter
        document.getElementById('team-filter').addEventListener('change', () => {
            this.filterMatches();
        });

        // Calendar navigation
        document.getElementById('prev-month-btn').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.getElementById('next-month-btn').addEventListener('click', () => {
            this.changeMonth(1);
        });

        // Modal close
        const modal = document.getElementById('match-modal');
        const closeBtn = modal.querySelector('.modal-close');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    /**
     * Load user preferences from localStorage
     */
    loadUserPreferences() {
        const savedTimezone = localStorage.getItem('worldcup_timezone');
        const savedView = localStorage.getItem('worldcup_view');
        
        if (savedTimezone) {
            this.currentTimezone = savedTimezone;
            document.getElementById('timezone-selector').value = savedTimezone;
        } else {
            // Try to detect user's timezone
            const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const timezoneSelect = document.getElementById('timezone-selector');
            const options = Array.from(timezoneSelect.options);
            
            if (options.some(opt => opt.value === detectedTimezone)) {
                this.currentTimezone = detectedTimezone;
                timezoneSelect.value = detectedTimezone;
            }
        }

        if (savedView) {
            this.switchView(savedView);
        }
    }

    /**
     * Save user preferences to localStorage
     */
    saveUserPreferences() {
        localStorage.setItem('worldcup_timezone', this.currentTimezone);
        localStorage.setItem('worldcup_view', this.currentView);
    }

    /**
     * Switch between list and calendar views
     */
    switchView(view) {
        this.currentView = view;
        this.saveUserPreferences();

        const listView = document.getElementById('list-view');
        const calendarView = document.getElementById('calendar-view');
        const listBtn = document.getElementById('list-view-btn');
        const calendarBtn = document.getElementById('calendar-view-btn');

        if (view === 'list') {
            listView.style.display = 'block';
            calendarView.style.display = 'none';
            listBtn.classList.add('active');
            calendarBtn.classList.remove('active');
        } else {
            listView.style.display = 'none';
            calendarView.style.display = 'block';
            listBtn.classList.remove('active');
            calendarBtn.classList.add('active');
            this.renderCalendar();
        }
    }

    /**
     * Render matches based on current view
     */
    renderMatches() {
        if (this.currentView === 'list') {
            this.renderListView();
        } else {
            this.renderCalendar();
        }
    }

    /**
     * Render list view
     */
    renderListView() {
        const container = document.getElementById('matches-container');
        
        if (this.filteredMatches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No matches found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
            return;
        }

        // Group matches by day and add spacers for proper 2-column layout
        let html = '';
        let currentDate = '';
        let matchesInCurrentDay = 0;
        
        this.filteredMatches.forEach((match, index) => {
            const matchDate = this.formatDate(match.date);
            
            // Check if we're starting a new day
            if (matchDate !== currentDate) {
                // If previous day had odd number of matches, add a spacer
                if (matchesInCurrentDay % 2 === 1) {
                    html += '<div class="match-spacer"></div>';
                }
                // Add day separator line (except before first day)
                if (currentDate !== '') {
                    html += '<div class="day-separator"></div>';
                }
                currentDate = matchDate;
                matchesInCurrentDay = 0;
            }
            
            matchesInCurrentDay++;
            
            // Generate match card HTML
            const isSelected = this.selectedMatches.has(match.id);
            const isSpecialEvent = match.stage === 'Opening Ceremony' || match.stage === 'Halftime Show';
            const isPast = this.isMatchPast(match.date);
            const hasScore = match.team1.score !== undefined && match.team2.score !== undefined;
            const isFinished = hasScore || (isPast && match.status === 'finished');
            
            // Compact view for ALL past events (finished matches, past special events, or any past match)
            if (isPast) {
                html += `
                    <div class="match-card match-card-compact ${isSelected ? 'selected' : ''} ${isSpecialEvent ? 'special-event' : ''} past-match" data-match-id="${match.id}">
                        <span class="${hasScore ? 'final-badge' : 'past-label'}">${hasScore ? 'FINAL' : 'PAST'}</span>
                        <input
                            type="checkbox"
                            class="match-checkbox"
                            id="checkbox-${match.id}"
                            disabled
                        >
                        <div class="match-info-compact">
                            ${hasScore ? `
                            <div class="match-score-display">
                                <span class="team-score">${match.team1.flag} ${match.team1.name} <strong>${match.team1.score}</strong></span>
                                <span class="score-separator">-</span>
                                <span class="team-score"><strong>${match.team2.score}</strong> ${match.team2.name} ${match.team2.flag}</span>
                            </div>
                            ` : `
                            <div class="match-score-display">
                                <span class="team-score">${match.team1.flag} ${match.team1.name}</span>
                                <span class="vs">@</span>
                                <span class="team-score">${match.team2.name} ${match.team2.flag}</span>
                            </div>
                            `}
                            <div class="match-meta-compact">
                                <span class="time">🕐 ${this.formatTime(match.date)}</span>
                                <span class="venue">📍 ${match.stadium}</span>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Regular view for upcoming/ongoing matches
                html += `
                <div class="match-card ${isSelected ? 'selected' : ''} ${isSpecialEvent ? 'special-event' : ''} ${isPast ? 'past-match' : ''}" data-match-id="${match.id}">
                    ${isPast && !hasScore ? '<span class="past-label">PAST</span>' : ''}
                    <input
                        type="checkbox"
                        class="match-checkbox"
                        id="checkbox-${match.id}"
                        ${isSelected ? 'checked' : ''}
                        ${isPast ? 'disabled' : ''}
                    >
                    <div class="match-info">
                        <div class="match-teams">
                            <span class="team">${match.team1.flag} ${match.team1.name}</span>
                            <span class="vs">vs</span>
                            <span class="team">${match.team2.name} ${match.team2.flag}</span>
                        </div>
                        <div class="match-details">
                            <span class="date">📅 ${this.formatDate(match.date)}</span>
                            <span class="time">🕐 ${this.formatTime(match.date)}</span>
                        </div>
                        <div class="match-venue-broadcast">
                            <span class="match-venue">📍 ${match.stadium}, ${match.city}</span>
                            <span class="match-broadcast">📺 ${match.broadcast.join(', ')}</span>
                        </div>
                        <span class="match-stage">${match.stage}${match.group ? ' - Group ' + match.group : ''}</span>
                    </div>
                </div>
            `;
            }
        });
        
        // Add final spacer if needed
        if (matchesInCurrentDay % 2 === 1) {
            html += '<div class="match-spacer"></div>';
        }
        
        container.innerHTML = html;

        // Add event listeners to checkboxes
        container.querySelectorAll('.match-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const matchId = e.target.id.replace('checkbox-', '');
                this.toggleMatchSelection(matchId);
            });
        });

        // Add click listeners to cards
        container.querySelectorAll('.match-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('match-checkbox')) return;
                const matchId = card.dataset.matchId;
                this.showMatchDetails(matchId);
            });
        });
    }

    /**
     * Render calendar view
     */
    renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const monthYear = document.getElementById('calendar-month-year');
        
        // Update month/year display
        monthYear.textContent = this.currentMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });

        // Generate calendar
        const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
        const lastDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
        const startDay = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        // Day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let html = dayHeaders.map(day => 
            `<div class="calendar-day-header">${day}</div>`
        ).join('');

        // Previous month days
        const prevMonthLastDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            html += `<div class="calendar-day other-month">
                <div class="day-number">${prevMonthLastDay - i}</div>
            </div>`;
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), day);
            const dateStr = date.toISOString().split('T')[0];
            const dayMatches = this.filteredMatches.filter(match => {
                const matchDate = new Date(match.date);
                // Get the date in the user's timezone using Intl.DateTimeFormat
                const formatter = new Intl.DateTimeFormat('en-CA', {
                    timeZone: this.currentTimezone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
                const matchDateStr = formatter.format(matchDate); // Returns YYYY-MM-DD
                return matchDateStr === dateStr;
            });

            html += `<div class="calendar-day" data-date="${dateStr}">
                <div class="day-number">${day}</div>
                <div class="day-matches">
                    ${dayMatches.map(match => {
                        const isPast = this.isMatchPast(match.date);
                        const hasScore = match.team1.score !== undefined && match.team2.score !== undefined;
                        
                        if (hasScore) {
                            return `
                                <div class="calendar-match past-calendar-match" data-match-id="${match.id}">
                                    <span class="match-time">${this.formatTime(match.date)}</span>
                                    <span class="match-teams-short">${match.team1.flag} ${match.team1.score}-${match.team2.score} ${match.team2.flag}</span>
                                </div>
                            `;
                        }
                        
                        return `
                            <div class="calendar-match ${isPast ? 'past-calendar-match' : ''}" data-match-id="${match.id}">
                                <span class="match-time">${this.formatTime(match.date)}</span>
                                <span class="match-teams-short">${match.team1.flag} vs ${match.team2.flag}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>`;
        }

        // Next month days
        const remainingDays = 42 - (startDay + daysInMonth);
        for (let day = 1; day <= remainingDays; day++) {
            html += `<div class="calendar-day other-month">
                <div class="day-number">${day}</div>
            </div>`;
        }

        grid.innerHTML = html;

        // Add click listeners to calendar matches
        grid.querySelectorAll('.calendar-match').forEach(match => {
            match.addEventListener('click', (e) => {
                e.stopPropagation();
                const matchId = match.dataset.matchId;
                this.showMatchDetails(matchId);
            });
        });
    }

    /**
     * Change calendar month
     */
    changeMonth(delta) {
        this.currentMonth = new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth() + delta,
            1
        );
        this.renderCalendar();
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            timeZone: this.currentTimezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }

    /**
     * Format time for display with timezone abbreviation
     */
    formatTime(dateString) {
        const date = new Date(dateString);
        const timeString = new Intl.DateTimeFormat('en-US', {
            timeZone: this.currentTimezone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
        
        // Get timezone abbreviation
        const tzAbbr = this.getTimezoneAbbreviation(this.currentTimezone);
        
        return `${timeString} ${tzAbbr}`;
    }
    
    /**
     * Get timezone abbreviation from timezone identifier
     */
    getTimezoneAbbreviation(timezone) {
        const abbreviations = {
            'America/New_York': 'ET',
            'America/Chicago': 'CT',
            'America/Denver': 'MT',
            'America/Los_Angeles': 'PT',
            'America/Anchorage': 'AKT',
            'Pacific/Honolulu': 'HST',
            'Europe/London': 'GMT',
            'Europe/Paris': 'CET',
            'Europe/Berlin': 'CET',
            'Asia/Tokyo': 'JST',
            'Asia/Shanghai': 'CST',
            'Australia/Sydney': 'AEDT',
            'America/Mexico_City': 'CST',
            'America/Toronto': 'ET',
            'UTC': 'UTC'
        };
        
        return abbreviations[timezone] || 'Local';
    }

    /**
     * Check if a match is in the past (including 2 hour buffer for match duration)
     */
    isMatchPast(matchDate) {
        const now = new Date();
        const match = new Date(matchDate);
        // Add 2 hours to match time to account for game duration
        const matchEnd = new Date(match.getTime() + (2 * 60 * 60 * 1000));
        return now > matchEnd;
    }

    /**
     * Toggle match selection
     */
    toggleMatchSelection(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        // Don't allow selection of past matches
        if (match && this.isMatchPast(match.date)) {
            return;
        }
        
        if (this.selectedMatches.has(matchId)) {
            this.selectedMatches.delete(matchId);
        } else {
            this.selectedMatches.add(matchId);
        }
        
        this.updateSelectionCount();
        this.updateMatchCardStyle(matchId);
    }

    /**
     * Update match card style based on selection
     */
    updateMatchCardStyle(matchId) {
        const card = document.querySelector(`[data-match-id="${matchId}"]`);
        if (card) {
            if (this.selectedMatches.has(matchId)) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        }
    }

    /**
     * Select all matches (excluding past matches)
     */
    selectAllMatches() {
        this.filteredMatches.forEach(match => {
            if (!this.isMatchPast(match.date)) {
                this.selectedMatches.add(match.id);
            }
        });
        this.updateSelectionCount();
        this.renderMatches();
    }

    /**
     * Deselect all matches
     */
    deselectAllMatches() {
        this.selectedMatches.clear();
        this.updateSelectionCount();
        this.renderMatches();
    }

    /**
     * Update selection count display
     */
    updateSelectionCount() {
        const count = this.selectedMatches.size;
        const countElement = document.getElementById('selection-count');
        countElement.textContent = `${count} match${count !== 1 ? 'es' : ''} selected`;
    }

    /**
     * Filter matches based on search query and team filter
     */
    filterMatches() {
        const teamFilter = document.getElementById('team-filter').value;
        
        this.filteredMatches = this.matches.filter(match => {
            // Apply team filter
            const matchesTeam = !teamFilter ||
                match.team1.name === teamFilter ||
                match.team2.name === teamFilter;
            
            return matchesTeam;
        });
        
        this.renderMatches();
    }

    /**
     * Show match details in modal
     */
    showMatchDetails(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        if (!match) return;

        const modal = document.getElementById('match-modal');
        const modalBody = document.getElementById('modal-body');

        // Add performer info for special events
        const performerInfo = match.description ? `<p><strong>🎤 ${match.description}</strong></p>` : '';
        
        // Check if match is in the past
        const isPast = this.isMatchPast(match.date);
        const hasScore = match.team1.score !== undefined && match.team2.score !== undefined;
        
        // Title with score if available
        const titleDisplay = hasScore
            ? `<h2>${match.team1.flag} ${match.team1.name} <span style="color: #1a73e8; font-size: 2rem;">${match.team1.score}</span> - <span style="color: #1a73e8; font-size: 2rem;">${match.team2.score}</span> ${match.team2.name} ${match.team2.flag}</h2>
               <p style="color: #1e8e3e; font-weight: 700; font-size: 1.2rem; margin-top: 10px;">⚽ FINAL SCORE</p>`
            : `<h2>${match.team1.flag} ${match.team1.name} vs ${match.team2.name} ${match.team2.flag}</h2>`;
        
        const statusMessage = isPast && !hasScore
            ? '<p style="color: #9e9e9e; font-weight: 600; margin-top: 10px;">⏱️ This match has already occurred</p>'
            : '';
        
        const addButton = isPast ? '' : `
            <button class="btn btn-primary" onclick="app.toggleMatchSelection('${match.id}'); app.renderMatches(); document.getElementById('match-modal').style.display='none';">
                ${this.selectedMatches.has(match.id) ? '✗ Remove from Selection' : '✓ Add to Selection'}
            </button>
        `;
        
        modalBody.innerHTML = `
            ${titleDisplay}
            ${statusMessage}
            <div style="margin: 20px 0;">
                <p><strong>📅 Date:</strong> ${this.formatDate(match.date)}</p>
                <p><strong>🕐 Time:</strong> ${this.formatTime(match.date)}</p>
                <p><strong>📍 Stadium:</strong> ${match.stadium}</p>
                <p><strong>🌍 Location:</strong> ${match.city}, ${match.country}</p>
                <p><strong>📺 Watch on:</strong> ${match.broadcast.join(', ')}</p>
                <p><strong>🏆 Stage:</strong> ${match.stage}${match.group ? ' - Group ' + match.group : ''}</p>
                ${performerInfo}
            </div>
            ${addButton}
        `;

        modal.style.display = 'flex';
    }

    /**
     * Download all matches
     */
    downloadAllMatches() {
        this.icsGenerator.downloadAllMatches(this.matches, this.currentTimezone);
    }

    /**
     * Download selected matches
     */
    downloadSelectedMatches() {
        const selected = this.matches.filter(m => this.selectedMatches.has(m.id));
        this.icsGenerator.downloadSelectedMatches(selected, this.currentTimezone);
    }

    /**
     * Show error message
     */
    showError(message) {
        const container = document.getElementById('matches-container');
        container.innerHTML = `
            <div class="empty-state">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * Debounce function for search input
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new WorldCupCalendar();
});

// Made with Bob
