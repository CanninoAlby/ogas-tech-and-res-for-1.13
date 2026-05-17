# Master Batch Industry Automation Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automate all 40+ missing or incomplete industrial buildings identified in the audit using a custom Node.js data extraction and script generation suite.

**Architecture:** We will build a "Data Bridge" that reads raw mod data, converts it to OGAS database format, and then generates the final Paradox script blocks for injection. This avoids manual errors and ensures 100% coverage.

**Tech Stack:** Node.js (filesystem, regex), Paradox Script.

---

### Task 1: The Data Extractor (The Brain)

**Goal:** Build a Node.js script that extracts production/consumption values for all missing industries.

**Files:**
- Create: `C:\Users\axioo\Documents\Paradox Interactive\Victoria 3\mod\ogas tech and res for 1.13\tools\batch_data_extractor.js`

**Logic:**
- Read `00_merged_buildings.txt` to get the list of buildings and their PM groups.
- Read `00_merged_production_methods.txt` to get the specific goods and quantities.
- Filter for the 40 targeted industries.
- Output a structured JSON file `tools/extracted_industry_data.json`.

---

### Task 2: CSV Database Expansion (Additive)

**Goal:** Safely append the extracted data to `pm_goods.csv`.

**Files:**
- Modify: `C:\Users\axioo\Documents\Paradox Interactive\Victoria 3\mod\ogas tech and res for 1.13\OGAS script generator\pm_goods.csv`

**Logic:**
- Script reads `extracted_industry_data.json`.
- Maps the data to the CSV column structure.
- **Appends** only new rows to the bottom. **NEVER deletes existing rows.**

---

### Task 3: Automatic Database Generation (Script Values)

**Goal:** Generate the required `AUTO_...` script values.

**Files:**
- Modify: `common/script_values/AUTO_database_pm_goods.txt`
- Modify: `common/script_values/AUTO_building_profit_prediction.txt`
- Modify: `common/script_values/AUTO_goods_origin.txt`

**Logic:**
- Generate the thousands of required variables (e.g., `pm_..._meat`, `pmg_..._profit_prediction`).
- Use `Add-Content` to append them to the existing files.

---

### Task 4: Automation Block Generation (Upgrades & Balance)

**Goal:** Generate and inject the core automation blocks.

**Files:**
- Modify: `common/scripted_effects/AUTO_PM_upgrade.txt`
- Modify: `common/scripted_effects/AUTO_PM_balance.txt`

**Logic:**
- Generate the `ordered_scope_state` blocks for all 40+ tech chains.
- Use a Node.js script to find the correct `PM_upgrade = {` and `PM_balance = {` blocks and inject the new logic inside them.

---

### Task 5: Final Economic Audit

- Run a stutter-check script (check for balanced braces).
- Verify that Furniture and Synthetics now have tech progression blocks.
- Confirm total building coverage in OGAS is 100%.
