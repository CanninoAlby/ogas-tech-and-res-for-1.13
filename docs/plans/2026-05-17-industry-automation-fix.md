# Furniture & Synthetics Industry Automation Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement missing core tech progression automation for Furniture Manufactories and Synthetics Plants in OGAS.

**Architecture:** Inject construction cost for Synthetics Plants, define profit simulation variables for both industries, and add the tech upgrade blocks to the OGAS PM manager.

**Tech Stack:** Victoria 3 Script / Paradox Script

---

### Task 1: Synthetics Plant Database Wiring

**Files:**
- Modify: `common/script_values/AUTO_database_building_construction_cost.txt`
- Modify: `common/script_values/AUTO_get_building_profit_weight.txt`

**Step 1: Define Construction Cost**
Inject into `AUTO_database_building_construction_cost.txt`:
```paradox
    if = {
        limit = { is_building_type = building_synthetics_plant }
        value = construction_cost_very_high
    }
```

**Step 2: Define Profit Weight**
Inject into `AUTO_get_building_profit_weight.txt`:
```paradox
    if = {
        limit = { is_building_type = building_synthetics_plant }
        value = owner.var:cnm_auto_construct_building_synthetics_plant
    }
```

---

### Task 2: Profit Prediction Logic (Furniture)

**Files:**
- Modify: `common/script_values/AUTO_building_profit_prediction.txt`
- Modify: `common/script_values/AUTO_goods_origin.txt`

**Step 1: Add Goods Origin (if missing)**
Add `_if_no_pmg_base_building_furniture_manufactory` logic to `AUTO_goods_origin.txt` for Wood, Fabric, and Furniture.

**Step 2: Add Profit Predictions**
Add script values for `pm_lathe`, `pm_mechanized_workshops`, and `pm_synthetic_furniture_molding`.

---

### Task 3: Profit Prediction Logic (Synthetics)

**Files:**
- Modify: `common/script_values/AUTO_building_profit_prediction.txt`

**Step 1: Add Predictions for Cosmetics Chain**
Add profit prediction script values for the `pmg_cosmetics` group in Synthetics Plants.

---

### Task 4: Inject Upgrade Blocks into AUTO_PM_upgrade.txt

**Files:**
- Modify: `common/scripted_effects/AUTO_PM_upgrade.txt`

**Step 1: Add Furniture Tech Chain**
Inject `ordered_scope_state` blocks to upgrade:
- `pm_handcrafted_furniture` -> `pm_lathe`
- `pm_lathe` -> `pm_mechanized_workshops`
- `pm_mechanized_workshops` -> `pm_synthetic_furniture_molding`

**Step 2: Add Synthetics Tech Chain**
Inject `ordered_scope_state` blocks for its base PM chain.

---

### Task 5: Final Audit & Verification

- Run script to verify balanced braces in all modified files.
- Verify no duplicate definitions.
