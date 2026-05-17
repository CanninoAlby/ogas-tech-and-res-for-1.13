const fs = require('fs');
const path = require('path');

const workspaceRoot = 'C:\\Users\\axioo\\Documents\\Paradox Interactive\\Victoria 3\\mod\\ogas tech and res for 1.13';
const generatorPath = path.join(workspaceRoot, 'OGAS script generator');
const commonPath = path.join(workspaceRoot, 'common');

const mapping = [
    { from: 'scripted_effects', to: 'scripted_effects' },
    { from: 'script_values', to: 'script_values' },
    { from: 'scripted_triggers', to: 'scripted_triggers' },
    { from: 'scripted_buttons', to: 'scripted_buttons' },
    { from: 'journal_entries', to: 'journal_entries' }
];

mapping.forEach(m => {
    const srcDir = path.join(generatorPath, m.from);
    const destDir = path.join(commonPath, m.to);
    
    if (fs.existsSync(srcDir)) {
        const files = fs.readdirSync(srcDir).filter(f => f.startsWith('AUTO_'));
        files.forEach(file => {
            const srcFile = path.join(srcDir, file);
            const destFile = path.join(destDir, file);
            console.log(`Copying ${file} to common/${m.to}`);
            fs.copyFileSync(srcFile, destFile);
        });
    }
});

console.log('\nDeployment complete.');
