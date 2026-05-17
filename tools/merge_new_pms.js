const fs = require('fs');
const path = require('path');

const OLD_CSV_PATH = path.join(__dirname, '../OGAS script generator/pm_goods.csv.bak');
const NEW_CSV_PATH = path.join(__dirname, '../Victoria3 building PM/victoria3_building_pm_goods.csv');
const OUT_CSV_PATH = path.join(__dirname, '../OGAS script generator/pm_goods.csv');
const ORIGINAL_CSV_PATH = path.join(__dirname, '../OGAS script generator/pm_goods.csv');

// Create backup if it doesn't exist
if (!fs.existsSync(OLD_CSV_PATH) && fs.existsSync(ORIGINAL_CSV_PATH)) {
    fs.copyFileSync(ORIGINAL_CSV_PATH, OLD_CSV_PATH);
}

// Load old CSV
const oldCsv = fs.readFileSync(OLD_CSV_PATH, 'utf-8');
const oldLines = oldCsv.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const oldMap = new Map();

for (let i = 1; i < oldLines.length; i++) {
    const parts = oldLines[i].split(',');
    const b = parts[0];
    const pmg = parts[1];
    const pm = parts[2];
    const type = parts[3];
    
    oldMap.set(`${b},${pmg},${pm}`, type);
}

// Load new CSV
const newCsv = fs.readFileSync(NEW_CSV_PATH, 'utf-8');
const newLines = newCsv.split('\n').map(l => l.trim()).filter(l => l.length > 0);
const newHeader = newLines[0];

const outLines = [newHeader];
let addedCount = 0;

for (let i = 1; i < newLines.length; i++) {
    const parts = newLines[i].split(',');
    const b = parts[0];
    const pmg = parts[1];
    const pm = parts[2];
    
    const key = `${b},${pmg},${pm}`;
    
    if (oldMap.has(key)) {
        // Exists in old CSV: KEEP it and copy the Type
        parts[3] = oldMap.get(key);
        outLines.push(parts.join(','));
    } else {
        // Missing in old CSV
        parts[3] = 'upgrade';
        outLines.push(parts.join(','));
        console.log(`Added new row: ${key}`);
        addedCount++;
    }
}

fs.writeFileSync(OUT_CSV_PATH, outLines.join('\n'), 'utf-8');

console.log(`\nMerge complete. Added ${addedCount} new rows.`);
console.log(`Output written to: ${OUT_CSV_PATH}`);
