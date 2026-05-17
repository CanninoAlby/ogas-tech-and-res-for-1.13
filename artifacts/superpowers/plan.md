## Goal
Resolve script errors and crashes in the "ogas tech and res for 1.13" mod caused by the 1.13 update and changes in the "3472248460 [1.13] Tech & Res" dependency. 

## Validation Results
Per your instruction, I've validated the buildings and PMs against the current game and mod data:
1. **Removed Buildings**: uilding_military_shipyard and uilding_naval_base no longer exist (they appear to be merged into uilding_shipyard or removed entirely). The script errors Failed to scope to building type are directly caused by these obsolete references.
2. **"Invalid" PMs**: Most of the PMs in the error log (like pm_internet_data_reporting_heavy_industry and pm_laptops) **actually DO exist** in the Tech & Res mod! The script system throws an error because the auto-generated OGAS script tries to activate them on buildings that *do not support them* (e.g., trying to activate pm_laptops on uilding_processors_foundry, or pm_internet_data... on uilding_aircraft_industry).
3. **Removed/Renamed PMs**: A few PMs have genuinely been removed or have typos in the generator (e.g., pm_no_computer_production is gone, 
atta_catalysts should be pm_ziegler-natta_catalysts).

## Proposed Plan

**Step 1: Clean up obsolete buildings**
- **Files:** common/scripted_effects/AUTO_PM_balance.txt, common/scripted_effects/AUTO_PM_upgrade.txt
- **Change:** Safely parse and remove all if and else_if blocks that check for and modify uilding_military_shipyard and uilding_naval_base.

**Step 2: Automated Purge of Invalid PM Logic**
- **Files:** AUTO_PM_balance.txt, AUTO_PM_upgrade.txt, etc.
- **Change:** Instead of manually hunting down thousands of combinations, I will write a script to read errorlog.txt. For every Script location: file:line_number pointing to an ctivate_production_method error, the script will parse the file, find the enclosing if or else_if block, and surgically remove it. This ensures we only remove the mathematically invalid combinations that the engine is explicitly rejecting, without breaking the rest of the automation logic.

**Step 3: Syntax Verification**
- **Change:** After the automated purge, I will verify the syntax of the modified files to ensure no dangling else_if or broken bracket structures remain.

## Open Questions
- Does using the error log to systematically delete the offending if/else_if blocks sound like the right approach to you, rather than trying to fix the OGAS script generator itself right now?

## Rollback plan
- All changes are made to text files that can be easily restored via git or local backups if the result causes instability.
