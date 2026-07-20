function renderSVG(calendar) {
  const width = 1000;
  const height = 400;
  const skylineY = 280; // Baseline of buildings
  const buildingWidth = 14;
  const buildingSpacing = 4;
  const maxBuildingHeight = 180;

  // Find max weekly commits to scale building heights
  let maxWeekCommits = 1; // avoid div by 0
  calendar.weeks.forEach(week => {
    const total = week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0);
    if (total > maxWeekCommits) {
      maxWeekCommits = total;
    }
  });

  const totalWeeks = calendar.weeks.length;
  const totalCityWidth = totalWeeks * (buildingWidth + buildingSpacing);
  const startX = (width - totalCityWidth) / 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0B1021" />
      <stop offset="100%" stop-color="#2a1b38" />
    </linearGradient>
    <linearGradient id="building" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#181329" />
      <stop offset="100%" stop-color="#0a0812" />
    </linearGradient>
    <style>
      .text-title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #E1E4E8; }
      .text-subtitle { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 12px; fill: #8B949E; }
      .text-legend { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10px; fill: #8B949E; }
      .live-tag { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 10px; font-weight: bold; fill: #238636; }
    </style>
  </defs>
  `;

  // Sky background
  svg += `<rect width="${width}" height="${height}" fill="url(#sky)" />`;

  // Ground
  svg += `<rect x="0" y="${skylineY}" width="${width}" height="${height - skylineY}" fill="#0D1117" />`;
  svg += `<line x1="0" y1="${skylineY}" x2="${width}" y2="${skylineY}" stroke="#30363D" stroke-width="1" />`;

  // Moon and Stars
  svg += `<circle cx="200" cy="80" r="16" fill="#F9E79F" />`;
  svg += `<circle cx="206" cy="76" r="16" fill="#0E1222" />`; // Crescent mask effect

  const stars = [
    {x: 100, y: 50, r: 1}, {x: 300, y: 120, r: 1.5}, {x: 500, y: 40, r: 1},
    {x: 700, y: 90, r: 2}, {x: 850, y: 60, r: 1}, {x: 950, y: 140, r: 1.5},
    {x: 400, y: 150, r: 1}, {x: 600, y: 100, r: 1.5}, {x: 800, y: 30, r: 1}
  ];
  stars.forEach(star => {
    svg += `<circle cx="${star.x}" cy="${star.y}" r="${star.r}" fill="#FFFFFF" opacity="0.5" />`;
  });

  // Month labels
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let currentMonth = -1;

  // Render Buildings (weeks)
  calendar.weeks.forEach((week, weekIndex) => {
    const totalCommits = week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0);
    
    // Scale building height
    // Give a minimum height so even 0 commit weeks have a small building structure
    const scaledHeight = totalCommits > 0 
      ? Math.max(30, (totalCommits / maxWeekCommits) * maxBuildingHeight)
      : 20;

    const x = startX + weekIndex * (buildingWidth + buildingSpacing);
    const y = skylineY - scaledHeight;

    // Building body
    svg += `<rect x="${x}" y="${y}" width="${buildingWidth}" height="${scaledHeight}" fill="url(#building)" stroke="#30363D" stroke-width="0.5" rx="1" ry="1"/>`;

    // Render Windows (days)
    const windowWidth = 2.5;
    const windowHeight = 4;
    const windowSpacingX = 2;
    const windowSpacingY = 3;
    
    const cols = 2; // two columns of windows per building
    
    week.contributionDays.forEach((day, dayIndex) => {
      // Calculate color based on commits
      let windowColor = "#161B22"; // default dark/off
      if (day.contributionCount > 0) {
        if (day.contributionCount <= 3) windowColor = "#0E4429"; // light
        else if (day.contributionCount <= 6) windowColor = "#006D32"; // moderate
        else if (day.contributionCount <= 10) windowColor = "#26A641"; // high
        else windowColor = "#39D353"; // very high
      }

      // We place windows from bottom to top
      const col = dayIndex % cols;
      const row = Math.floor(dayIndex / cols);
      
      const winX = x + 3 + col * (windowWidth + windowSpacingX);
      const winY = skylineY - 10 - row * (windowHeight + windowSpacingY);

      // Only draw if window fits in the building height
      if (winY > y + 5) {
        svg += `<rect x="${winX}" y="${winY}" width="${windowWidth}" height="${windowHeight}" fill="${windowColor}" rx="0.5" />`;
      }

      // Check for month label
      if (dayIndex === 0) {
        const dateObj = new Date(day.date);
        const month = dateObj.getMonth();
        if (month !== currentMonth) {
          currentMonth = month;
          // Only show label if it's the start of the month (roughly)
          if (dateObj.getDate() <= 14 && weekIndex > 0 && weekIndex < totalWeeks - 2) {
             svg += `<text x="${x + buildingWidth / 2}" y="${skylineY + 15}" class="text-legend" text-anchor="middle">${monthNames[month]}</text>`;
          }
        }
      }
    });
  });

  // Footer / Legend
  const footerY = 330;
  
  // Title
  svg += `<text x="${startX}" y="${footerY}" class="text-title">🏙 My Coding City</text>`;
  
  // Live tag
  const titleWidth = 140; // Approx
  svg += `<rect x="${startX + titleWidth}" y="${footerY - 12}" width="38" height="16" fill="#238636" fill-opacity="0.2" stroke="#238636" stroke-width="1" rx="8" />`;
  svg += `<text x="${startX + titleWidth + 19}" y="${footerY}" class="live-tag" text-anchor="middle">LIVE</text>`;

  svg += `<text x="${startX}" y="${footerY + 18}" class="text-subtitle">A city that grows with my contributions</text>`;

  // Legend Right Aligned
  const legendX = startX + totalCityWidth - 200;
  svg += `<text x="${legendX}" y="${footerY}" class="text-legend">Less activity</text>`;
  
  const colors = ["#161B22", "#0E4429", "#006D32", "#26A641", "#39D353"];
  colors.forEach((color, i) => {
    svg += `<rect x="${legendX + 65 + i * 12}" y="${footerY - 8}" width="9" height="9" fill="${color}" rx="2" />`;
  });
  
  svg += `<text x="${legendX + 130}" y="${footerY}" class="text-legend">More activity</text>`;

  // Extra info text
  svg += `<text x="${startX}" y="${footerY + 45}" class="text-legend">Each building represents a week (6 months). Each window represents a day.</text>`;
  svg += `<text x="${startX}" y="${footerY + 58}" class="text-legend">The brighter the window, the more commits that day.</text>`;

  const now = new Date();
  svg += `<text x="${startX + totalCityWidth}" y="${footerY + 58}" class="text-legend" text-anchor="end">Last updated: ${now.toUTCString()}</text>`;

  svg += `</svg>`;
  return svg;
}

module.exports = renderSVG;
