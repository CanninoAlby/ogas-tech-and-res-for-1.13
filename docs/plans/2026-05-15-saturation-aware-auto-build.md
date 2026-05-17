# Saturation-Aware Auto-Build Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform OGAS from a fixed-amount builder to a capacity-aware system that calculates the optimal building levels to add based on market saturation and enforces full market access.

**Architecture:** 
1. Tighten Market Access triggers to 100%.
2. Calculate "Marginal Profit Decay" using existing market supply and base price variables.
3. Solve for "Profitable Capacity" by dividing excess profit by the decay rate.
4. Update construction effects to queue exactly the calculated amount (capped by user limits).

**Tech Stack:** Victoria 3 Script (Modding)

---

### Task 1: Enforce Full Market Access

**Files:**
- Modify: `ogas tech and res for 1.13\common\scripted_triggers\cnm_OGAS_scripted_triggers.txt`

**Step 1: Update cnm_market_access_ok**

```v3script
cnm_market_access_ok = {
	state.market_access >= 1
}
```

**Step 2: Commit**

```bash
git add "ogas tech and res for 1.13\common\scripted_triggers\cnm_OGAS_scripted_triggers.txt"
git commit -m "fix: enforce 100% market access for OGAS construction"
```

---

### Task 2: Define Marginal Profit Decay Calculation

**Files:**
- Modify: `ogas tech and res for 1.13\common\script_values\cnm_construct_script_values.txt`

**Step 1: Add Decay and Capacity Script Values**

```v3script
# Estimated drop in unit profit per new level
# D = (Base Price * Base Output) / Total Market Supply
# Note: Base Price and Output are building-type specific
cnm_marginal_profit_decay = {
    value = building_type.base_price
    multiply = building_type.base_output # This might need per-building mappings if not natively exposed
    divide = {
        value = market_goods_total_supply # Accessing via existing OGAS market logic
        min = 100 # Prevent division by zero
    }
}

# Calculated Profitable Capacity (C)
# C = (Predicted Profit - Min Threshold) / Decay
cnm_profitable_capacity = {
    value = weekly_profit # Existing OGAS prediction
    subtract = owner.var:cnm_auto_construct_min_profit_threshold # User defined threshold
    divide = {
        value = cnm_marginal_profit_decay
        min = 0.01
    }
    max = owner.var:cnm_auto_construct_amount # Respect user batch limit
}
```

**Step 2: Commit**

```bash
git add "ogas tech and res for 1.13\common\script_values\cnm_construct_script_values.txt"
git commit -m "feat: implement saturation capacity formula"
```

---

### Task 3: Update Construction Effect for Dynamic Amounts

**Files:**
- Modify: `ogas tech and res for 1.13\common\scripted_effects\AUTO_OGAS_construct.txt`

**Step 1: Update OGAS_find_best_profit_building loop**

Inject the saturation amount into the construction call.

```v3script
# Inside the building type checks (example for advancedores_mine)
if = {
    limit = { 
        is_building_type = building_advancedores_mine
    }
    state = {
        # Calculate saturation for this specific building
        save_scope_value_as = {
            name = OGAS_saturation_amount
            value = cnm_profitable_capacity
        }
        start_building_construction = {
            building = building_advancedores_mine
            amount = scope:OGAS_saturation_amount
        }
    }
}
```

**Step 2: Commit**

```bash
git add "ogas tech and res for 1.13\common\scripted_effects\AUTO_OGAS_construct.txt"
git commit -m "feat: use dynamic saturation amount in construction queue"
```

---

### Task 4: Validation and Tuning

**Step 1: Verify syntax with Victoria 3 Tiger (if available)**

Run: `vic3-tiger.exe "ogas tech and res for 1.13"`
Expected: No errors in modified files.

**Step 2: Final Commit**

```bash
git commit -m "docs: finalized saturation-aware auto-build system"
```
