#!/usr/bin/env node

/**
 * Validate school deadline data by checking website reachability
 * and scanning for deadline-related keywords.
 *
 * Usage: node scripts/validateDeadlines.js
 * Output: scripts/validation-report.json
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'src', 'data', 'enhanced_german_art_schools.json');
const REPORT_PATH = path.join(__dirname, 'validation-report.json');
const REQUEST_TIMEOUT = 10000; // 10 seconds

const DEADLINE_KEYWORDS = [
  'bewerbung', 'bewerbungsfrist', 'application', 'deadline',
  'sommersemester', 'wintersemester', 'mappenberatung',
  'mappe', 'portfolio', 'aufnahmeprüfung', 'eignungsprüfung',
  'zulassung', 'immatrikulation', 'einschreibung',
  'anmeldung', 'frist', 'termin',
];

const USER_AGENT = 'GermanArtSchools-DeadlineValidator/1.0 (https://github.com)';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      headers: { 'User-Agent': USER_AGENT },
      timeout: REQUEST_TIMEOUT,
    };

    const req = protocol.get(url, options, (res) => {
      // Follow redirects (up to 3)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        fetchPage(redirectUrl).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        resolve({ reachable: false, statusCode: res.statusCode, body: '' });
        return;
      }

      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ reachable: true, statusCode: 200, body });
      });
    });

    req.on('error', (err) => {
      resolve({ reachable: false, statusCode: 0, body: '', error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ reachable: false, statusCode: 0, body: '', error: 'timeout' });
    });
  });
}

function findKeywords(html) {
  const lower = html.toLowerCase();
  return DEADLINE_KEYWORDS.filter((kw) => lower.includes(kw));
}

function detectPossibleChanges(html, school) {
  const changes = [];
  const lower = html.toLowerCase();

  // Check for "new" deadline patterns
  const yearPatterns = ['2026', '2027'];
  for (const year of yearPatterns) {
    if (lower.includes(`bewerbungsfrist ${year}`) || lower.includes(`deadline ${year}`)) {
      changes.push(`Found deadline reference for ${year}`);
    }
  }

  // Check for closed/ended application notices
  const closedPatterns = ['bewerbung geschlossen', 'application closed', 'nicht mehr möglich', 'abgelaufen'];
  for (const pattern of closedPatterns) {
    if (lower.includes(pattern)) {
      changes.push(`Found "${pattern}" — application may be closed`);
    }
  }

  // Check if website mentions semester-specific dates
  const datePatterns = /(\d{1,2})\.\s*(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)/gi;
  const matches = html.match(datePatterns);
  if (matches && matches.length > 0) {
    changes.push(`Found ${matches.length} German-format date(s) on page`);
  }

  return changes;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('Loading school data...');
  const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
  const data = JSON.parse(rawData);
  const universities = data.universities;

  const results = [];
  let unreachableCount = 0;
  const schoolNames = Object.keys(universities);

  console.log(`Validating ${schoolNames.length} schools...\n`);

  for (const name of schoolNames) {
    const school = universities[name];
    const url = school.website;

    if (!url) {
      results.push({
        school: name,
        url: 'N/A',
        reachable: false,
        deadlineKeywordsFound: [],
        possibleChanges: ['No website URL in data'],
      });
      unreachableCount++;
      continue;
    }

    process.stdout.write(`  Checking ${name}... `);

    const response = await fetchPage(url);

    const result = {
      school: name,
      url,
      reachable: response.reachable,
      statusCode: response.statusCode,
      deadlineKeywordsFound: [],
      possibleChanges: [],
    };

    if (response.reachable) {
      result.deadlineKeywordsFound = findKeywords(response.body);
      result.possibleChanges = detectPossibleChanges(response.body, school);
      console.log(`OK (${result.deadlineKeywordsFound.length} keywords found)`);
    } else {
      unreachableCount++;
      result.possibleChanges.push(`Site unreachable: ${response.error || `HTTP ${response.statusCode}`}`);
      console.log(`UNREACHABLE (${response.error || response.statusCode})`);
    }

    results.push(result);

    // Rate limit: 500ms between requests
    await sleep(500);
  }

  const report = {
    timestamp: new Date().toISOString(),
    totalSchools: schoolNames.length,
    reachable: schoolNames.length - unreachableCount,
    unreachable: unreachableCount,
    results,
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to ${REPORT_PATH}`);
  console.log(`Results: ${report.reachable}/${report.totalSchools} reachable, ${unreachableCount} unreachable`);

  // Generate issue body if problems found
  if (unreachableCount > 0) {
    const issueBody = generateIssueBody(report);
    fs.writeFileSync(path.join(__dirname, 'validation-issue.md'), issueBody);
    console.log('\nIssue body saved to scripts/validation-issue.md');
  }

  process.exit(unreachableCount > 0 ? 1 : 0);
}

function generateIssueBody(report) {
  const lines = [
    `## Deadline Validation Report — ${report.timestamp.split('T')[0]}`,
    '',
    `**${report.reachable}/${report.totalSchools}** school websites reachable.`,
    '',
  ];

  const unreachable = report.results.filter((r) => !r.reachable);
  if (unreachable.length > 0) {
    lines.push('### Unreachable Websites');
    lines.push('');
    for (const r of unreachable) {
      lines.push(`- **${r.school}** — ${r.url}`);
      for (const c of r.possibleChanges) {
        lines.push(`  - ${c}`);
      }
    }
    lines.push('');
  }

  const withChanges = report.results.filter((r) => r.reachable && r.possibleChanges.length > 0);
  if (withChanges.length > 0) {
    lines.push('### Possible Changes Detected');
    lines.push('');
    for (const r of withChanges) {
      lines.push(`- **${r.school}** — ${r.url}`);
      for (const c of r.possibleChanges) {
        lines.push(`  - ${c}`);
      }
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('*Auto-generated by deadline validation workflow*');

  return lines.join('\n');
}

main().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
