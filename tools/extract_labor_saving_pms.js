const fs = require('fs');
const path = require('path');

/**
 * CONSTANTS: Centralized configuration for file paths and modifier keys.
 */
const CONSTANTS = {
    PATHS: {
        BUILDINGS: 'Victoria3 building PM/buildings/00_merged_buildings.txt',
        PM_GROUPS: 'Victoria3 building PM/production_method_groups/00_merged_production_method_groups.txt',
        PM_DETAILS: 'Victoria3 building PM/production_methods/00_merged_production_methods.txt',
        OUTPUT: 'tools/labor_saving_pms.json',
        SCRIPT_OUTPUT: 'tools/generated_release_workforce.txt'
    },
    MODIFIER_KEYS: {
        LEVEL_SCALED: 'level_scaled',
        EMPLOYMENT_PREFIX: 'building_employment_',
        EMPLOYMENT_SUFFIX: '_add'
    }
};

/**
 * Robust Paradox Parser: Extracts structured data from Paradox Script files.
 */
function parseParadox(text) {
    const tokens = [];
    let currentToken = "";
    let inComment = false;
    let inString = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inComment) {
            if (char === '\n') inComment = false;
            continue;
        }
        if (char === '#') {
            inComment = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            currentToken += char;
            continue;
        }
        if (inString) {
            currentToken += char;
            continue;
        }
        if (char === '{' || char === '}' || char === '=' || /\s/.test(char)) {
            if (currentToken.trim()) tokens.push(currentToken.trim());
            if (char === '{' || char === '}' || char === '=') tokens.push(char);
            currentToken = "";
        } else {
            currentToken += char;
        }
    }
    if (currentToken.trim()) tokens.push(currentToken.trim());

    let pos = 0;
    function walk() {
        const obj = {};
        const list = [];
        let isList = true;

        while (pos < tokens.length) {
            const token = tokens[pos];
            if (token === '}') {
                pos++;
                return isList ? list : obj;
            }

            if (tokens[pos + 1] === '=') {
                isList = false;
                const key = token;
                pos += 2; // skip key and =
                const nextToken = tokens[pos];
                if (nextToken === '{') {
                    pos++;
                    obj[key] = walk();
                } else {
                    obj[key] = nextToken;
                    pos++;
                }
            } else {
                if (token === '{') {
                    pos++;
                    list.push(walk());
                } else {
                    list.push(token);
                    pos++;
                }
            }
        }
        return isList ? list : obj;
    }

    const root = {};
    while (pos < tokens.length) {
        const key = tokens[pos++];
        if (pos < tokens.length && tokens[pos] === '=') {
            pos++;
            if (pos < tokens.length && tokens[pos] === '{') {
                pos++;
                root[key] = walk();
            } else if (pos < tokens.length) {
                root[key] = tokens[pos++];
            }
        }
    }
    return root;
}

/**
 * isLaborSaving: Determines if a Production Method (PM) reduces employment.
 * 
 * Criteria (STRICT - DO NOT CHANGE):
 * - Must have level_scaled in building_modifiers.
 * - ALL employment modifiers in level_scaled must be <= 0.
 * - At least one employment modifier must be < 0.
 * - NO positive employment modifiers in level_scaled.
 */
function isLaborSaving(pm) {
    if (!pm.building_modifiers || !pm.building_modifiers[CONSTANTS.MODIFIER_KEYS.LEVEL_SCALED]) return false;
    const modifiers = pm.building_modifiers[CONSTANTS.MODIFIER_KEYS.LEVEL_SCALED];
    
    let hasEmploymentReduction = false;
    for (const [key, value] of Object.entries(modifiers)) {
        if (typeof value === 'object') continue;

        const numValue = parseFloat(value);
        if (isNaN(numValue)) continue;

        // Requirement: NO positive employment modifiers in level_scaled.
        // Requirement: ALL employment modifiers in level_scaled must be <= 0.
        if (numValue > 0) {
            return false;
        }

        const isEmploymentKey = key.startsWith(CONSTANTS.MODIFIER_KEYS.EMPLOYMENT_PREFIX) && 
                              key.endsWith(CONSTANTS.MODIFIER_KEYS.EMPLOYMENT_SUFFIX);

        if (isEmploymentKey && numValue < 0) {
            hasEmploymentReduction = true;
        }
    }
    return hasEmploymentReduction;
}

/**
 * main: Execution entry point with robust error handling.
 */
function main() {
    try {
        console.log('Reading data files...');
        
        let buildingsData, pmGroupsData, pmDetailsData;
        
        try {
            buildingsData = parseParadox(fs.readFileSync(CONSTANTS.PATHS.BUILDINGS, 'utf8'));
            pmGroupsData = parseParadox(fs.readFileSync(CONSTANTS.PATHS.PM_GROUPS, 'utf8'));
            pmDetailsData = parseParadox(fs.readFileSync(CONSTANTS.PATHS.PM_DETAILS, 'utf8'));
        } catch (ioError) {
            console.error('Fatal Error: Failed to read input files. Ensure the "Victoria3 building PM" directory exists.');
            console.error(ioError.message);
            process.exit(1);
        }

        // Map PMG -> PMs (maintains order from tokens)
        const pmgToPms = {};
        for (const [pmgName, pmg] of Object.entries(pmGroupsData)) {
            if (pmg.production_methods) {
                pmgToPms[pmgName] = pmg.production_methods;
            }
        }

        const result = {};
        let totalFound = 0;

        console.log('Filtering labor saving PMs hierarchical...');

        for (const [buildingName, building] of Object.entries(buildingsData)) {
            if (!building.production_method_groups) continue;

            const pmgList = Array.isArray(building.production_method_groups) ? 
                          building.production_method_groups : 
                          [building.production_method_groups];

            const buildingResult = {};
            for (const pmgName of pmgList) {
                const pms = pmgToPms[pmgName];
                if (!pms) continue;

                const filteredPms = [];
                const pmNames = Array.isArray(pms) ? pms : [pms];
                
                for (const pmName of pmNames) {
                    const pmDetails = pmDetailsData[pmName];
                    if (!pmDetails) continue;

                    if (isLaborSaving(pmDetails)) {
                        filteredPms.push(pmName);
                        totalFound++;
                    }
                }

                if (filteredPms.length > 0) {
                    buildingResult[pmgName] = filteredPms;
                }
            }

            if (Object.keys(buildingResult).length > 0) {
                result[buildingName] = buildingResult;
            }
        }

        console.log('Writing results to JSON...');
        try {
            fs.writeFileSync(CONSTANTS.PATHS.OUTPUT, JSON.stringify(result, null, 2));
        } catch (writeError) {
            console.error(`Fatal Error: Failed to write to ${CONSTANTS.PATHS.OUTPUT}`);
            console.error(writeError.message);
            process.exit(1);
        }

        console.log('Generating Paradox script...');
        let paradoxScript = "# Auto-generated labor-saving PM activation script\n\n";
        let chainCount = 0;
        let blockCount = 0;

        for (const [buildingName, pmgMap] of Object.entries(result)) {
            paradoxScript += `# ${buildingName}\n`;
            for (const [pmgName, pms] of Object.entries(pmgMap)) {
                paradoxScript += `\t# ${pmgName}\n`;
                const reversedPms = [...pms].reverse();
                let isFirst = true;

                for (const pmName of reversedPms) {
                    const blockType = isFirst ? 'if' : 'else_if';
                    paradoxScript += `\t${blockType} = {\n`;
                    paradoxScript += `\t\tlimit = {\n`;
                    paradoxScript += `\t\t\thas_active_building = ${buildingName}\n`;
                    paradoxScript += `\t\t\tor = {\n`;
                    paradoxScript += `\t\t\t\tcan_activate_production_method = {\n`;
                    paradoxScript += `\t\t\t\t\tbuilding_type = ${buildingName}\n`;
                    paradoxScript += `\t\t\t\t\tproduction_method = ${pmName}\n`;
                    paradoxScript += `\t\t\t\t}\n`;
                    paradoxScript += `\t\t\t\tis_production_method_active = {\n`;
                    paradoxScript += `\t\t\t\t\tbuilding_type = ${buildingName}\n`;
                    paradoxScript += `\t\t\t\t\tproduction_method = ${pmName}\n`;
                    paradoxScript += `\t\t\t\t}\n`;
                    paradoxScript += `\t\t\t}\n`;
                    paradoxScript += `\t\t}\n`;
                    paradoxScript += `\t\tif = {\n`;
                    paradoxScript += `\t\t\tlimit = {\n`;
                    paradoxScript += `\t\t\t\tnot = {\n`;
                    paradoxScript += `\t\t\t\t\tis_production_method_active = {\n`;
                    paradoxScript += `\t\t\t\t\t\tbuilding_type = ${buildingName}\n`;
                    paradoxScript += `\t\t\t\t\t\tproduction_method = ${pmName}\n`;
                    paradoxScript += `\t\t\t\t\t}\n`;
                    paradoxScript += `\t\t\t\t}\n`;
                    paradoxScript += `\t\t\t}\n`;
                    paradoxScript += `\t\t\tactivate_production_method = {\n`;
                    paradoxScript += `\t\t\t\tbuilding_type = ${buildingName}\n`;
                    paradoxScript += `\t\t\t\tproduction_method = ${pmName}\n`;
                    paradoxScript += `\t\t\t}\n`;
                    paradoxScript += `\t\t}\n`;
                    paradoxScript += `\t}\n`;
                    isFirst = false;
                    blockCount++;
                }
                chainCount++;
            }
            paradoxScript += `\n`;
        }

        try {
            fs.writeFileSync(CONSTANTS.PATHS.SCRIPT_OUTPUT, paradoxScript);
        } catch (writeError) {
            console.error(`Fatal Error: Failed to write to ${CONSTANTS.PATHS.SCRIPT_OUTPUT}`);
            console.error(writeError.message);
            process.exit(1);
        }

        console.log(`Summary:`);
        console.log(`- Total labor-saving PMs found: ${totalFound}`);
        console.log(`- Buildings with labor-saving options: ${Object.keys(result).length}`);
        console.log(`- Paradox script chains generated: ${chainCount}`);
        console.log(`- Total Paradox script blocks generated: ${blockCount}`);
        console.log(`- Results saved to: ${CONSTANTS.PATHS.OUTPUT}`);
        console.log(`- Paradox script saved to: ${CONSTANTS.PATHS.SCRIPT_OUTPUT}`);

    } catch (globalError) {
        console.error('An unexpected error occurred during execution:');
        console.error(globalError);
        process.exit(1);
    }
}

// Execute the script
main();
