const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function fetchContributions(userName) {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is missing.');
  }

  const query = `
    query($userName: String!) {
      user(login: $userName) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;

  const variables = { userName };

  const data = JSON.stringify({ query, variables });

  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: '/graphql',
    method: 'POST',
    headers: {
      'Authorization': `bearer ${GITHUB_TOKEN}`,
      'User-Agent': 'Node.js Script',
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(body);
            if (parsed.errors) {
              reject(new Error(JSON.stringify(parsed.errors)));
            } else {
              const calendar = parsed.data.user.contributionsCollection.contributionCalendar;
              
              // Filter to last 6 months (approximately 26 weeks)
              const sixMonthsAgo = new Date();
              sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
              
              const filteredWeeks = calendar.weeks.filter(week => {
                if (week.contributionDays.length === 0) return false;
                const weekDate = new Date(week.contributionDays[0].date);
                return weekDate >= sixMonthsAgo;
              });
              
              // Recalculate total contributions for the filtered period
              const totalContributions = filteredWeeks.reduce((sum, week) => {
                return sum + week.contributionDays.reduce((daySum, day) => daySum + day.contributionCount, 0);
              }, 0);
              
              resolve({
                ...calendar,
                weeks: filteredWeeks,
                totalContributions: totalContributions
              });
            }
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

module.exports = fetchContributions;
