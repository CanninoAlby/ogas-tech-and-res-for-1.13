## Goal
Remove obsolete building types (uilding_military_shipyard, uilding_naval_base) from AUTO_PM_balance.txt, AUTO_PM_upgrade.txt, and other scripts.
Fix "Invalid production method" errors by validating their existence against Victoria 3 version 1.13 data, replacing them with the correct names or safely removing them.

## Constraints
- Only modify OGAS mod files.
- Ensure that the automated production method (PM) switching script logic remains syntactically valid when removing conditions or effects (e.g., preventing empty if blocks).
- Must correctly identify valid PM names or remove the references if they are completely missing.

## Known context
- Victoria 3 1.13 removed uilding_naval_base and uilding_military_shipyard.
- Numerous PMs such as pm_internet_data_reporting_heavy_industry and pm_advanced_assembly_lines_building_electrics_industry are triggering validation errors in the mod.
- The user has isolated these errors in errorlog.txt.

## Risks
- Deleting an if block for a removed building or PM might leave broken syntax (e.g., an else_if without an if, or an empty trigger block).
- Invalid PMs might have slight naming variations; completely removing them might disable intended functionality if a valid replacement exists.
- Not all PM definitions might be in the base game; some might depend on other mods. We need to check the base game common/production_methods folder.

## Options (2–4)
1. **Aggressive Removal:** Delete all if/else_if blocks that reference the removed buildings and invalid PMs from the scripted effects.
2. **Replacement & Removal:** Safely delete the building blocks. For PMs, search Victoria 3 1.13 base game data for similar PM names to replace the misspelled ones. If they are truly obsolete, remove their logic blocks.
3. **Comment Out:** Instead of deleting, comment out the code sections causing validation errors. This preserves the original logic in case the PMs are re-added later, but might look messy.

## Recommendation
**Option 2: Replacement & Removal.** We will safely remove the uilding_military_shipyard and uilding_naval_base blocks entirely. For the invalid PMs, we will search the base game data (or other active mods if necessary) to see if they were renamed. If a match is found, we replace them; if not, we safely remove the references.

## Acceptance criteria
- errorlog.txt validation errors for OGAS scripted effects are resolved.
- uilding_military_shipyard and uilding_naval_base references are completely removed from the mod codebase.
- Invalid PM names are replaced with correct names, or stripped if obsolete.
- Mod scripts remain syntactically valid (no dangling else_if or empty blocks).
