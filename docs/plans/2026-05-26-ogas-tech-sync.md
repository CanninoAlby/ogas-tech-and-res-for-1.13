# OGAS CSV Tech & Res Layered Synchronization Implementation Plan (TRULY COMPLETE & DETAILED)

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a layered synchronization strategy where the master CSV tracks all data, is verified for correct classification (Balance vs Upgrade vs Labor Saving), and is filtered for labor/data PMs before generating clean game scripts.

**Core Definitions & Rules:**
- **Balance:** A Production Method group that changes the TYPE or RATIO of Output Goods (e.g., swapping Grain for Meat, or Planes for Space Assets). These require profit-based switching logic.
- **Upgrade:** A linear technological progression for the SAME output goods that improves efficiency WITHOUT primarily reducing workforce. These require tech-based forward progression logic.
- **Labor Saving:** A technological progression whose primary effect is the reduction of employment (Workforce Add < 0). Examples: Tractors, Harvesters, Automation, Fencing, Refrigeration. **THESE MUST BE IGNORED BY GENERATED SCRIPTS.**

**Architecture:** 
1.  **Layer 1 (Master Data):** Populate `victoria3_building_pm_goods.csv` with all Tech & Res core data.
2.  **Layer 2 (Verification):** Perform a comprehensive logic audit to enforce the 3 definitions above.
3.  **Layer 3 (Filtered Buffer):** Pre-process the Master CSV into `OGAS script generator/pm_goods.csv` excluding ignored categories.
4.  **Layer 4 (Execution):** Run the OGAS generator pipeline against the clean data.

**STRICT CONSTRAINTS:**
- **Exclude** all Labor-Saving, Automation, Fencing, Tractors, and Refrigeration PMs from generated scripts.
- **Exclude** all Data Optimization and Data Production PMs from generated scripts.
- **Exclude** `building_art_academy` entirely from generated scripts.
- **Master CSV** must remain the "Single Source of Truth" for all production data.

---

### Task 1: Master CSV Core Sync & Global Type Repair

**Files:**
- Modify: `Victoria3 building PM/victoria3_building_pm_goods.csv`

**Step 1: Apply Tech Reclassification (Balance -> Upgrade)**
Locate and change the `type` from `balance` to `upgrade` for groups that follow linear tech with identical outputs (non-labor saving):
- **Chemical Plant:** `pmg_fertilizer_production` (Correct: `pm_artificial_fertilizers`, `pm_improved_fertilizer`, `pm_nitrogen_fixation`, `pm_hb_process_steam_reforming`, `pm_advanced_ammonia_synthesis`).
- **Steel Mill:** `pmg_direct_reduced_iron_steelmaking` (Correct: `pm_disabled_direct_reduced_iron`, `pm_direct_reduced_iron_hyl_process`, `pm_direct_reduced_iron_midrex_process`).
- **Electronics:** `pmg_base_building_electroniccomponents` (Correct: `pm_integrated_transistor`, `pm_nano_transistor`, etc).
- **Mines:** All `pmg_explosives_building_*` groups (e.g., Bauxite, Copper, Gold mines).
- **Batteries:** `pmg_base_building_batteries` (Voltaic Pile, etc).

**Step 2: Apply Output Shift Reclassification (Upgrade -> Balance)**
Locate and change the `type` from `upgrade` to `balance` for groups that involve actual output shifts:
- **Aircraft Industry:** `pmg_aeroplanes` (Actually balances Planes vs Space Assets/Rockets).
- **Media/Publishing:** `pmg_digital_media_industry` (Balances Data vs Software vs Entertainment).
- **Whaling:** `pmg_base_building_whaling_station` (Balances Meat vs Oil ratios).

**Step 3: Apply Labor-Saving Classification**
Locate and ensure these are marked as `labor_saving` to ensure they are filtered out:
- **Agriculture:** `pmg_harvesting_process_*` (Includes `pm_tractors`, `pm_compression_ignition_tractors`, `pm_autonomous_agricultural_vehicles`).
- **Ranching:** `pmg_fencing` and `pmg_refrigeration_building_livestock_ranch`.
- **All Industries:** Ensure all `pmg_automation_*` and `pmg_steam_automation_*` groups are marked `labor_saving`.

**Step 4: Update Weight Overrides**
- **Steel Mill:** Update `pm_oxygen_steel_process` weight for `electroniccomponents` to `10` and `electricity` to `30`.

**Step 5: Batch-Import Missing Core PMs**
- Extract and add ~150 core tech PMs identified for Alloys, Energy, and Logistics from `ztr_new_production_methods.txt` and `ztr_vanilla_production_methods.txt`.

---

### Task 2: Add Missing Tech & Res Buildings to Master

**Files:**
- Modify: `Victoria3 building PM/victoria3_building_pm_goods.csv`

**Step 1: Extract and Add `building_computer_assembly_plant`**
Extract all production PMs from `ztr_industrial_buildings.txt`. 
Append rows for `pmg_base_building_computers`. Mark automation groups as `labor_saving`.

**Step 2: Extract and Add `building_fusion_power_plant`**
Extract all PMs from `ztr_energy_buildings.txt`. 
Append all rows for `pmg_fusion_reactor` and `pmg_fusion_plasma_monitoring` to Master CSV.

**Step 3: Extract and Add `building_synthetics_plant`**
Extract all core production and cosmetic PMs from `ztr_industrial_buildings.txt`.
Append to Master CSV.

**Step 4: Extract and Add modded `building_livestock_ranch`**
Extract tech-progressive weights for breeding from `ztr_agriculture_production_methods.txt`. 
Ensure Fencing/Refrigeration groups are extracted but marked as `labor_saving`.

---

### Task 3: Programmatic Classification Audit (The Verification Layer)

**Files:**
- Create: `tools/audit_classification.js`

**Step 1: Implement Output Shift Detector**
The script must compare the `goods_output_*` entries for every PM in each group.
- If PMs in a group have DIFFERENT output goods types or DIFFERENT output quantity ratios, the group MUST be `balance`.
- Flag any `upgrade` group that fails this test for manual fix.

**Step 2: Implement Tech Sequence Checker**
The script must verify the `unlocking_technologies` for every group in the CSV.
- If PMs in a group are unlocked by sequential technologies and produce the SAME goods, the group MUST be `upgrade`.
- Flag any `balance` group that follows a linear tech path with no output shift.

**Step 3: Implement Workforce Impact Audit**
- Programmatically scan all PMs marked as `upgrade` or `balance`.
- If a PM has a negative `building_employment_laborers_add` or similar workforce reduction, flag it as "Potential Labor Saving".
- Re-classify flagged entries as `labor_saving` in the Master CSV.

**Step 4: Constraint Verification**
- Verify that NO PM belonging to `automation`, `labor`, `fencing`, `refrigeration`, `tractors`, or `data_` groups is misclassified as `balance` or `upgrade`.

---

### Task 4: Implementation of Filtering Layer (Layer 3)

**Files:**
- Create: `tools/csv_filter.js`

**Step 1: Write Filter Logic**
Implement a Node.js script that:
1. Reads `Victoria3 building PM/victoria3_building_pm_goods.csv`.
2. Excludes rows where `type == labor_saving`.
3. Excludes rows where `production_method_groups` matches keywords: `automation`, `fencing`, `refrigeration`, `data_optimization`, `data_production`, `harvesting_process`.
4. Excludes rows where `building == building_art_academy`.
5. Writes the final "Clean Buffer" to `OGAS script generator/pm_goods.csv`.

**Step 2: Verify Filter Output**
- Check that the generator CSV contains zero entries for Tractors, Automation, or Data PMs.
- Confirm total line count is significantly reduced (by ~800+ lines).

---

### Task 5: Pipeline Execution & Final Validation

**Files:**
- Run: `tools/csv_filter.js`
- Run: `Victoria3 building PM/main.py`
- Run: `OGAS script generator/main.py`

**Step 1: Run building CSV expander**
Execute Python script in `Victoria3 building PM` to process the updated Master CSV.

**Step 2: Generate Clean Buffer**
Run `tools/csv_filter.js` to prepare the generator input.

**Step 3: Run Final OGAS Generator**
Run `main.py` in `OGAS script generator` using the clean buffer.

**Step 4: Global Integrity Verification**
Programmatically verify:
1. `AUTO_PM_upgrade.txt` includes the new tech paths for Chemicals, Steel, and Electronics.
2. `AUTO_PM_balance.txt` includes the correct output-shifting logic for Aircraft and Media.
3. `AUTO_database_pm_goods.txt` contains zero entries for Tractors, Automation, Fencing, or Data PMs.
4. Verify total script-value count is within safe limits for Victoria 3.
