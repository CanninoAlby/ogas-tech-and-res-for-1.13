const fs = require('fs');
const path = require('path');

const inputPath = path.resolve('Victoria3 building PM/victoria3_building_pm_goods.csv');
const outputPath = path.resolve('OGAS script generator/pm_goods.csv');

function filterCsv() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/);
  
  if (lines.length === 0) {
    console.error('Input file is empty');
    process.exit(1);
  }

  const header = lines[0];
  const headers = header.split(',');
  console.log('Detected headers:', headers.slice(0, 10), '... Total headers:', headers.length);
  
  const buildingsIdx = headers.indexOf('buildings');
  const pmgIdx = headers.indexOf('production_method_groups');
  const pmIdx = headers.indexOf('production_methods');
  const typeIdx = headers.indexOf('type');

  if (buildingsIdx === -1 || pmgIdx === -1 || typeIdx === -1) {
    console.error('Missing required columns in CSV header');
    process.exit(1);
  }

  const goodsHeaders = headers.slice(5);

  // Group rows by building and PMG
  const data = {};
  const allRows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = line.split(',');
    const building = cells[buildingsIdx];
    const pmg = cells[pmgIdx];
    const pm = cells[pmIdx];
    const type = cells[typeIdx];

    if (!building || !pmg) continue;

    if (!data[building]) {
      data[building] = {};
    }
    if (!data[building][pmg]) {
      data[building][pmg] = [];
    }

    const outputs = {};
    for (let g = 0; g < goodsHeaders.length; g++) {
      const val = parseFloat(cells[5 + g]);
      const goodName = goodsHeaders[g];
      // Exclude raw_data and organized_data which are mod data-gathering additions
      if (goodName === 'organized_data' || goodName === 'raw_data') continue;
      if (!isNaN(val) && val > 0) {
        outputs[goodName] = val;
      }
    }

    const rowObj = {
      line: line,
      building: building,
      pmg: pmg,
      pm: pm,
      type: type,
      outputs: outputs
    };

    data[building][pmg].push(rowObj);
    allRows.push(rowObj);
  }

  // Identify buildings to keep:
  // 1. Has at least one PMG that balances 2+ output goods (excluding raw/organized data)
  // 2. Has at least one PMG of type 'upgrade'
  const keptBuildings = new Set();
  const balancingPMGs = [];
  const upgradePMGs = [];

  for (const building in data) {
    let keepBuilding = false;

    for (const pmg in data[building]) {
      const pms = data[building][pmg];
      if (pms.length < 2) continue;

      // Condition 2: Has an 'upgrade' PMG
      const isUpgradePMG = pms.some(p => p.type === 'upgrade');
      if (isUpgradePMG) {
        keepBuilding = true;
        upgradePMGs.push({ building, pmg });
      }

      // Condition 1: Has a ratio-balancing PMG
      const allOutputs = new Set();
      pms.forEach(p => {
        Object.keys(p.outputs).forEach(g => allOutputs.add(g));
      });

      if (allOutputs.size >= 2) {
        const goodsList = Array.from(allOutputs);
        let balanceChanges = false;

        for (let i = 0; i < pms.length; i++) {
          for (let j = i + 1; j < pms.length; j++) {
            const pm1 = pms[i];
            const pm2 = pms[j];

            for (let g1 = 0; g1 < goodsList.length; g1++) {
              for (let g2 = g1 + 1; g2 < goodsList.length; g2++) {
                const good1 = goodsList[g1];
                const good2 = goodsList[g2];

                const v11 = pm1.outputs[good1] || 0;
                const v12 = pm1.outputs[good2] || 0;
                const v21 = pm2.outputs[good1] || 0;
                const v22 = pm2.outputs[good2] || 0;

                if (Math.abs(v11 * v22 - v12 * v21) > 0.0001) {
                  balanceChanges = true;
                  break;
                }
              }
              if (balanceChanges) break;
            }
            if (balanceChanges) break;
          }
          if (balanceChanges) break;
        }

        if (balanceChanges) {
          balancingPMGs.push({ building, pmg, goods: goodsList });
          keepBuilding = true;
        }
      }
    }

    if (keepBuilding) {
      keptBuildings.add(building);
    }
  }

  console.log(`\nIdentified ${keptBuildings.size} buildings with balancing or upgrade PMGs:`);
  console.log(Array.from(keptBuildings).sort());

  // Filter CSV rows to keep only those belonging to these kept buildings
  const filteredLines = [header];
  let keptCount = 0;
  let excludedCount = 0;

  for (const row of allRows) {
    if (keptBuildings.has(row.building)) {
      filteredLines.push(row.line);
      keptCount++;
    } else {
      excludedCount++;
    }
  }

  fs.writeFileSync(outputPath, filteredLines.join('\n') + '\n');

  console.log(`\nTotal lines in input: ${lines.filter(l => l.trim()).length}`);
  console.log(`Total lines in output: ${filteredLines.length}`);
  console.log(`Kept rows: ${keptCount}`);
  console.log(`Excluded rows: ${excludedCount}`);
}

filterCsv();
