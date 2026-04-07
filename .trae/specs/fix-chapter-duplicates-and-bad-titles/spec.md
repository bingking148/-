# 修复章节知识点重复勾选与错误标题 Spec

## Why
前端知识点列表中存在两个问题：
1. 某些章节的知识点列表中出现重复的知识点 ID，导致勾选某个知识点时"同步勾住两个一样的章节"
2. 部分知识点的 `title` 字段是 OCR 错误提取的题目文本片段（如"若期望驶出的次序依次为1~9，则n至少是（）。"），不是合法的知识点标题

## What Changes
- 修复 `chapters.json` 中所有章节的 `knowledge_points` 数组，去除重复的知识点 ID
- 修复 `all_knowledgepoints.json` 和各 `chapter_*.json` 中 5 个知识点的错误 `title` 字段
- 在前端 API 层 (`api.ts`) 的 `getChapterKnowledgePointMap()` 中增加去重逻辑作为防护
- 重新构建 `ds_indices.pkl` 索引文件

## Impact
- Affected code:
  - `data/ds_data/chapters.json` — 去除重复知识点 ID
  - `data/ds_data/knowledgepoints/all_knowledgepoints.json` — 修正 5 个错误 title
  - `data/ds_data/knowledgepoints/chapter_3.json` — 修正 kc0391 title
  - `data/ds_data/knowledgepoints/chapter_6.json` — 修正 kc0634 title
  - `data/ds_data/knowledgepoints/chapter_8.json` — 修正 kc086597、kc0839、kc0847 title
  - `frontend/src/services/api.ts` — API 层去重防护
  - `data/ds_data/ds_indices.pkl` — 重新构建索引

## ADDED Requirements

### Requirement: 知识点列表去重
系统 SHALL 在获取章节知识点映射时，确保每个章节的知识点 ID 列表中不存在重复项。

#### Scenario: chapters.json 数据中存在重复 ID
- **WHEN** `chapters.json` 中某章节的 `knowledge_points` 数组包含重复 ID（如 `kc0222` 出现两次）
- **THEN** 前端展示的知识点列表中每个知识点只出现一次

#### Scenario: API 返回重复 ID 时的防护
- **WHEN** 后端 API 返回的知识点列表包含重复 ID
- **THEN** 前端 API 层自动去重，确保组件收到的 `knowledgeMap` 中无重复

### Requirement: 知识点标题合法性
系统 SHALL 确保所有知识点的 `title` 字段为合法的知识点名称，不应包含题目文本、数字序列或 OCR 错误片段。

#### Scenario: 含错误 title 的知识点
- **WHEN** 某知识点 title 为 OCR 错误文本（如 `",6.7。若期望驶出的次序依次为1~9，则n至少是（）。"`）
- **THEN** 该 title 应被修正为对应的知识点名称

## MODIFIED Requirements

### Requirement: chapters.json 知识点 ID 列表
以下章节的 `knowledge_points` 数组需去除重复项：
- 第02章（id: "02"）：去除重复的 `kc0222`、`kc0233`
- 第07章（id: "07"）：去除重复的 `kc0732`
- 第08章（id: "08"）：去除重复的 `kc0821`、`kc0872`

### Requirement: 知识点 title 修正
以下知识点的 title 需修正：

| ID | 当前错误 title | 修正为 |
|---|---|---|
| `kc0391` | `,6.7。若期望驶出的次序依次为1~9，则n至少是（）。` | `栈和队列的综合应用` |
| `kc0634` | `节的综合应用题03。` | `图的综合应用` |
| `kc086597` | `，76.13,27.49，初始时49可以视为一个已排好序的子序列，` | `直接插入排序` |
| `kc0839` | `.11.2,1.4.7.5.10.6` | `希尔排序的应用` |
| `kc0847` | `直接调整成堆，则会误选选项C。` | `堆排序的综合应用` |
