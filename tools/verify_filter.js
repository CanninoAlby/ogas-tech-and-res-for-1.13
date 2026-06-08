const fs = require('fs');
const path = require('path');

const outputPath = path.resolve('OGAS script generator/pm_goods.csv');

function verify() {
  const content = fs.readFileSync(outputPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const header = lines[0];
  const headers = header.split(',');
  
  const buildingsIdx = headers.indexOf('buildings');
  const pmgIdx = headers.indexOf('production_method_groups');
  const typeIdx = headers.indexOf('type');

  const excludedPmgKeywords = ['automation', 'fencing', 'refrigeration', 'data_', 'harvesting_process'];
  let errors = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = line.split(',');
    const buildings = cells[buildingsIdx];
    const pmg = cells[pmgIdx];
    const type = cells[typeIdx];

    if (type === 'labor_saving') {
      console.error(`Error at line ${i+1}: Found type labor_saving`);
      errors++;
    }

    for (const keyword of excludedPmgKeywords) {
      if (pmg && pmg.includes(keyword)) {
        console.error(`Error at line ${i+1}: Found pmg keyword "${keyword}" in "${pmg}"`);
        errors++;
      }
    }

    if (buildings === 'building_art_academy') {
      console.error(`Error at line ${i+1}: Found building_art_academy`);
      errors++;
    }
  }

  if (errors === 0) {
    console.log('Verification PASSED: All filters correctly applied to target columns.');
  } else {
    console.log(`Verification FAILED: Found ${errors} errors.`);
    process.exit(1);
  }
}

verify();
