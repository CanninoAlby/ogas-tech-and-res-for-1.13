const fs = require('fs');
const path = require('path');

const BASE_PATH = 'C:/Users/axioo/Documents/Paradox Interactive/Victoria 3/mod/ogas tech and res for 1.13/Victoria3 building PM';
const BUILDINGS_FILE = path.join(BASE_PATH, 'buildings/00_merged_buildings.txt');
const PM_GROUPS_FILE = path.join(BASE_PATH, 'production_method_groups/00_merged_production_method_groups.txt');
const PMS_FILE = path.join(BASE_PATH, 'production_methods/00_merged_production_methods.txt');
const OUTPUT_FILE = 'C:/Users/axioo/Documents/Paradox Interactive/Victoria 3/mod/ogas tech and res for 1.13/tools/extracted_industry_data.json';

const TARGET_INDUSTRIES = [
    'building_airport', 'building_alloys_plant', 'building_arms_industry', 'building_art_academy',
    'building_artillery_foundry', 'building_battery_plant', 'building_bauxite_mine',
    'building_consumer_electronics_industry', 'building_copper_mine', 'building_datacenter_industry',
    'building_electrics_industry', 'building_electronics_industry', 'building_elgar_opera',
    'building_explosives_factory', 'building_fishing_wharf', 'building_furniture_manufactory',
    'building_gold_mine', 'building_instrument_workshops', 'building_interactive_media_industry',
    'building_livestock_ranch', 'building_manzoni_publishing_industry', 'building_mendelejew_hydrogenation_plants',
    'building_mendelejew_synthetic_rubber_factory', 'building_motor_industry', 'building_natural_gas_rig',
    'building_nuclear_weapons_silo', 'building_oil_rig', 'building_opium_plantation',
    'building_pharmaceuticals_industry', 'building_rare_earths_mine', 'building_robotics_industry',
    'building_silk_plantation', 'building_synthetics_plant', 'building_telecommunications_industry',
    'building_tooling_workshop', 'building_uranium_mine', 'building_vineyard', 'building_water_plant',
    'building_whaling_station', 'building_computer_assembly_plant'
];

function parseParadox(content) {
    // Remove comments
    content = content.replace(/#.*$/gm, '');
    
    const tokens = content.match(/[a-zA-Z0-9_.:]+|{|=|\}/g) || [];
    const root = {};
    const stack = [root];
    let lastKey = null;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        if (token === '=') continue;
        
        if (token === '{') {
            const newNode = {};
            if (lastKey) {
                const current = stack[stack.length - 1];
                if (current[lastKey]) {
                    if (!Array.isArray(current[lastKey])) {
                        current[lastKey] = [current[lastKey]];
                    }
                    current[lastKey].push(newNode);
                } else {
                    current[lastKey] = newNode;
                }
                stack.push(newNode);
                lastKey = null;
            } else {
                // Anonymous block
                const current = stack[stack.length - 1];
                if (!current._items) current._items = [];
                current._items.push(newNode);
                stack.push(newNode);
            }
        } else if (token === '}') {
            stack.pop();
            lastKey = null;
        } else {
            if (i + 1 < tokens.length && tokens[i + 1] === '=') {
                lastKey = token;
            } else {
                const current = stack[stack.length - 1];
                if (lastKey) {
                    if (current[lastKey]) {
                        if (!Array.isArray(current[lastKey])) {
                            current[lastKey] = [current[lastKey]];
                        }
                        current[lastKey].push(token);
                    } else {
                        current[lastKey] = token;
                    }
                    lastKey = null;
                } else {
                    if (!current._items) current._items = [];
                    current._items.push(token);
                }
            }
        }
    }
    return root;
}

function extractData() {
    console.log('Loading files...');
    const buildingsRaw = fs.readFileSync(BUILDINGS_FILE, 'utf8');
    const pmGroupsRaw = fs.readFileSync(PM_GROUPS_FILE, 'utf8');
    const pmsRaw = fs.readFileSync(PMS_FILE, 'utf8');

    console.log('Parsing buildings...');
    const buildingsData = parseParadox(buildingsRaw);
    console.log('Parsing PM groups...');
    const pmGroupsData = parseParadox(pmGroupsRaw);
    console.log('Parsing PMs...');
    const pmsData = parseParadox(pmsRaw);

    const result = {};

    for (const industry of TARGET_INDUSTRIES) {
        const building = buildingsData[industry];
        if (!building) {
            console.warn(`Warning: Building ${industry} not found.`);
            continue;
        }

        const pmgList = building.production_method_groups ? building.production_method_groups._items : [];
        const industryData = {
            groups: []
        };

        for (const pmgName of pmgList) {
            const group = pmGroupsData[pmgName];
            if (!group) continue;

            const pmNames = group.production_methods ? group.production_methods._items : [];
            const groupInfo = {
                name: pmgName,
                type: 'unknown',
                pms: []
            };

            // Categorize group
            const lowerPMG = pmgName.toLowerCase();
            if (lowerPMG.includes('automation') || lowerPMG.includes('fencing') || lowerPMG.includes('refrigeration') || lowerPMG.includes('data')) {
                groupInfo.type = 'labor_saving';
            } else if (lowerPMG.includes('base') || lowerPMG.includes('primary') || lowerPMG.includes('upgrade') || groupInfo.name.includes(industry.replace('building_', ''))) {
                groupInfo.type = 'upgrade';
            } else {
                groupInfo.type = 'balance';
            }

            for (const pmName of pmNames) {
                const pm = pmsData[pmName];
                if (!pm) continue;

                const pmInfo = {
                    name: pmName,
                    inputs: {},
                    outputs: {}
                };

                const modifiers = pm.building_modifiers;
                if (modifiers && modifiers.workforce_scaled) {
                    const ws = modifiers.workforce_scaled;
                    for (const key in ws) {
                        if (key.startsWith('goods_input_')) {
                            const good = key.replace('goods_input_', '').replace('_add', '');
                            pmInfo.inputs[good] = parseFloat(ws[key]);
                        } else if (key.startsWith('goods_output_')) {
                            const good = key.replace('goods_output_', '').replace('_add', '');
                            pmInfo.outputs[good] = parseFloat(ws[key]);
                        }
                    }
                }
                groupInfo.pms.push(pmInfo);
            }
            industryData.groups.push(groupInfo);
        }
        result[industry] = industryData;
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(`Successfully extracted data to ${OUTPUT_FILE}`);
}

try {
    extractData();
} catch (err) {
    console.error('Extraction failed:', err);
    process.exit(1);
}
