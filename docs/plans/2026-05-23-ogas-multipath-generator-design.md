# OGAS Multi-Path Script Generator Design

## Overview
The goal is to modify the Victoria 3 OGAS `pm_goods` CSV generator so it can process files from both the vanilla game directory and the Tech & Res mod directory. This ensures the output CSV includes all buildings and production methods required by the user's mod setup.

## Architecture & Data Flow
- We will update the `Victoria3DataAnalyzer` class to accept a `source_paths` list instead of a single `base_path`.
- The paths provided will be:
  1. Vanilla Victoria 3 `common` directory.
  2. Tech & Res Mod `common` directory.
- **File Resolution**: The script will read directories in the order provided. If a mod contains a file with the same name as a vanilla file (e.g., `00_industry.txt`), the mod's file will overwrite the vanilla file in memory. New files are appended normally.

## Component Structure
- **Folder Isolation**: We will duplicate the `Victoria3 building PM` tool folder into a new folder named `Victoria3 building PM (Multi-Path)`. This protects the original generator and allows for clean A/B comparison.
- **Path Helper**: A new function `get_merged_file_paths(subfolder)` will loop through the `source_paths`, creating a dictionary of `filename -> full_filepath`.
- **Extraction Updates**: The data extraction functions (`extract_goods_names`, `extract_buildings_hierarchy`, `_load_production_method_groups`) will use the path helper to ensure they are reading the merged dataset.
- **Output**: The output file `victoria3_building_pm_goods.csv` will be generated in the new folder.

## Error Handling & Testing
- **Error Handling**: Missing paths or invalid directories will trigger a clear warning log but will not crash the entire process. The script will skip the bad path and continue parsing valid ones. File-level read errors (e.g., encoding issues common with Paradox scripts) will be caught per-file.
- **Testing & Analysis**:
  1. We will run the unmodified script to establish a baseline CSV.
  2. We will run the new multi-path script to generate the merged CSV.
  3. We will write an analysis script to diff the two CSVs, identifying missing buildings, changed values, and extra items.
  4. We will systematically analyze these differences to determine why they exist and confirm which values are correct ("true") for the user's intended mod state.