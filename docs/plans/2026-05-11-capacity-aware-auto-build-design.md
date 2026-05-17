# Design: Capacity-Aware Auto-Build (Profit-to-Saturation Division)

## Overview
This design upgrades the "OGAS" auto-build system from a binary profitability check (build 1 if profit > threshold) to a capacity-aware calculation. It determines *how many* levels of a building can be added before the profit margin drops below the target threshold.

## Mathematical Model
The script calculates the **Calculated Profitable Capacity ($C$)** using the following formula:

$$C = \frac{\text{Predicted Unit Profit} - \text{Minimum Profit Threshold}}{\text{Marginal Profit Decay}}$$

### 1. Predicted Unit Profit
Utilizes the existing variables from `AUTO_building_profit_prediction.txt`.

### 2. Marginal Profit Decay ($D$)
A value representing the expected drop in unit profit per new level. To keep the script lightweight, we use a supply-scaled constant:
$$D = \frac{\text{Pre-calculated Constant}}{\text{Market Total Supply of Output Good}}$$

*   **Pre-calculated Constant:** Calculated by the Python script based on `Base Price * Base Output`.
*   **Market Total Supply:** Uses the existing game engine variable `market_goods_total_supply`. This ensures that in a large market, the "decay" per building level is much smaller than in a small market.

## Implementation Details

### Batch Limit Integration
The system respects the user-defined batch limit (`cnm_auto_construct_amount`):
$$\text{Final Build Amount} = \min(C, \text{Batch Limit})$$

### Components to Update
1.  **Python Script (`main.py`):**
    *   Add logic to calculate the `marginal_profit_impact` constant for every production method.
    *   Export these constants to a new script value database.
2.  **Script Values (`AUTO_get_building_profit_weight.txt`):**
    *   Implement the division formula to calculate $C$ for the specific state.
3.  **Scripted Effects (`AUTO_OGAS_construct.txt`):**
    *   Change the `start_building_construction` logic to accept a variable `amount` based on $C$.

## Advantages
- **Efficiency:** Prevents multiple ticks of evaluation for obviously needed buildings.
- **Precision:** Automatically slows down construction as the market nears saturation.
- **Performance:** Performs a single division rather than an iterative loop, maintaining high game speed.
