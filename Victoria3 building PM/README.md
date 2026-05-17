# Victoria3 建筑生产方式物资影响分析工具

## 项目简介

这是一个由B站UP主**苍王子**开发的Victoria 3实用工具，用于分析游戏中建筑的生产方式对物资的影响。该工具能够自动读取Victoria 3的游戏数据文件，将所有建筑的生产方式对物资的输入输出影响整合到一张表格中，方便玩家进行数据分析和游戏策略规划。

## 功能特点

- 📊 **自动化数据提取**：自动解析Victoria 3的生产方式文件
- 🔍 **物资影响分析**：精确提取每个生产方式的物资输入输出数据
- 📈 **Excel输出**：生成结构化的表格，便于数据分析和可视化
- 🏗️ **全面覆盖**：支持所有建筑类型和生产方式的解析
- 🛠️ **易于使用**：一键运行，无需复杂配置

## 文件结构

```
├── main.py                          # 主程序文件
├── merge_game_techres.py            # 从 vic3modder/game + techres-fork 合并生成 00_merged_*.txt
├── README.md                        # 项目说明文档（本文件）
├── Victoria3 building PM.xlsx       # 生成的Excel数据文件
├── buildings/00_merged_buildings.txt
├── goods/00_goods.txt               # 原版 + Tech & Res 商品；新物资也在此添加
├── production_methods/00_merged_production_methods.txt
└── production_method_groups/00_merged_production_method_groups.txt
```

## 使用方法

**推荐（本仓库已与 Tech & Res 对齐）：** 在本目录执行：

```bash
python3 merge_game_techres.py   # 更新 buildings / pm / pmg
python3 main.py                 # 生成 victoria3_building_pm_goods.csv
python3 filter_pm_goods_for_ogas.py   # 削减非生产建筑与无效 PM 行，写入 ../OGAS script generator/pm_goods.csv
```

`merge_game_techres.py` 读取 `../../game/common` 与 `../../techres-fork/common`，处理 `REPLACE` / `REPLACE_OR_CREATE` / `INJECT` 并写入上述 `00_merged_*.txt`（会清空各目录内其它 `.txt`，勿混放旧多文件）。

**手动方式：** 将游戏本体与 mod 的 `buildings`、`production_methods`、`production_method_groups` 放入对应文件夹，并维护 `goods/00_goods.txt`。


### 环境要求

- Python 3.7+
- 需要安装的Python包：
  - pandas
  - openpyxl

### 安装依赖

```bash
pip install pandas openpyxl
```

### 运行程序

```bash
python main.py
```

### 运行结果

程序运行后将生成 `victoria3_building_pm_goods.csv` 文件，包含以下信息：

## 数据解析原理

工具通过以下步骤解析数据：

1. **文件读取**：读取Victoria 3的生产方式文件
2. **正则匹配**：使用正则表达式提取PM块和workforce_scaled部分
3. **物资提取**：解析 `goods_input_XXX_add` 和 `goods_output_XXX_add` 字段
4. **数据整理**：将数据转换为DataFrame格式
5. **Excel输出**：生成结构化的Excel表格

## 输出示例

生成的Excel表格将包含类似以下结构的数据：

| PM名称 | input_iron | input_coal | output_steel | output_tools |
|--------|------------|------------|--------------|--------------|
| pm_steel_mill_basic | -20 | -10 | 15 | 5 |
| pm_steel_mill_advanced | -15 | -8 | 25 | 8 |

## 注意事项

1. **文件路径**：确保Victoria 3游戏文件路径正确配置
2. **编码问题**：文件使用UTF-8编码，确保系统支持
3. **数据更新**：游戏版本更新后可能需要更新解析逻辑
4. **错误处理**：程序包含错误处理机制，遇到问题会显示详细错误信息

## 技术支持

如有问题或建议，请联系B站UP主**苍王子**。
因为正则表达式筛选的原因，-将会打断单词导致无法识别，以下几个PM需要手动修正：
pm_ammonia-soda_process
pm_coal-fired_plant
pm_oil-fired_plant
## 更新日志

- **v1.0**：初始版本，支持基本的生产方式数据解析和输出

---

*本工具仅供学习和研究使用，Victoria 3是Paradox Interactive的注册商标。*
