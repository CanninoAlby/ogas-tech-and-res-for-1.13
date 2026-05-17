const fs = require('fs');
const path = require('path');

const jsonPath = "C:\\Users\\axioo\\Documents\\Paradox Interactive\\Victoria 3\\mod\\ogas tech and res for 1.13\\tools\\extracted_industry_data.json";
const csvPath = "C:\\Users\\axioo\\Documents\\Paradox Interactive\\Victoria 3\\mod\\ogas tech and res for 1.13\\OGAS script generator\\pm_goods.csv";

try {
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split(/\r?\n/);
    const header = lines[0].trim().split(',');

    const goodsMap = {};
    header.forEach((name, index) => {
        if (index >= 5) {
            goodsMap[name.trim()] = index;
        }
    });

    const determineType = (groupName) => {
        const gn = groupName.toLowerCase();
        if (gn.includes('automation') || gn.includes('fencing') || gn.includes('refrigeration') || gn.includes('data')) {
            return 'labor_saving';
        }
        if (gn.includes('luxury') || gn.includes('product') || gn.includes('choice') || gn.includes('secondary')) {
            return 'balance';
        }
        return 'upgrade';
    };

    const newRows = [];
    const existingPMs = new Set();
    // Start from line 1 (skip header)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const parts = line.split(',');
            if (parts.length > 2) {
                existingPMs.add(`${parts[0]}|${parts[1]}|${parts[2]}`);
            }
        }
    }

    for (const buildingName in jsonData) {
        const buildingData = jsonData[buildingName];
        buildingData.groups.forEach(group => {
            const type = determineType(group.name);
            group.pms.forEach(pm => {
                const key = `${buildingName}|${group.name}|${pm.name}`;
                if (existingPMs.has(key)) {
                    // console.log(`Skipping existing PM: ${key}`);
                    return;
                }

                const row = new Array(header.length).fill('');
                row[0] = buildingName;
                row[1] = group.name;
                row[2] = pm.name;
                row[3] = type;
                row[4] = 'construction_cost_high'; // Default

                for (const input in pm.inputs) {
                    const trimmedInput = input.trim();
                    if (goodsMap[trimmedInput] !== undefined) {
                        row[goodsMap[trimmedInput]] = -pm.inputs[input];
                    }
                }
                for (const output in pm.outputs) {
                    const trimmedOutput = output.trim();
                    if (goodsMap[trimmedOutput] !== undefined) {
                        row[goodsMap[trimmedOutput]] = pm.outputs[output];
                    }
                }
                newRows.push(row.join(','));
                existingPMs.add(key);
            });
        });
    }

    if (newRows.length > 0) {
        const appendContent = (csvContent.endsWith('\n') ? '' : '\n') + newRows.join('\n') + '\n';
        fs.appendFileSync(csvPath, appendContent);
        console.log(`Successfully added ${newRows.length} new rows to ${csvPath}`);
    } else {
        console.log("No new unique PMs found to add.");
    }

} catch (err) {
    console.error("Error processing files:", err);
    process.exit(1);
}
