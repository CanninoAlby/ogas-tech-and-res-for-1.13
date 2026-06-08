#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Read victoria3_building_pm_goods.csv, drop non-managed buildings, map PMG
texture types to OGAS upgrade/balance/labor_saving, write ../OGAS script generator/pm_goods.csv
"""
from __future__ import annotations

import csv
import shutil
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CSV_IN = ROOT / "victoria3_building_pm_goods.csv"
OUT_DIR = ROOT.parent / "OGAS script generator"
CSV_OUT = OUT_DIR / "pm_goods.csv"
GOODS_SRC = ROOT / "goods" / "00_goods.txt"
GOODS_DST = OUT_DIR / "goods" / "00_goods.txt"
PM_FILE = ROOT / "production_methods" / "00_merged_production_methods.txt"

# Same exclusion set as previous tech&res OGAS adapter (government, wonders, infra, subsistence, etc.)
EXCLUDE_BUILDINGS: frozenset[str] = frozenset(
    {
        "building_airport",
        "building_angkor_wat",
        "building_argebam",
        "building_barrack",
        "building_big_ben",
        "building_capitol_hill",
        "building_central_park",
        "building_chichen_itza",
        "building_company_headquarter",
        "building_company_regional_headquarter",
        "building_conscription_center",
        "building_construction_sector",
        "building_cristo_redentor",
        "building_easter_island_heads",
        "building_eiffel_tower",
        "building_estacion_de_madrid_atocha",
        "building_eye_of_sahara",
        "building_financial_district",
        "building_forbidden_city",
        "building_giza_necropolis",
        "building_government_administration",
        "building_gran_teatro_de_la_habana",
        "building_hagia_sophia",
        "building_halloween_castledracula",
        "building_kaiserforum_2",
        "building_kaiserforum_3",
        "building_kaiserforum_4",
        "building_khaju_bridge",
        "building_machu_picchu",
        "building_manila_cathedral_monument",
        "building_manila_cathedral_original",
        "building_manila_cathedral_ruins",
        "building_manor_house",
        "building_martandsuntemple",
        "building_mosque_of_djenne",
        "building_naval_base",
        "building_nuclear_weapons_silo",
        "building_observatorygreenwich",
        "building_pena_convent",
        "building_pena_palace",
        "building_petra",
        "building_port",
        "building_power_bloc_statue",
        "building_research_center",
        "building_sagrada_familia_cathedral_1",
        "building_sagrada_familia_cathedral_2",
        "building_sagrada_familia_cathedral_3",
        "building_saint_basils_cathedral",
        "building_skyscraper",
        "building_statue_of_liberty",
        "building_subsistence_farm",
        "building_subsistence_fishing_village",
        "building_subsistence_orchard",
        "building_subsistence_pasture",
        "building_subsistence_rice_farm",
        "building_taj_mahal",
        "building_temple_of_poseidon",
        "building_trade_center",
        "building_university",
        "building_urban_center",
        "building_vatican_city",
        "building_victoria_terminus",
        "building_wat_arun",
        "building_white_house",
    }
)

def parse_pms() -> dict[str, bool]:
    pms = {}
    if not PM_FILE.is_file():
        return pms
        
    content = PM_FILE.read_text(encoding="utf-8")
    
    # We will use brace matching to extract the body of each PM
    i = 0
    while i < len(content):
        next_equals = content.find("=", i)
        if next_equals == -1:
            break
            
        before_equals = content[i:next_equals].strip()
        lines = before_equals.split("\n")
        last_line = re.sub(r"#.*", "", lines[-1]).strip()
        
        match = re.search(r"(\w+)$", last_line)
        if not match:
            i = next_equals + 1
            continue
            
        pm_name = match.group(1)
        next_brace = content.find("{", next_equals)
        if next_brace == -1:
            break
            
        brace_count = 1
        j = next_brace + 1
        while j < len(content) and brace_count > 0:
            if content[j] == "{":
                brace_count += 1
            elif content[j] == "}":
                brace_count -= 1
            j += 1
            
        if brace_count == 0:
            body = content[next_brace + 1: j - 1]
            is_labor_saving = False
            for m in re.finditer(r"building_employment_\w+_add\s*=\s*(-?\d+)", body):
                val = int(m.group(1))
                if val < 0:
                    is_labor_saving = True
            pms[pm_name] = is_labor_saving
        i = j
        
    return pms

def get_outputs(row: list[str], header: list[str]) -> dict[str, float]:
    outputs = {}
    for j in range(5, len(row)):
        try:
            val = float(row[j])
            if val > 0:
                outputs[header[j]] = val
        except ValueError:
            pass
    return outputs

def is_output_shift(out1: dict[str, float], out2: dict[str, float]) -> bool:
    keys1 = sorted(out1.keys())
    keys2 = sorted(out2.keys())
    
    if keys1 != keys2:
        return True
        
    if not keys1 or not keys2:
        return False
        
    first_key = keys1[0]
    ratio = out2[first_key] / out1[first_key]
    for key in keys1:
        if abs(out2[key] / out1[key] - ratio) > 0.001:
            return True
    return False

def main() -> None:
    if not CSV_IN.is_file():
        raise SystemExit(f"Missing {CSV_IN}; run main.py first.")
    GOODS_DST.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(GOODS_SRC, GOODS_DST)

    with CSV_IN.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    if len(rows) < 2:
        raise SystemExit("Empty CSV")
        
    header, body = rows[0], rows[1:]
    
    pm_data = parse_pms()
    labor_saving_keywords = ['automation', 'labor', 'fencing', 'refrigeration', 'data_', 'harvesting_process']
    
    # Group rows by PM group
    groups = {}
    for i, row in enumerate(body):
        if len(row) < 5:
            continue
        group_name = row[1].strip()
        if group_name not in groups:
            groups[group_name] = []
        groups[group_name].append((i, row))
        
    group_is_labor_saving = {}
    for group_name, group_rows in groups.items():
        has_labor_saving = False
        if any(k in group_name for k in labor_saving_keywords):
            has_labor_saving = True
            
        for _, row in group_rows:
            pm_name = row[2].strip()
            if pm_data.get(pm_name, False):
                has_labor_saving = True
                break
                
        group_is_labor_saving[group_name] = has_labor_saving
        
    out_body: list[list[str]] = []
    
    for row in body:
        if len(row) < 5:
            continue
        b = row[0].strip()
        if b in EXCLUDE_BUILDINGS or b.startswith("building_subsistence_"):
            continue
            
        pm_name = row[2].strip()
        group_name = row[1].strip()
        
        target_type = "upgrade"
        if group_is_labor_saving.get(group_name, False):
            target_type = "labor_saving"
        elif b in ("building_power_plant", "building_railway", "building_fusion_power_plant", "building_geothermal_power_plant", "building_hydroelectric_power_plant", "building_renewable_energy_power_plant", "building_modern_state_baseline"):
            target_type = "upgrade"
        elif "explosives" in group_name:
            target_type = "upgrade"
        else:
            group_rows = groups.get(group_name, [])
            has_output_shift = False
            if len(group_rows) > 1:
                first_outputs = get_outputs(group_rows[0][1], header)
                for j in range(1, len(group_rows)):
                    current_outputs = get_outputs(group_rows[j][1], header)
                    if is_output_shift(first_outputs, current_outputs):
                        has_output_shift = True
                        break
                        
            if has_output_shift:
                target_type = "balance"
            else:
                target_type = "upgrade"
                
        row = list(row)
        row[3] = target_type
        out_body.append(row)

    with CSV_OUT.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(out_body)
    print(f"Wrote {CSV_OUT} ({len(out_body)} rows), synced goods to {GOODS_DST}")

if __name__ == "__main__":
    main()
