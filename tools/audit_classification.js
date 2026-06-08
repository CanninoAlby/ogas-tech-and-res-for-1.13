const fs = require('fs');
const path = require('path');

const PM_FILE = 'Victoria3 building PM/production_methods/00_merged_production_methods.txt';
const CSV_FILE = 'Victoria3 building PM/victoria3_building_pm_goods.csv';

// 1. Parse PMs using brace counting and check if they are labor saving
function parsePMs() {
    const content = fs.readFileSync(PM_FILE, 'utf8');
    const pms = {};
    
    let i = 0;
    while (i < content.length) {
        const nextEquals = content.indexOf('=', i);
        if (nextEquals === -1) break;
        
        const beforeEquals = content.substring(i, nextEquals).trim();
        const lines = beforeEquals.split('\n');
        const lastLine = lines[lines.length - 1].replace(/#.*/, '').trim();
        const match = lastLine.match(/(\w+)$/);
        if (!match) {
            i = nextEquals + 1;
            continue;
        }
        const pmName = match[1];
        
        const nextBrace = content.indexOf('{', nextEquals);
        if (nextBrace === -1) break;
        
        let braceCount = 1;
        let j = nextBrace + 1;
        while (j < content.length && braceCount > 0) {
            if (content[j] === '{') braceCount++;
            else if (content[j] === '}') braceCount--;
            j++;
        }
        
        if (braceCount === 0) {
            const body = content.substring(nextBrace + 1, j - 1);
            
            let isLaborSaving = false;
            // Find all employment additions
            const employmentMatches = body.matchAll(/building_employment_(\w+)_add\s*=\s*(-?\d+)/g);
            for (const m of employmentMatches) {
                const val = parseInt(m[2]);
                if (val < 0) {
                    isLaborSaving = true;
                }
            }
            
            pms[pmName] = { isLaborSaving };
        }
        i = j;
    }
    return pms;
}

// 2. Load CSV
function loadCSV() {
    const content = fs.readFileSync(CSV_FILE, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const header = lines[0];
    const rows = lines.slice(1).map(line => line.split(','));
    return { header, rows };
}

const pmData = parsePMs();
const { header, rows } = loadCSV();
const cols = header.split(',').map(c => c.trim().replace(/^\uFEFF/, '')); // Handle BOM
const typeIdx = cols.indexOf('type');
const groupIdx = cols.indexOf('production_method_groups');
const pmIdx = cols.indexOf('production_methods');

const laborSavingGroups = ['automation', 'labor', 'fencing', 'refrigeration', 'data_', 'harvesting_process'];

// Group rows by PM group for analysis
const groups = {};
rows.forEach((row, i) => {
    const groupName = row[groupIdx];
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push({ row, index: i });
});

// Determine if a group contains any labor-saving PM
const groupIsLaborSaving = {};
Object.entries(groups).forEach(([groupName, groupRows]) => {
    let hasLaborSaving = false;
    // Check if the group name implies labor saving
    if (laborSavingGroups.some(g => groupName.includes(g))) {
        hasLaborSaving = true;
    }
    // Check if any PM in the group is labor-saving in PM definition
    groupRows.forEach(gr => {
        const pmName = gr.row[pmIdx];
        const pm = pmData[pmName];
        if (pm && pm.isLaborSaving) {
            hasLaborSaving = true;
        }
    });
    groupIsLaborSaving[groupName] = hasLaborSaving;
});

function getOutputs(row) {
    const outputs = {};
    for (let j = 5; j < row.length; j++) {
        const val = parseFloat(row[j]);
        if (val > 0) {
            outputs[cols[j]] = val;
        }
    }
    return outputs;
}

function isOutputShift(out1, out2) {
    const keys1 = Object.keys(out1).sort();
    const keys2 = Object.keys(out2).sort();
    
    if (keys1.length === 0 || keys2.length === 0) return false;
    if (keys1.join(',') !== keys2.join(',')) return true;
    
    const firstKey = keys1[0];
    const ratio = out2[firstKey] / out1[firstKey];
    for (const key of keys1) {
        if (Math.abs(out2[key] / out1[key] - ratio) > 0.001) return true;
    }
    return false;
}

const errors = [];
const correctedRows = [];

rows.forEach((row, i) => {
    const pmName = row[pmIdx];
    const groupName = row[groupIdx];
    const currentType = row[typeIdx];
    let targetType = 'upgrade';

    if (groupIsLaborSaving[groupName]) {
        targetType = 'labor_saving';
    } else {
        const groupRows = groups[groupName];
        let hasOutputShift = false;
        if (groupRows.length > 1) {
            const firstOutputs = getOutputs(groupRows[0].row);
            for (let j = 1; j < groupRows.length; j++) {
                const currentOutputs = getOutputs(groupRows[j].row);
                if (isOutputShift(firstOutputs, currentOutputs)) {
                    hasOutputShift = true;
                    break;
                }
            }
        }

        if (hasOutputShift) {
            targetType = 'balance';
        } else {
            targetType = 'upgrade';
        }
    }

    if (currentType !== targetType) {
        errors.push({
            pm: pmName,
            group: groupName,
            old: currentType,
            new: targetType
        });
        row[typeIdx] = targetType;
    }
    correctedRows.push(row.join(','));
});

console.log(`Total rows checked: ${rows.length}`);
console.log(`Total discrepancies found: ${errors.length}`);

if (errors.length > 0) {
    errors.slice(0, 30).forEach(e => console.log(`PM: ${e.pm} | Group: ${e.group} | ${e.old} -> ${e.new}`));
    if (errors.length > 30) console.log('...');
    
    fs.writeFileSync(CSV_FILE, header + '\n' + correctedRows.join('\n') + '\n', 'utf8');
    console.log(`CSV updated: ${CSV_FILE}`);
} else {
    console.log('No discrepancies found.');
}
