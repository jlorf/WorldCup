const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const https = require('https');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'worldcup2026-secret-key';
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

const EXTERNAL_CACHE_FILE = path.join(DATA_DIR, 'external_cache.json');
const LOCAL_RESULTS_FILE = path.join(DATA_DIR, 'local_results.json');

function fetchExternalResults() {
  return new Promise((resolve) => {
    const url = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          writeJSON(EXTERNAL_CACHE_FILE, json);
          console.log('External results fetched and cached');
          resolve(json);
        } catch (e) {
          console.log('External results not available yet, trying cache...');
          resolve(readJSON(EXTERNAL_CACHE_FILE, null));
        }
      });
    }).on('error', () => {
      console.log('Could not fetch external results, trying cache...');
      resolve(readJSON(EXTERNAL_CACHE_FILE, null));
    });
  });
}

function mapExternalToActualResults(externalData, matches) {
  if (!externalData || !externalData.matches) return {};
  
  const actualResults = {};
  const matchMap = {};
  
  matches.forEach(m => {
    const key = `${m.team1}-${m.team2}`;
    matchMap[key] = m.id;
  });
  
  externalData.matches.forEach(m => {
    if (!m.score || !m.score.ft) return;
    
    const team1 = m.team1;
    const team2 = m.team2;
    
    let matchId = matchMap[`${team1}-${team2}`] || matchMap[`${team2}-${team1}`];
    
    if (!matchId && m.group) {
      const groupLetter = m.group.replace('Group ', '');
      const groupMatches = matches.filter(x => x.group === groupLetter);
      const matching = groupMatches.find(x => 
        (x.team1 === team1 && x.team2 === team2) || 
        (x.team1 === team2 && x.team2 === team1)
      );
      if (matching) matchId = matching.id;
    }
    
    if (!matchId && m.num != null) {
      const numMatch = matches.find(x => x.id === m.num);
      if (numMatch) matchId = numMatch.id;
    }
    
    if (matchId) {
      actualResults[matchId] = {
        score1: m.score.ft[0],
        score2: m.score.ft[1]
      };
    }
  });
  
  return actualResults;
}

function ensureKnockoutMatchesExist() {
  const data = readJSON(matchesFile, { matches: [], results: {} });
  const hasKnockout = data.matches.some(m => m.id >= 73);
  if (!hasKnockout) {
    data.matches = data.matches.concat(knockoutMatchesData);
    writeJSON(matchesFile, data);
    console.log(`Added ${knockoutMatchesData.length} knockout matches to data`);
  }
}

function loadLocalResults(matches) {
  const local = readJSON(LOCAL_RESULTS_FILE, []);
  if (!Array.isArray(local) || local.length === 0) return {};
  
  console.log(`Loaded ${local.length} local manual matches`);
  return mapExternalToActualResults({ matches: local }, matches);
}

const usersFile = path.join(DATA_DIR, 'users.json');
const matchesFile = path.join(DATA_DIR, 'matches.json');

function readJSON(filePath, defaultValue = []) {
  if (!fs.existsSync(filePath)) {
    writeJSON(filePath, defaultValue);
    return defaultValue;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

const groupsData = [
  { id: 'A', teams: ['Mexico', 'South Africa', 'Czech Republic', 'South Korea'] },
  { id: 'B', teams: ['Canada', 'Bosnia & Herzegovina', 'Qatar', 'Switzerland'] },
  { id: 'C', teams: ['Brazil', 'Morocco', 'Haiti', 'Scotland'] },
  { id: 'D', teams: ['USA', 'Paraguay', 'Australia', 'Turkey'] },
  { id: 'E', teams: ['Germany', 'Ivory Coast', 'Curaçao', 'Ecuador'] },
  { id: 'F', teams: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'] },
  { id: 'G', teams: ['Belgium', 'Egypt', 'Iran', 'New Zealand'] },
  { id: 'H', teams: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'] },
  { id: 'I', teams: ['France', 'Senegal', 'Iraq', 'Norway'] },
  { id: 'J', teams: ['Argentina', 'Algeria', 'Austria', 'Jordan'] },
  { id: 'K', teams: ['Portugal', 'Uzbekistan', 'Colombia', 'DR Congo'] },
  { id: 'L', teams: ['England', 'Croatia', 'Ghana', 'Panama'] }
];

const matchesData = [
  { id: 1, group: 'A', team1: 'Mexico', team2: 'South Africa', date: '2026-06-11', time: '13:00' },
  { id: 2, group: 'A', team1: 'South Korea', team2: 'Czech Republic', date: '2026-06-11', time: '20:00' },
  { id: 3, group: 'A', team1: 'Czech Republic', team2: 'South Africa', date: '2026-06-18', time: '12:00' },
  { id: 4, group: 'A', team1: 'Mexico', team2: 'South Korea', date: '2026-06-18', time: '19:00' },
  { id: 5, group: 'A', team1: 'Czech Republic', team2: 'Mexico', date: '2026-06-24', time: '19:00' },
  { id: 6, group: 'A', team1: 'South Africa', team2: 'South Korea', date: '2026-06-24', time: '19:00' },
  { id: 7, group: 'B', team1: 'Canada', team2: 'Bosnia & Herzegovina', date: '2026-06-12', time: '15:00' },
  { id: 8, group: 'B', team1: 'Qatar', team2: 'Switzerland', date: '2026-06-13', time: '12:00' },
  { id: 9, group: 'B', team1: 'Switzerland', team2: 'Bosnia & Herzegovina', date: '2026-06-18', time: '12:00' },
  { id: 10, group: 'B', team1: 'Canada', team2: 'Qatar', date: '2026-06-18', time: '15:00' },
  { id: 11, group: 'B', team1: 'Switzerland', team2: 'Canada', date: '2026-06-24', time: '12:00' },
  { id: 12, group: 'B', team1: 'Bosnia & Herzegovina', team2: 'Qatar', date: '2026-06-24', time: '12:00' },
  { id: 13, group: 'C', team1: 'Brazil', team2: 'Morocco', date: '2026-06-13', time: '18:00' },
  { id: 14, group: 'C', team1: 'Haiti', team2: 'Scotland', date: '2026-06-13', time: '21:00' },
  { id: 15, group: 'C', team1: 'Scotland', team2: 'Morocco', date: '2026-06-19', time: '18:00' },
  { id: 16, group: 'C', team1: 'Brazil', team2: 'Haiti', date: '2026-06-19', time: '20:30' },
  { id: 17, group: 'C', team1: 'Scotland', team2: 'Brazil', date: '2026-06-24', time: '18:00' },
  { id: 18, group: 'C', team1: 'Morocco', team2: 'Haiti', date: '2026-06-24', time: '18:00' },
  { id: 19, group: 'D', team1: 'USA', team2: 'Paraguay', date: '2026-06-12', time: '18:00' },
  { id: 20, group: 'D', team1: 'Australia', team2: 'Turkey', date: '2026-06-13', time: '21:00' },
  { id: 21, group: 'D', team1: 'USA', team2: 'Australia', date: '2026-06-19', time: '12:00' },
  { id: 22, group: 'D', team1: 'Turkey', team2: 'Paraguay', date: '2026-06-19', time: '20:00' },
  { id: 23, group: 'D', team1: 'Turkey', team2: 'USA', date: '2026-06-25', time: '19:00' },
  { id: 24, group: 'D', team1: 'Paraguay', team2: 'Australia', date: '2026-06-25', time: '19:00' },
  { id: 25, group: 'E', team1: 'Germany', team2: 'Curaçao', date: '2026-06-14', time: '12:00' },
  { id: 26, group: 'E', team1: 'Ivory Coast', team2: 'Ecuador', date: '2026-06-14', time: '19:00' },
  { id: 27, group: 'E', team1: 'Germany', team2: 'Ivory Coast', date: '2026-06-20', time: '16:00' },
  { id: 28, group: 'E', team1: 'Ecuador', team2: 'Curaçao', date: '2026-06-20', time: '19:00' },
  { id: 29, group: 'E', team1: 'Curaçao', team2: 'Ivory Coast', date: '2026-06-25', time: '16:00' },
  { id: 30, group: 'E', team1: 'Ecuador', team2: 'Germany', date: '2026-06-25', time: '16:00' },
  { id: 31, group: 'F', team1: 'Netherlands', team2: 'Japan', date: '2026-06-14', time: '15:00' },
  { id: 32, group: 'F', team1: 'Sweden', team2: 'Tunisia', date: '2026-06-14', time: '20:00' },
  { id: 33, group: 'F', team1: 'Netherlands', team2: 'Sweden', date: '2026-06-20', time: '12:00' },
  { id: 34, group: 'F', team1: 'Tunisia', team2: 'Japan', date: '2026-06-20', time: '22:00' },
  { id: 35, group: 'F', team1: 'Japan', team2: 'Sweden', date: '2026-06-25', time: '18:00' },
  { id: 36, group: 'F', team1: 'Tunisia', team2: 'Netherlands', date: '2026-06-25', time: '18:00' },
  { id: 37, group: 'G', team1: 'Belgium', team2: 'Egypt', date: '2026-06-15', time: '12:00' },
  { id: 38, group: 'G', team1: 'Iran', team2: 'New Zealand', date: '2026-06-15', time: '18:00' },
  { id: 39, group: 'G', team1: 'Belgium', team2: 'Iran', date: '2026-06-21', time: '12:00' },
  { id: 40, group: 'G', team1: 'New Zealand', team2: 'Egypt', date: '2026-06-21', time: '18:00' },
  { id: 41, group: 'G', team1: 'Egypt', team2: 'Iran', date: '2026-06-26', time: '20:00' },
  { id: 42, group: 'G', team1: 'New Zealand', team2: 'Belgium', date: '2026-06-26', time: '20:00' },
  { id: 43, group: 'H', team1: 'Spain', team2: 'Cape Verde', date: '2026-06-15', time: '12:00' },
  { id: 44, group: 'H', team1: 'Saudi Arabia', team2: 'Uruguay', date: '2026-06-15', time: '18:00' },
  { id: 45, group: 'H', team1: 'Spain', team2: 'Saudi Arabia', date: '2026-06-21', time: '12:00' },
  { id: 46, group: 'H', team1: 'Uruguay', team2: 'Cape Verde', date: '2026-06-21', time: '18:00' },
  { id: 47, group: 'H', team1: 'Cape Verde', team2: 'Saudi Arabia', date: '2026-06-26', time: '19:00' },
  { id: 48, group: 'H', team1: 'Uruguay', team2: 'Spain', date: '2026-06-26', time: '18:00' },
  { id: 49, group: 'I', team1: 'France', team2: 'Senegal', date: '2026-06-16', time: '15:00' },
  { id: 50, group: 'I', team1: 'Iraq', team2: 'Norway', date: '2026-06-16', time: '18:00' },
  { id: 51, group: 'I', team1: 'France', team2: 'Iraq', date: '2026-06-22', time: '17:00' },
  { id: 52, group: 'I', team1: 'Norway', team2: 'Senegal', date: '2026-06-22', time: '20:00' },
  { id: 53, group: 'I', team1: 'Norway', team2: 'France', date: '2026-06-26', time: '15:00' },
  { id: 54, group: 'I', team1: 'Senegal', team2: 'Iraq', date: '2026-06-26', time: '15:00' },
  { id: 55, group: 'J', team1: 'Argentina', team2: 'Algeria', date: '2026-06-16', time: '20:00' },
  { id: 56, group: 'J', team1: 'Austria', team2: 'Jordan', date: '2026-06-16', time: '21:00' },
  { id: 57, group: 'J', team1: 'Argentina', team2: 'Austria', date: '2026-06-22', time: '12:00' },
  { id: 58, group: 'J', team1: 'Jordan', team2: 'Algeria', date: '2026-06-22', time: '20:00' },
  { id: 59, group: 'J', team1: 'Algeria', team2: 'Austria', date: '2026-06-27', time: '21:00' },
  { id: 60, group: 'J', team1: 'Jordan', team2: 'Argentina', date: '2026-06-27', time: '21:00' },
  { id: 61, group: 'K', team1: 'Portugal', team2: 'DR Congo', date: '2026-06-17', time: '12:00' },
  { id: 62, group: 'K', team1: 'Uzbekistan', team2: 'Colombia', date: '2026-06-17', time: '20:00' },
  { id: 63, group: 'K', team1: 'Portugal', team2: 'Uzbekistan', date: '2026-06-23', time: '12:00' },
  { id: 64, group: 'K', team1: 'Colombia', team2: 'DR Congo', date: '2026-06-23', time: '20:00' },
  { id: 65, group: 'K', team1: 'Colombia', team2: 'Portugal', date: '2026-06-27', time: '19:30' },
  { id: 66, group: 'K', team1: 'DR Congo', team2: 'Uzbekistan', date: '2026-06-27', time: '19:30' },
  { id: 67, group: 'L', team1: 'England', team2: 'Croatia', date: '2026-06-17', time: '15:00' },
  { id: 68, group: 'L', team1: 'Ghana', team2: 'Panama', date: '2026-06-17', time: '19:00' },
  { id: 69, group: 'L', team1: 'England', team2: 'Ghana', date: '2026-06-23', time: '16:00' },
  { id: 70, group: 'L', team1: 'Panama', team2: 'Croatia', date: '2026-06-23', time: '19:00' },
  { id: 71, group: 'L', team1: 'Panama', team2: 'England', date: '2026-06-27', time: '17:00' },
  { id: 72, group: 'L', team1: 'Croatia', team2: 'Ghana', date: '2026-06-27', time: '17:00' }
];

const knockoutMatchesData = [
  { id: 73, round: 'Round of 32', team1: '2A', team2: '2B', date: '2026-06-28', time: '12:00' },
  { id: 74, round: 'Round of 32', team1: '1E', team2: '3A/B/C/D/F', date: '2026-06-29', time: '16:30' },
  { id: 75, round: 'Round of 32', team1: '1F', team2: '2C', date: '2026-06-29', time: '19:00' },
  { id: 76, round: 'Round of 32', team1: '1C', team2: '2F', date: '2026-06-29', time: '12:00' },
  { id: 77, round: 'Round of 32', team1: '1I', team2: '3C/D/F/G/H', date: '2026-06-30', time: '17:00' },
  { id: 78, round: 'Round of 32', team1: '2E', team2: '2I', date: '2026-06-30', time: '12:00' },
  { id: 79, round: 'Round of 32', team1: '1A', team2: '3C/E/F/H/I', date: '2026-06-30', time: '19:00' },
  { id: 80, round: 'Round of 32', team1: '1L', team2: '3E/H/I/J/K', date: '2026-07-01', time: '12:00' },
  { id: 81, round: 'Round of 32', team1: '1D', team2: '3B/E/F/I/J', date: '2026-07-01', time: '17:00' },
  { id: 82, round: 'Round of 32', team1: '1G', team2: '3A/E/H/I/J', date: '2026-07-01', time: '13:00' },
  { id: 83, round: 'Round of 32', team1: '2K', team2: '2L', date: '2026-07-02', time: '19:00' },
  { id: 84, round: 'Round of 32', team1: '1H', team2: '2J', date: '2026-07-02', time: '12:00' },
  { id: 85, round: 'Round of 32', team1: '1B', team2: '3E/F/G/I/J', date: '2026-07-02', time: '20:00' },
  { id: 86, round: 'Round of 32', team1: '1J', team2: '2H', date: '2026-07-03', time: '18:00' },
  { id: 87, round: 'Round of 32', team1: '1K', team2: '3D/E/I/J/L', date: '2026-07-03', time: '20:30' },
  { id: 88, round: 'Round of 32', team1: '2D', team2: '2G', date: '2026-07-03', time: '13:00' },
  { id: 89, round: 'Round of 16', team1: 'W74', team2: 'W77', date: '2026-07-04', time: '17:00' },
  { id: 90, round: 'Round of 16', team1: 'W73', team2: 'W75', date: '2026-07-04', time: '12:00' },
  { id: 91, round: 'Round of 16', team1: 'W76', team2: 'W78', date: '2026-07-05', time: '16:00' },
  { id: 92, round: 'Round of 16', team1: 'W79', team2: 'W80', date: '2026-07-05', time: '18:00' },
  { id: 93, round: 'Round of 16', team1: 'W83', team2: 'W84', date: '2026-07-06', time: '14:00' },
  { id: 94, round: 'Round of 16', team1: 'W81', team2: 'W82', date: '2026-07-06', time: '17:00' },
  { id: 95, round: 'Round of 16', team1: 'W86', team2: 'W88', date: '2026-07-07', time: '12:00' },
  { id: 96, round: 'Round of 16', team1: 'W85', team2: 'W87', date: '2026-07-07', time: '13:00' },
  { id: 97, round: 'Quarter-final', team1: 'W89', team2: 'W90', date: '2026-07-09', time: '16:00' },
  { id: 98, round: 'Quarter-final', team1: 'W93', team2: 'W94', date: '2026-07-10', time: '12:00' },
  { id: 99, round: 'Quarter-final', team1: 'W91', team2: 'W92', date: '2026-07-11', time: '17:00' },
  { id: 100, round: 'Quarter-final', team1: 'W95', team2: 'W96', date: '2026-07-11', time: '20:00' },
  { id: 101, round: 'Semi-final', team1: 'W97', team2: 'W98', date: '2026-07-14', time: '14:00' },
  { id: 102, round: 'Semi-final', team1: 'W99', team2: 'W100', date: '2026-07-15', time: '15:00' },
  { id: 103, round: 'Match for third place', team1: 'L101', team2: 'L102', date: '2026-07-18', time: '17:00' },
  { id: 104, round: 'Final', team1: 'W101', team2: 'W102', date: '2026-07-19', time: '15:00' }
];

const knockoutRoundsData = [
  { id: 'R32', name: 'Setzens de final', matchIds: [73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88] },
  { id: 'R16', name: 'Vuitens de final', matchIds: [89,90,91,92,93,94,95,96] },
  { id: 'QF', name: 'Quarts de final', matchIds: [97,98,99,100] },
  { id: 'SF', name: 'Semifinals', matchIds: [101,102] },
  { id: '3rd', name: 'Tercer lloc', matchIds: [103] },
  { id: 'F', name: 'Final', matchIds: [104] }
];

if (!fs.existsSync(matchesFile)) {
  writeJSON(matchesFile, { matches: [...matchesData, ...knockoutMatchesData], results: {} });
}

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const users = readJSON(usersFile, []);
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ id: Date.now().toString(), username, password: hashedPassword });
  writeJSON(usersFile, users);
  res.json({ message: 'User registered successfully' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(usersFile, []);
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username });
});

app.get('/api/groups', (req, res) => {
  res.json(groupsData);
});

app.get('/api/matches/:group', (req, res) => {
  const { group } = req.params;
  const data = readJSON(matchesFile, { matches: [], results: {} });
  const groupMatches = data.matches.filter(m => m.group === group);
  const results = data.results || {};
  const matchesWithResults = groupMatches.map(m => ({
    ...m,
    userResults: Object.keys(results).reduce((acc, userId) => {
      if (results[userId][m.id]) {
        acc[userId] = { ...results[userId][m.id], username: results[userId][m.id].username };
      }
      return acc;
    }, {})
  }));
  res.json(matchesWithResults);
});

app.get('/api/matches', (req, res) => {
  const data = readJSON(matchesFile, { matches: [], results: {} });
  const results = data.results || {};
  const matchesWithResults = data.matches.map(m => ({
    ...m,
    userResults: Object.keys(results).reduce((acc, userId) => {
      if (results[userId][m.id]) {
        acc[userId] = { ...results[userId][m.id], username: results[userId][m.id].username };
      }
      return acc;
    }, {})
  }));
  res.json(matchesWithResults);
});

app.get('/api/knockout/rounds', (req, res) => {
  const data = readJSON(matchesFile, { matches: [], results: {}, actualResults: {} });
  const results = data.results || {};
  const actualResults = data.actualResults || {};
  
  const roundsWithMatches = knockoutRoundsData.map(round => {
    const matches = round.matchIds.map(id => {
      const match = data.matches.find(m => m.id === id);
      if (!match) return null;
      return {
        ...match,
        actualResult: actualResults[id] || null,
        userResults: Object.keys(results).reduce((acc, userId) => {
          if (results[userId][id]) {
            acc[userId] = { ...results[userId][id], username: results[userId][id].username };
          }
          return acc;
        }, {})
      };
    }).filter(Boolean);
    return { ...round, matches };
  });
  
  res.json(roundsWithMatches);
});

app.get('/api/summary', (req, res) => {
  const data = readJSON(matchesFile, { matches: [], results: {}, actualResults: {} });
  const results = data.results || {};
  const actualResults = data.actualResults || {};
  const roundNames = {
    'Round of 32': 'Setzens de final',
    'Round of 16': 'Vuitens de final',
    'Quarter-final': 'Quarts de final',
    'Semi-final': 'Semifinals',
    'Match for third place': 'Tercer lloc',
    'Final': 'Final'
  };
  
  const summaries = data.matches.map(m => {
    const actual = actualResults[m.id] || null;
    const matchGroup = m.group || roundNames[m.round] || m.round || '';
    return {
      ...m,
      group: matchGroup,
      actualResult: actual,
      userResults: Object.keys(results).reduce((acc, userId) => {
        if (results[userId][m.id]) {
          const pred = results[userId][m.id];
          let points = null;
          if (actual) {
            if (pred.score1 === actual.score1 && pred.score2 === actual.score2) {
              points = 3;
            } else {
              const predDiff = pred.score1 - pred.score2;
              const actualDiff = actual.score1 - actual.score2;
              const predWinner = predDiff > 0 ? 1 : (predDiff < 0 ? -1 : 0);
              const actualWinner = actualDiff > 0 ? 1 : (actualDiff < 0 ? -1 : 0);
              points = predWinner === actualWinner ? 1 : 0;
            }
          }
          acc[userId] = { ...pred, username: pred.username, points };
        }
        return acc;
      }, {})
    };
  });
  res.json(summaries);
});

app.post('/api/results', authenticate, (req, res) => {
  const { matchId, score1, score2 } = req.body;
  const data = readJSON(matchesFile, { matches: [], results: {} });
  if (!data.results[req.user.id]) {
    data.results[req.user.id] = {};
  }
  data.results[req.user.id][matchId] = {
    score1,
    score2,
    username: req.user.username,
    updatedAt: new Date().toISOString()
  };
  writeJSON(matchesFile, data);
  res.json({ message: 'Result saved successfully' });
});

app.put('/api/results', authenticate, (req, res) => {
  const { matchId, score1, score2 } = req.body;
  const data = readJSON(matchesFile, { matches: [], results: {} });
  if (!data.results[req.user.id] || !data.results[req.user.id][matchId]) {
    return res.status(404).json({ error: 'Result not found' });
  }
  data.results[req.user.id][matchId] = {
    score1,
    score2,
    username: req.user.username,
    updatedAt: new Date().toISOString()
  };
  writeJSON(matchesFile, data);
  res.json({ message: 'Result updated successfully' });
});

app.delete('/api/results/:matchId', authenticate, (req, res) => {
  const { matchId } = req.params;
  const data = readJSON(matchesFile, { matches: [], results: {} });
  if (!data.results[req.user.id] || !data.results[req.user.id][matchId]) {
    return res.status(404).json({ error: 'Result not found' });
  }
  delete data.results[req.user.id][matchId];
  writeJSON(matchesFile, data);
  res.json({ message: 'Result deleted successfully' });
});

app.get('/api/verify', authenticate, (req, res) => {
  res.json({ valid: true, username: req.user.username });
});

app.post('/api/sync-results', async (req, res) => {
  const data = readJSON(matchesFile, { matches: [], results: {}, actualResults: {} });
  const matches = data.matches;
  
  const externalData = await fetchExternalResults();
  
  if (externalData) {
    const externalResults = mapExternalToActualResults(externalData, matches);
    data.actualResults = { ...data.actualResults, ...externalResults };
    console.log(`Synced ${Object.keys(externalResults).length} external results`);
  }
  
  const localResults = loadLocalResults(matches);
  if (Object.keys(localResults).length > 0) {
    data.actualResults = { ...data.actualResults, ...localResults };
    console.log(`Merged ${Object.keys(localResults).length} local manual results`);
  }
  
  const actualResults = data.actualResults || {};
  const results = data.results || {};
  const users = readJSON(usersFile, []);
  
  const rankings = Object.entries(results).map(([userId, predictions]) => {
    const user = users.find(u => u.id === userId);
    const username = user ? user.username : 'Unknown';
    const points = calculatePoints(predictions, actualResults);
    return { userId, username, points };
  });
  
  rankings.sort((a, b) => b.points - a.points);
  writeJSON(path.join(DATA_DIR, 'ranking.json'), rankings);
  
  writeJSON(matchesFile, data);
  res.json({ 
    message: 'Results synced and ranking updated', 
    externalResultsCount: externalData ? Object.keys(data.actualResults || {}).length : 0,
    rankings 
  });
});

app.post('/api/actual-results', authenticate, (req, res) => {
  const { matchId, score1, score2 } = req.body;
  const data = readJSON(matchesFile, { matches: [], results: {}, actualResults: {} });
  
  if (!data.actualResults) {
    data.actualResults = {};
  }
  
  data.actualResults[matchId] = { score1, score2 };
  
  const actualResults = data.actualResults;
  const results = data.results || {};
  const users = readJSON(usersFile, []);
  
  const rankings = Object.entries(results).map(([userId, predictions]) => {
    const user = users.find(u => u.id === userId);
    const username = user ? user.username : 'Unknown';
    const points = calculatePoints(predictions, actualResults);
    return { userId, username, points };
  });
  
  rankings.sort((a, b) => b.points - a.points);
  writeJSON(path.join(DATA_DIR, 'ranking.json'), rankings);
  
  writeJSON(matchesFile, data);
  res.json({ message: 'Actual result saved and ranking updated', rankings });
});

function calculatePoints(userPredictions, actualResults) {
  let points = 0;
  for (const [matchId, prediction] of Object.entries(userPredictions)) {
    const actual = actualResults[matchId];
    if (!actual) continue;
    
    if (prediction.score1 === actual.score1 && prediction.score2 === actual.score2) {
      points += 3;
    } else {
      const predDiff = prediction.score1 - prediction.score2;
      const actualDiff = actual.score1 - actual.score2;
      
      const predWinner = predDiff > 0 ? 1 : (predDiff < 0 ? -1 : 0);
      const actualWinner = actualDiff > 0 ? 1 : (actualDiff < 0 ? -1 : 0);
      
      if (predWinner === actualWinner) {
        points += 1;
      }
    }
  }
  return points;
}

app.get('/api/ranking', async (req, res) => {
  const data = readJSON(matchesFile, { matches: [], results: {}, actualResults: {} });
  const matches = data.matches;

  const externalData = await fetchExternalResults();
  if (externalData) {
    const externalResults = mapExternalToActualResults(externalData, matches);
    const newResults = {};
    Object.keys(externalResults).forEach(key => {
      if (!data.actualResults || !data.actualResults[key]) {
        newResults[key] = externalResults[key];
      }
    });
    if (Object.keys(newResults).length > 0) {
      data.actualResults = { ...data.actualResults, ...newResults };
    }
  }

  const localResults = loadLocalResults(matches);
  if (Object.keys(localResults).length > 0) {
    data.actualResults = { ...data.actualResults, ...localResults };
  }

  const actualResults = data.actualResults || {};
  const results = data.results || {};
  const users = readJSON(usersFile, []);
  
  const rankings = Object.entries(results).map(([userId, predictions]) => {
    const user = users.find(u => u.id === userId);
    const username = user ? user.username : 'Unknown';
    const points = calculatePoints(predictions, actualResults);
    return { userId, username, points };
  });
  
  rankings.sort((a, b) => b.points - a.points);
  writeJSON(path.join(DATA_DIR, 'ranking.json'), rankings);
  writeJSON(matchesFile, data);
  res.json(rankings);
});

app.post('/api/calculate-ranking', authenticate, (req, res) => {
  const data = readJSON(matchesFile, { matches: [], results: {}, actualResults: {} });
  const actualResults = data.actualResults || {};
  const results = data.results || {};
  const users = readJSON(usersFile, []);
  
  const rankings = Object.entries(results).map(([userId, predictions]) => {
    const user = users.find(u => u.id === userId);
    const username = user ? user.username : 'Unknown';
    const points = calculatePoints(predictions, actualResults);
    return { userId, username, points };
  });
  
  rankings.sort((a, b) => b.points - a.points);
  writeJSON(path.join(DATA_DIR, 'ranking.json'), rankings);
  res.json({ message: 'Ranking calculated and saved', rankings });
});

async function syncOnStartup() {
  console.log('Syncing external results on startup...');
  try {
    ensureKnockoutMatchesExist();
    const data = readJSON(matchesFile, { matches: [], results: {}, actualResults: {} });
    const matches = data.matches;
    
    const externalData = await fetchExternalResults();
    
    if (externalData) {
      const externalResults = mapExternalToActualResults(externalData, matches);
      data.actualResults = { ...data.actualResults, ...externalResults };
      console.log(`Synced ${Object.keys(externalResults).length} external results`);
    } else {
      console.log('Using cached/fallback external results');
    }
    
    const localResults = loadLocalResults(matches);
    if (Object.keys(localResults).length > 0) {
      data.actualResults = { ...data.actualResults, ...localResults };
      console.log(`Merged ${Object.keys(localResults).length} local manual results`);
    }
    
    const actualResults = data.actualResults || {};
    const results = data.results || {};
    const users = readJSON(usersFile, []);
    
    const rankings = Object.entries(results).map(([userId, predictions]) => {
      const user = users.find(u => u.id === userId);
      const username = user ? user.username : 'Unknown';
      const points = calculatePoints(predictions, actualResults);
      return { userId, username, points };
    });
    
    rankings.sort((a, b) => b.points - a.points);
    writeJSON(path.join(DATA_DIR, 'ranking.json'), rankings);
    
    writeJSON(matchesFile, data);
  } catch (e) {
    console.log('Startup sync failed:', e.message);
  }
}

syncOnStartup().then(() => {
  setInterval(async () => {
    console.log('Daily sync of external results...');
    try {
      const data = readJSON(matchesFile, { matches: [], results: {}, actualResults: {} });
      const matches = data.matches;
      
      const externalData = await fetchExternalResults();
      
      if (externalData) {
        const externalResults = mapExternalToActualResults(externalData, matches);
        const newResults = {};
        Object.keys(externalResults).forEach(key => {
          if (!data.actualResults || !data.actualResults[key]) {
            newResults[key] = externalResults[key];
          }
        });
        
        if (Object.keys(newResults).length > 0) {
          data.actualResults = { ...data.actualResults, ...newResults };
          console.log(`New external results found: ${Object.keys(newResults).length}`);
        } else {
          console.log('No new external results');
        }
      } else {
        console.log('Using cached/fallback external results');
      }
      
      const localResults = loadLocalResults(matches);
      if (Object.keys(localResults).length > 0) {
        data.actualResults = { ...data.actualResults, ...localResults };
        console.log(`Merged ${Object.keys(localResults).length} local manual results`);
      }
      
      const actualResults = data.actualResults || {};
      const results = data.results || {};
      const users = readJSON(usersFile, []);
      
      const rankings = Object.entries(results).map(([userId, predictions]) => {
        const user = users.find(u => u.id === userId);
        const username = user ? user.username : 'Unknown';
        const points = calculatePoints(predictions, actualResults);
        return { userId, username, points };
      });
      
      rankings.sort((a, b) => b.points - a.points);
      writeJSON(path.join(DATA_DIR, 'ranking.json'), rankings);
      writeJSON(matchesFile, data);
    } catch (e) {
      console.log('Daily sync failed:', e.message);
    }
  }, 24 * 60 * 60 * 1000);
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});