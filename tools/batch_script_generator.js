const fs = require('fs');
const path = require('path');

const modRoot = "C:\\Users\\axioo\\Documents\\Paradox Interactive\\Victoria 3\\mod\\ogas tech and res for 1.13";
const csvPath = path.join(modRoot, "OGAS script generator", "pm_goods.csv");
const targetPaths = {
    database: path.join(modRoot, "common", "script_values", "AUTO_database_pm_goods.txt"),
    origin: path.join(modRoot, "common", "script_values", "AUTO_goods_origin.txt"),
    profit: path.join(modRoot, "common", "script_values", "AUTO_building_profit_prediction.txt")
};

function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });
        return row;
    });
    return { headers, rows };
}

const { headers, rows } = parseCSV(csvPath);
const goodHeaders = headers.slice(5); // Everything after 'required_construction'

// Group rows by (Building, PMG)
const groups = {};
rows.forEach(row => {
    const key = `${row.buildings}|${row.production_method_groups}`;
    if (!groups[key]) {
        groups[key] = [];
    }
    groups[key].push(row);
});

// Load existing keys to avoid duplicates
const existingKeys = {
    database: new Set(),
    origin: new Set(),
    profit: new Set()
};

Object.entries(targetPaths).forEach(([type, p]) => {
    if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        const lines = content.split('\n');
        lines.forEach(line => {
            const match = line.match(/^(\w+)\s*=/);
            if (match) {
                existingKeys[type].add(match[1].trim());
            }
        });
    }
});

let databaseAppend = "";
let originAppend = "";
let profitAppend = "";

// 1. AUTO_database_pm_goods.txt
rows.forEach(row => {
    goodHeaders.forEach(good => {
        const value = parseFloat(row[good]);
        if (value !== 0 && !isNaN(value)) {
            const key = `${row.production_methods}_${good}`;
            if (!existingKeys.database.has(key)) {
                databaseAppend += `${key}=${value}\n`;
                existingKeys.database.add(key);
            }
        }
    });
});

// 2. AUTO_goods_origin.txt
Object.entries(groups).forEach(([groupKey, groupRows]) => {
    const [building, pmg] = groupKey.split('|');
    
    // Find all goods involved in this group
    const groupGoods = new Set();
    groupRows.forEach(row => {
        goodHeaders.forEach(good => {
            const value = parseFloat(row[good]);
            if (value !== 0 && !isNaN(value)) {
                groupGoods.add(good);
            }
        });
    });

    groupGoods.forEach(good => {
        const currentBlockKey = `${pmg}_${building}_${good}_current`;
        if (!existingKeys.origin.has(currentBlockKey)) {
            let block = `${currentBlockKey} = {\n`;
            groupRows.forEach((row, index) => {
                const val = parseFloat(row[good]);
                if (val !== 0 && !isNaN(val)) {
                    if (index === 0) {
                        block += `    if = {\n`;
                    } else {
                        block += `    else_if = {\n`;
                    }
                    block += `        limit = {\n`;
                    block += `            has_active_production_method = ${row.production_methods}\n`;
                    block += `        }\n`;
                    block += `        value = ${row.production_methods}_${good}\n`;
                    block += `    }\n`;
                }
            });
            block += `    else = {\n`;
            block += `        value = 0.0\n`;
            block += `    }\n`;
            block += `    multiply = building_work_efficiency\n`;
            block += `}\n\n`;
            
            // Production/Consumption blocks
            const prodKey = `state_${good}_production_if_no_pmg_${pmg}_${building}`;
            block += `${prodKey} = {\n`;
            block += `        value = state.sg:${good}.state_goods_production\n`;
            block += `    if = {\n`;
            block += `        limit = {\n`;
            block += `            ${currentBlockKey} > 0.0\n`;
            block += `        }\n`;
            block += `        subtract = ${currentBlockKey}\n`;
            block += `    }\n`;
            block += `}\n\n`;

            const consKey = `state_${good}_consumption_if_no_pmg_${pmg}_${building}`;
            block += `${consKey} = {\n`;
            block += `        value = state.sg:${good}.state_goods_consumption\n`;
            block += `    if = {\n`;
            block += `        limit = {\n`;
            block += `            ${currentBlockKey} < 0.0\n`;
            block += `        }\n`;
            block += `        add = ${currentBlockKey}\n`;
            block += `    }\n`;
            block += `}\n\n`;

            const mktProdKey = `market_${good}_production_if_no_pmg_${pmg}_${building}`;
            block += `${mktProdKey} = {\n`;
            block += `        value = market.mg:${good}.market_goods_sell_orders\n`;
            block += `    if = {\n`;
            block += `        limit = {\n`;
            block += `            ${currentBlockKey} > 0.0\n`;
            block += `        }\n`;
            block += `        subtract = ${currentBlockKey}\n`;
            block += `        multiply = state.market_access\n`;
            block += `    }\n`;
            block += `}\n\n`;

            const mktConsKey = `market_${good}_consumption_if_no_pmg_${pmg}_${building}`;
            block += `${mktConsKey} = {\n`;
            block += `        value = market.mg:${good}.market_goods_buy_orders\n`;
            block += `    if = {\n`;
            block += `        limit = {\n`;
            block += `            ${currentBlockKey} < 0.0\n`;
            block += `        }\n`;
            block += `        add = ${currentBlockKey}\n`;
            block += `        multiply = state.market_access\n`;
            block += `    }\n`;
            block += `}\n\n`;

            originAppend += block;
            existingKeys.origin.add(currentBlockKey);
        }
    });
});

// 3. AUTO_building_profit_prediction.txt
rows.forEach(row => {
    const profitKey = `${row.production_method_groups}_${row.buildings}_${row.production_methods}_profit_prediction`;
    if (!existingKeys.profit.has(profitKey)) {
        let block = `${profitKey} = {\n`;
        block += `    value = 0\n`;
        
        goodHeaders.forEach(good => {
            const val = parseFloat(row[good]);
            if (val !== 0 && !isNaN(val)) {
                const pmGood = `${row.production_methods}_${good}`;
                const predictionVar = `${pmGood}_prediction`;
                const pmgBuilding = `${row.production_method_groups}_${row.buildings}`;
                
                block += `    add = {\n`;
                block += `        value = ${pmGood}\n`;
                block += `        multiply = building_work_efficiency\n`;
                block += `        save_temporary_value_as = ${predictionVar}\n`;
                
                if (val > 0) {
                    block += `        value = state_${good}_production_if_no_pmg_${pmgBuilding}\n`;
                    block += `        add = scope:${predictionVar}\n`;
                    block += `        save_temporary_value_as = state_${good}_production_prediction\n`;
                    block += `        value = state_${good}_consumption_if_no_pmg_${pmgBuilding}\n`;
                    block += `        save_temporary_value_as = state_${good}_consumption_prediction\n`;
                    block += `        value = market_${good}_production_if_no_pmg_${pmgBuilding}\n`;
                    block += `        add = scope:${predictionVar}\n`;
                    block += `        save_temporary_value_as = market_${good}_production_prediction\n`;
                    block += `        value = market_${good}_consumption_if_no_pmg_${pmgBuilding}\n`;
                    block += `        save_temporary_value_as = market_${good}_consumption_prediction\n`;
                } else {
                    block += `        value = state_${good}_production_if_no_pmg_${pmgBuilding}\n`;
                    block += `        save_temporary_value_as = state_${good}_production_prediction\n`;
                    block += `        value = state_${good}_consumption_if_no_pmg_${pmgBuilding}\n`;
                    block += `        subtract = scope:${predictionVar}\n`;
                    block += `        save_temporary_value_as = state_${good}_consumption_prediction\n`;
                    block += `        value = market_${good}_production_if_no_pmg_${pmgBuilding}\n`;
                    block += `        save_temporary_value_as = market_${good}_production_prediction\n`;
                    block += `        value = market_${good}_consumption_if_no_pmg_${pmgBuilding}\n`;
                    block += `        subtract = scope:${predictionVar}\n`;
                    block += `        save_temporary_value_as = market_${good}_consumption_prediction\n`;
                }
                
                block += `        value = ${good}_price_prediction\n`;
                block += `        multiply = scope:${predictionVar}\n`;
                block += `    }\n`;
            }
        });
        
        block += `    divide = {\n`;
        block += `        value = level\n`;
        block += `        max = 1\n`;
        block += `    }\n`;
        block += `}\n\n`;
        
        block += `${profitKey}_weighted = {\n`;
        block += `    value = ${profitKey}\n`;
        block += `    multiply = owner.var:cnm_upgrade_tolerance_pm_manager\n`;
        block += `}\n\n`;
        
        profitAppend += block;
        existingKeys.profit.add(profitKey);
    }
});

// Write appends
if (databaseAppend) {
    fs.appendFileSync(targetPaths.database, databaseAppend);
    console.log(`Appended to AUTO_database_pm_goods.txt`);
}
if (originAppend) {
    fs.appendFileSync(targetPaths.origin, originAppend);
    console.log(`Appended to AUTO_goods_origin.txt`);
}
if (profitAppend) {
    fs.appendFileSync(targetPaths.profit, profitAppend);
    console.log(`Appended to AUTO_building_profit_prediction.txt`);
}

console.log("Generation complete.");
