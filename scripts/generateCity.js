const fs = require('fs');
const path = require('path');
const fetchContributions = require('./fetchContributions');
const renderSVG = require('./svgRenderer');

async function main() {
  const userName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[0] : 'Manaswin05';
  
  console.log(`Fetching contributions for ${userName}...`);
  try {
    const calendar = await fetchContributions(userName);
    console.log(`Successfully fetched ${calendar.totalContributions} total contributions.`);

    console.log('Rendering SVG...');
    const svg = renderSVG(calendar);

    const outDir = path.join(__dirname, '..', 'assets', 'city');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outFile = path.join(outDir, 'skyline.svg');
    fs.writeFileSync(outFile, svg, 'utf-8');
    
    console.log(`Successfully generated city skyline at ${outFile}`);
  } catch (err) {
    console.error('Error generating city:', err.message);
    process.exit(1);
  }
}

main();
