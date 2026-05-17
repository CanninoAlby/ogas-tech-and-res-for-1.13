const fs = require('fs');
const path = require('path');

const filePath = "C:\\Users\\axioo\\Documents\\Paradox Interactive\\Victoria 3\\mod\\ogas tech and res for 1.13\\Victoria3 building PM\\production_methods\\00_merged_production_methods.txt";
const outputPath = "C:\\Users\\axioo\\Documents\\Paradox Interactive\\Victoria 3\\mod\\ogas tech and res for 1.13\\tools\\extracted_final_gaps_data.json";

const targetPms = [
    'manzoni_pm_printing_presses',
    'manzoni_pm_rotary_presses',
    'manzoni_pm_linotype',
    'pm_offset_printing',
    'pm_digital_press',
    'pm_natural_uranium',
    'pm_centrifuge_uranium_enrichment',
    'pm_laser_isotope_separation',
    'pm_basic_gasification',
    'pm_advanced_catalytic_gasification'
];

function extractData() {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const results = {};

    targetPms.forEach(pm => {
        // Find the PM block
        const pmRegex = new RegExp(`${pm}\\s*=\\s*\\{[^]*?\\n\\}`, 'g');
        const match = pmRegex.exec(content);
        if (match) {
            const block = match[0];
            
            // Look for workforce_scaled block
            const wsMatch = block.match(/workforce_scaled\s*=\s*\{([^]*?)\}/);
            if (wsMatch) {
                const wsBlock = wsMatch[1];
                const data = {
                    inputs: {},
                    outputs: {}
                };

                // Extract inputs
                const inputMatches = wsBlock.matchAll(/goods_input_([a-z0-9_]+)_add\s*=\s*(-?[\d.]+)/g);
                for (const m of inputMatches) {
                    data.inputs[m[1]] = parseFloat(m[2]);
                }

                // Extract outputs
                const outputMatches = wsBlock.matchAll(/goods_output_([a-z0-9_]+)_add\s*=\s*(-?[\d.]+)/g);
                for (const m of outputMatches) {
                    data.outputs[m[1]] = parseFloat(m[2]);
                }

                results[pm] = data;
            } else {
                console.warn(`workforce_scaled block not found for ${pm}`);
            }
        } else {
            console.warn(`PM block not found for ${pm}`);
        }
    });

    fs.writeFileSync(outputPath, JSON.stringify(results, null, 4));
    console.log(`Extracted data saved to ${outputPath}`);
    console.log(JSON.stringify(results, null, 2));
}

try {
    extractData();
} catch (err) {
    console.error(err);
}
