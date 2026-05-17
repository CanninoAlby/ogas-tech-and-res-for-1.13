# Final Industry Automation Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement missing automation logic for the final set of verified industrial gaps: Publishing Industry (Linotype chain), Uranium Mines, and Mendelejew processing plants.

**Architecture:** Use the custom Node.js automation suite to extract mod data, update the `pm_goods.csv` brain, and generate the final Paradox script blocks for the `AUTO_...` files.

**Tech Stack:** Node.js, Paradox Script.

---

### Task 1: Data Extraction for Final Industries

**Goal:** Extract input/output values for the specific missing PM groups.

**Files:**
- Source: `Victoria3 building PM/production_methods/00_merged_production_methods.txt`
- Target JSON: `tools/extracted_final_gaps_data.json`

**Industries to Target:**
1.  `building_manzoni_publishing_industry` (PM Group: `manzoni_pmg_building_publishing_industry_automation`)
2.  `building_uranium_mine` (PM Group: `pmg_refined_fuel_building_uranium_mine`)
3.  `building_mendelejew_hydrogenation_plants` (PM Group: `pmg_gasification_building_mendelejew_hydrogenation_plants`)

---

### Task 2: CSV Brain Update (Additive)

**Goal:** Safely append these final industrial rows to `pm_goods.csv`.

**Logic:**
- Ensure types are correctly set to `upgrade` for the tech chains.
- Ensure construction costs match the building definitions (mostly `construction_cost_high`).
- **Safety**: Append-only, no deletion.

---

### Task 3: Script Value Generation

**Goal:** Generate the required `pm_..._good` and `profit_prediction` variables for the new rows.

**Files:**
- Modify: `common/script_values/AUTO_database_pm_goods.txt`
- Modify: `common/script_values/AUTO_building_profit_prediction.txt`
- Modify: `common/script_values/AUTO_goods_origin.txt`

---

### Task 4: Final Upgrade Block Injection

**Goal:** Inject the `ordered_scope_state` blocks into `AUTO_PM_upgrade.txt`.

**Tech Chains to Automate:**
- **Publishing:** Printing Presses -> Rotary Presses -> Linotype -> Offset -> Digital Press.
- **Uranium:** Natural Uranium -> Centrifuge Refining -> Laser Isotope Separation.
- **Mendelejew:** Basic Gasification -> Advanced Catalytic Gasification.

---

### Task 5: Verification & Stutter Check

- Final balanced brace check.
- Confirm Linotype logic is present in the file.
