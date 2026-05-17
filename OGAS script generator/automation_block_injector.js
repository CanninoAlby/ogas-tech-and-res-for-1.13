const fs = require('fs');
const path = require('path');

const csvPath = "C:\\Users\\axioo\\Documents\\Paradox Interactive\\Victoria 3\\mod\\ogas tech and res for 1.13\\OGAS script generator\\pm_goods.csv";
const upgradePath = "C:\\Users\\axioo\\Documents\\Paradox Interactive\\Victoria 3\\mod\\ogas tech and res for 1.13\\common\\scripted_effects\\AUTO_PM_upgrade.txt";
const balancePath = "C:\\Users\\axioo\\Documents\\Paradox Interactive\\Victoria 3\\mod\\ogas tech and res for 1.13\\common\\scripted_effects\\AUTO_PM_balance.txt";

function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const header = lines[0].split(',');
    
    const buildingsIndex = header.indexOf('buildings');
    const pmgIndex = header.indexOf('production_method_groups');
    const pmIndex = header.indexOf('production_methods');
    const typeIndex = header.indexOf('type');

    const data = {};

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].split(',');
        if (line.length < 4) continue;

        const building = line[buildingsIndex]?.trim();
        const group = line[pmgIndex]?.trim();
        const pm = line[pmIndex]?.trim();
        const type = line[typeIndex]?.trim();

        if (!building || !group || !pm) continue;

        if (!data[building]) data[building] = {};
        if (!data[building][group]) data[building][group] = [];
        data[building][group].push({ pm, type });
    }
    return data;
}

function generateUpgradeBlock(building, group, pmOld, pmNew) {
    return `    ordered_scope_state = {
        limit = {
            has_active_building = ${building}
            b:${building}.occupancy > 0.01
            is_production_method_active = {
                building_type = ${building}
                production_method = ${pmOld}
            }
            can_activate_production_method = {
                building_type = ${building}
                production_method = ${pmNew}
            }
            b:${building}.${group}_${pmNew}_profit_prediction_weighted > b:${building}.${group}_${pmOld}_profit_prediction
        }
        order_by = b:${building}.${group}_${pmNew}_profit_prediction_weighted
        max = owner.var:cnm_pm_manage_amount
        check_range_bounds = no
        activate_production_method = {
            building_type = ${building}
            production_method = ${pmNew}
        }
    }
`;
}

function generateBalanceBlock(building, group, pmTarget, pmOthers) {
    let triggerIfs = "";
    for (const pmOther of pmOthers) {
        triggerIfs += `            trigger_if = {
                limit = {
                    or = {
                        can_activate_production_method = {
                            building_type = ${building}
                            production_method = ${pmOther}
                        }
                        is_production_method_active = {
                            building_type = ${building}
                            production_method = ${pmOther}
                        }
                    }
                }
                b:${building}.${group}_${pmTarget}_profit_prediction > b:${building}.${group}_${pmOther}_profit_prediction_weighted
            }
`;
    }

    return `    ordered_scope_state = {
        limit = {
            has_active_building = ${building}
            b:${building}.occupancy > 0.01
            can_activate_production_method = {
                building_type = ${building}
                production_method = ${pmTarget}
            }
${triggerIfs}        }
        order_by = b:${building}.${group}_${pmTarget}_profit_prediction
        max = owner.var:cnm_pm_manage_amount
        check_range_bounds = no
        activate_production_method = {
            building_type = ${building}
            production_method = ${pmTarget}
        }
    }
`;
}

function main() {
    console.log("Parsing CSV...");
    const data = parseCSV(csvPath);
    
    let upgradeContent = "";
    let balanceContent = "";

    const buildings = Object.keys(data).sort();
    let targetedCount = 0;

    for (const building of buildings) {
        let buildingHasUpgrade = false;
        let buildingHasBalance = false;

        for (const group in data[building]) {
            const pms = data[building][group];
            
            // Upgrade Logic
            const upgradePMs = pms.filter(p => p.type === 'upgrade');
            if (upgradePMs.length > 1) {
                for (let i = 0; i < upgradePMs.length - 1; i++) {
                    upgradeContent += generateUpgradeBlock(building, group, upgradePMs[i].pm, upgradePMs[i+1].pm);
                    buildingHasUpgrade = true;
                }
            }

            // Balance Logic
            const balancePMs = pms.filter(p => p.type === 'balance');
            if (balancePMs.length > 1) {
                for (let i = 0; i < balancePMs.length; i++) {
                    const pmTarget = balancePMs[i].pm;
                    const pmOthers = balancePMs.filter((_, idx) => idx !== i).map(p => p.pm);
                    balanceContent += generateBalanceBlock(building, group, pmTarget, pmOthers);
                    buildingHasBalance = true;
                }
            }
        }
        
        if (buildingHasUpgrade || buildingHasBalance) {
            targetedCount++;
        }
    }

    console.log(`Generated logic for ${targetedCount} industries.`);

    function inject(filePath, newBlocks) {
        console.log(`Injecting into ${filePath}...`);
        let content = fs.readFileSync(filePath, 'utf8');
        // Find the last closing brace of the main effect
        const lastBraceIndex = content.lastIndexOf('}');
        if (lastBraceIndex === -1) {
            console.error(`Could not find closing brace in ${filePath}`);
            return;
        }
        
        const injectedContent = content.slice(0, lastBraceIndex) + newBlocks + content.slice(lastBraceIndex);
        fs.writeFileSync(filePath, injectedContent, 'utf8');
        console.log(`Successfully updated ${filePath}`);
    }

    if (upgradeContent) {
        inject(upgradePath, upgradeContent);
    } else {
        console.log("No upgrade logic generated.");
    }

    if (balanceContent) {
        inject(balancePath, balanceContent);
    } else {
        console.log("No balance logic generated.");
    }
}

main();
