# GDP-Maximization Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Shift OGAS construction priority from pure dividends to total GDP contribution (Value Added) using high-performance engine variables and OGAS predictions as fallbacks.

**Architecture:** 
1. **Existing Buildings:** Use engine data `weekly_revenue - (weekly_expenses - weekly_wages)` to get real-time Value Added.
2. **New Buildings:** Use active PM profit predictions from OGAS as fallbacks.
3. **Weighting:** Update `cnm_building_profit_weight` to prioritize this new Value Added score.

**Tech Stack:** Victoria 3 Script (Modding)

---

### Task 0: Mandatory Backups

**Files:**
- Create: `ogas tech and res for 1.13\backup_GDP_upgrade\`

**Step 1: Backup critical files**
Run the following shell commands to create a safety net.

```powershell
mkdir "ogas tech and res for 1.13\backup_GDP_upgrade"
cp "ogas tech and res for 1.13\common\script_values\cnm_construct_script_values.txt" "ogas tech and res for 1.13\backup_GDP_upgrade\"
cp "ogas tech and res for 1.13\common\script_values\AUTO_get_building_profit_weight.txt" "ogas tech and res for 1.13\backup_GDP_upgrade\"
```

---

### Task 1: Implement Value Added Script Value

**Files:**
- Modify: `ogas tech and res for 1.13\common\script_values\cnm_construct_script_values.txt`

**Step 1: Define cnm_gdp_value_added**
Add a new script value that calculates Value Added, favoring engine data but allowing for prediction fallbacks.

```v3script
cnm_gdp_value_added = {
    if = {
        limit = {
            # Check if building exists in state to use engine data
            level > 0
        }
        value = weekly_revenue
        subtract = {
            value = weekly_expenses
            subtract = weekly_wages
        }
    }
    else = {
        # Fallback to OGAS profit prediction (Revenue - Input)
        # Note: This is an abstraction, we will map this in Task 2
        value = weekly_profit 
    }
}
```

**Step 2: Update cnm_building_profit_weight**
Change the core weight from `weekly_profit` to our new GDP-focused value.

```v3script
cnm_building_profit_per_level = {
	value = cnm_gdp_value_added # Swapped from weekly_profit
	divide = level
}
```

---

### Task 2: Advanced Mapping (Optimization)

**Files:**
- Modify: `ogas tech and res for 1.13\common\script_values\AUTO_get_building_profit_weight.txt`

**Step 1: Link Predictions to Weights**
Instead of just using user multipliers, we will multiply the weight by the predicted capacity or profit if the building doesn't exist yet. (This ensures OGAS "sees" new industries).

```v3script
# Example for a specific building block
if = {
    limit = {
        is_building_type = building_advancedores_mine
    }
    value = owner.var:cnm_auto_construct_building_advancedores_mine
    # Multiply by prediction if building is new/small to boost discovery
    if = {
        limit = { level < 1 }
        multiply = pmg_mining_equipment_building_advancedores_mine_pm_picks_and_shovels_building_advancedores_mine_profit_prediction
    }
}
```

---

### Task 3: Final Verification

**Step 1: Syntax Check**
Run: `vic3-tiger.exe "ogas tech and res for 1.13"`

**Step 2: Commit**
```bash
git commit -m "feat: implemented GDP-maximizing auto-build logic"
```
