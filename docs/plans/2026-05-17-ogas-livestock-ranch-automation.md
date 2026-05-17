# OGAS Livestock Ranch Automation Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the missing production method (PM) automation and economic prediction logic for Livestock Ranches (`building_livestock_ranch`) within the OGAS mod framework.

**Architecture:** We will surgically inject the missing definitions into the auto-generated OGAS database files (`AUTO_database_building_construction_cost.txt`, `AUTO_building_profit_prediction.txt`, `AUTO_goods_origin.txt`, `AUTO_get_building_profit_weight.txt`) and add the PM upgrade logic to `AUTO_PM_upgrade.txt` and `cnm_pm_manager_scripted_effects.txt`. We will use existing farm logic (e.g., Rye Farms) as a structural template.

**Tech Stack:** Paradox Interactive Scripting Language (Victoria 3 Modding)

---

### Task 1: Define Construction Cost

**Files:**
- Modify: `C:\Users\axioo\Documents\Paradox Interactive\Victoria 3\mod\ogas tech and res for 1.13\common\script_values\AUTO_database_building_construction_cost.txt`

**Step 1: Write the implementation**
Inject the `is_building_type = building_livestock_ranch` block into the `building_construction_cost` definition.

```paradox
    if = {
        limit = {
            is_building_type = building_livestock_ranch
        }
        value = construction_cost_low
    }
```

**Step 2: Verify syntax**
Verify the brackets are balanced using a script or manual review.

**Step 3: Commit**
```bash
git add "common/script_values/AUTO_database_building_construction_cost.txt"
git commit -m "feat(ogas): add livestock ranch construction cost"
```

---

### Task 2: Add Building Profit Weight Definition

**Files:**
- Modify: `C:\Users\axioo\Documents\Paradox Interactive\Victoria 3\mod\ogas tech and res for 1.13\common\script_values\AUTO_get_building_profit_weight.txt`

**Step 1: Write the implementation**
Inject the building weight definition.

```paradox
    if = {
        limit = {
            is_building_type = building_livestock_ranch
        }
        value = owner.var:cnm_auto_construct_building_livestock_ranch
    }
```

**Step 2: Commit**
```bash
git add "common/script_values/AUTO_get_building_profit_weight.txt"
git commit -m "feat(ogas): add livestock ranch profit weight mapping"
```

---

### Task 3: Add Profit Prediction Script Values

**Files:**
- Modify: `C:\Users\axioo\Documents\Paradox Interactive\Victoria 3\mod\ogas tech and res for 1.13\common\script_values\AUTO_building_profit_prediction.txt`

**Step 1: Write the implementation**
Add the core profit prediction definitions for the main PM chain (`pm_open_air_stockyards`, `pm_butchering_tools`, `pm_slaughterhouses`, `pm_mechanized_slaughtering`, `pm_conveyor_belt_abattoirs`).

```paradox
pmg_base_building_livestock_ranch_pm_open_air_stockyards_profit_prediction = {
        value = state_meat_production_if_no_pmg_base_building_livestock_ranch
        value = state_meat_consumption_if_no_pmg_base_building_livestock_ranch
        value = market_meat_production_if_no_pmg_base_building_livestock_ranch
        value = market_meat_consumption_if_no_pmg_base_building_livestock_ranch
}
pmg_base_building_livestock_ranch_pm_open_air_stockyards_profit_prediction_weighted = {
    value = pmg_base_building_livestock_ranch_pm_open_air_stockyards_profit_prediction
}

pmg_base_building_livestock_ranch_pm_butchering_tools_profit_prediction = {
        value = state_meat_production_if_no_pmg_base_building_livestock_ranch
        value = state_meat_consumption_if_no_pmg_base_building_livestock_ranch
        value = market_meat_production_if_no_pmg_base_building_livestock_ranch
        value = market_meat_consumption_if_no_pmg_base_building_livestock_ranch
        value = state_tools_production_if_no_pmg_base_building_livestock_ranch
        value = state_tools_consumption_if_no_pmg_base_building_livestock_ranch
        value = market_tools_production_if_no_pmg_base_building_livestock_ranch
        value = market_tools_consumption_if_no_pmg_base_building_livestock_ranch
}
pmg_base_building_livestock_ranch_pm_butchering_tools_profit_prediction_weighted = {
    value = pmg_base_building_livestock_ranch_pm_butchering_tools_profit_prediction
}

pmg_base_building_livestock_ranch_pm_slaughterhouses_profit_prediction = {
        value = state_meat_production_if_no_pmg_base_building_livestock_ranch
        value = state_meat_consumption_if_no_pmg_base_building_livestock_ranch
        value = market_meat_production_if_no_pmg_base_building_livestock_ranch
        value = market_meat_consumption_if_no_pmg_base_building_livestock_ranch
        value = state_tools_production_if_no_pmg_base_building_livestock_ranch
        value = state_tools_consumption_if_no_pmg_base_building_livestock_ranch
        value = market_tools_production_if_no_pmg_base_building_livestock_ranch
        value = market_tools_consumption_if_no_pmg_base_building_livestock_ranch
}
pmg_base_building_livestock_ranch_pm_slaughterhouses_profit_prediction_weighted = {
    value = pmg_base_building_livestock_ranch_pm_slaughterhouses_profit_prediction
}
```
*(Note: We are adding a subset of the necessary predictions to keep the manual task scope manageable but effective. Mechanized slaughtering and conveyor belts require engines and electricity respectively and can be added subsequently).*

**Step 2: Commit**
```bash
git add "common/script_values/AUTO_building_profit_prediction.txt"
git commit -m "feat(ogas): add base profit predictions for livestock ranches"
```

---

### Task 4: Add Goods Origin Variables

**Files:**
- Modify: `C:\Users\axioo\Documents\Paradox Interactive\Victoria 3\mod\ogas tech and res for 1.13\common\script_values\AUTO_goods_origin.txt`

**Step 1: Write the implementation**
We need to add the `_if_no_pmg_base_building_livestock_ranch` variables for Meat and Tools.

```paradox
state_meat_production_if_no_pmg_base_building_livestock_ranch = {
    value = state.sg:meat.state_goods_production
    if = {
        limit = { pmg_base_building_livestock_ranch_meat_current > 0.0 }
        subtract = pmg_base_building_livestock_ranch_meat_current
    }
}
state_meat_consumption_if_no_pmg_base_building_livestock_ranch = {
    value = state.sg:meat.state_goods_consumption
}
market_meat_production_if_no_pmg_base_building_livestock_ranch = {
    value = market.mg:meat.market_goods_production
    if = {
        limit = { pmg_base_building_livestock_ranch_meat_current > 0.0 }
        subtract = pmg_base_building_livestock_ranch_meat_current
    }
}
market_meat_consumption_if_no_pmg_base_building_livestock_ranch = {
    value = market.mg:meat.market_goods_consumption
}

state_tools_production_if_no_pmg_base_building_livestock_ranch = {
    value = state.sg:tools.state_goods_production
}
state_tools_consumption_if_no_pmg_base_building_livestock_ranch = {
    value = state.sg:tools.state_goods_consumption
    if = {
        limit = { pmg_base_building_livestock_ranch_tools_current > 0.0 }
        subtract = pmg_base_building_livestock_ranch_tools_current
    }
}
market_tools_production_if_no_pmg_base_building_livestock_ranch = {
    value = market.mg:tools.market_goods_production
}
market_tools_consumption_if_no_pmg_base_building_livestock_ranch = {
    value = market.mg:tools.market_goods_consumption
    if = {
        limit = { pmg_base_building_livestock_ranch_tools_current > 0.0 }
        subtract = pmg_base_building_livestock_ranch_tools_current
    }
}
```

**Step 2: Commit**
```bash
git add "common/script_values/AUTO_goods_origin.txt"
git commit -m "feat(ogas): add goods origin logic for livestock ranches"
```

---

### Task 5: Add Upgrade Logic to PM Manager

**Files:**
- Modify: `C:\Users\axioo\Documents\Paradox Interactive\Victoria 3\mod\ogas tech and res for 1.13\common\scripted_effects\AUTO_PM_upgrade.txt`

**Step 1: Write the implementation**
Inject the `ordered_scope_state` upgrade commands.

```paradox
    ordered_scope_state = {
        limit = {
            has_active_building = building_livestock_ranch
            b:building_livestock_ranch.occupancy > 0.01
            is_production_method_active = {
                building_type = building_livestock_ranch
                production_method = pm_open_air_stockyards
            }
            can_activate_production_method = {
                building_type = building_livestock_ranch
                production_method = pm_butchering_tools
            }
            b:building_livestock_ranch.pmg_base_building_livestock_ranch_pm_butchering_tools_profit_prediction_weighted > b:building_livestock_ranch.pmg_base_building_livestock_ranch_pm_open_air_stockyards_profit_prediction
        }
        order_by = b:building_livestock_ranch.pmg_base_building_livestock_ranch_pm_butchering_tools_profit_prediction_weighted
        max = owner.var:cnm_pm_manage_amount
        check_range_bounds = no
        activate_production_method = {
            building_type = building_livestock_ranch
            production_method = pm_butchering_tools
        }
    }
    ordered_scope_state = {
        limit = {
            has_active_building = building_livestock_ranch
            b:building_livestock_ranch.occupancy > 0.01
            is_production_method_active = {
                building_type = building_livestock_ranch
                production_method = pm_butchering_tools
            }
            can_activate_production_method = {
                building_type = building_livestock_ranch
                production_method = pm_slaughterhouses
            }
            b:building_livestock_ranch.pmg_base_building_livestock_ranch_pm_slaughterhouses_profit_prediction_weighted > b:building_livestock_ranch.pmg_base_building_livestock_ranch_pm_butchering_tools_profit_prediction
        }
        order_by = b:building_livestock_ranch.pmg_base_building_livestock_ranch_pm_slaughterhouses_profit_prediction_weighted
        max = owner.var:cnm_pm_manage_amount
        check_range_bounds = no
        activate_production_method = {
            building_type = building_livestock_ranch
            production_method = pm_slaughterhouses
        }
    }
```

**Step 2: Commit**
```bash
git add "common/scripted_effects/AUTO_PM_upgrade.txt"
git commit -m "feat(ogas): add PM upgrade logic for livestock ranches"
```
