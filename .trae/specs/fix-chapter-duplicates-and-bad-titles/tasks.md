# Tasks

- [x] Task 1: 修复 chapters.json 中重复的知识点 ID
  - [x] 去除第02章（id: "02"）中重复的 `kc0222`、`kc0233`
  - [x] 去除第07章（id: "07"）中重复的 `kc0732`
  - [x] 去除第08章（id: "08"）中重复的 `kc0821`、`kc0872`

- [x] Task 2: 修复 all_knowledgepoints.json 中 5 个知识点的错误 title
  - [x] kc0391: `,6.7。若期望驶出的次序依次为1~9，则n至少是（）。` → `栈和队列的综合应用`
  - [x] kc0634: `节的综合应用题03。` → `图的综合应用`
  - [x] kc086597: `，76.13,27.49，初始时49可以视为一个已排好序的子序列，` → `直接插入排序`
  - [x] kc0839: `.11.2,1.4.7.5.10.6` → `希尔排序的应用`
  - [x] kc0847: `直接调整成堆，则会误选选项C。` → `堆排序的综合应用`

- [x] Task 3: 修复 chapter_3.json、chapter_6.json、chapter_8.json 中对应知识点的错误 title
  - [x] chapter_3.json: 修正 kc0391
  - [x] chapter_6.json: 修正 kc0634
  - [x] chapter_8.json: 修正 kc086597、kc0839、kc0847

- [x] Task 4: 在前端 api.ts 的 getChapterKnowledgePointMap() 中添加去重逻辑

- [x] Task 5: 重新构建 ds_indices.pkl 索引文件

# Task Dependencies
- Task 2 和 Task 3 可并行执行
- Task 4 独立于 Task 1-3，可并行执行
- Task 5 依赖 Task 1、2、3 全部完成
