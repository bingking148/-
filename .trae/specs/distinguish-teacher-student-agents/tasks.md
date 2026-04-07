# Tasks

- [x] Task 1: 更新前端消息类型定义
  - [x] 在 api.ts 中更新 SessionMessage 接口，添加 node 字段
  - [x] 在 api.ts 中更新 ChatMessage 类型，添加 node 字段
  - [x] 确保 API 响应处理时传递 node 字段

- [x] Task 2: 更新 ChatMessageList 组件显示逻辑
  - [x] 导入新的图标（GraduationCap、Lightbulb 或 BookOpen）
  - [x] 创建根据 node 字段返回不同样式的辅助函数
  - [x] 教师智能体样式：紫色/蓝色主题，GraduationCap 图标，显示"教师"标签
  - [x] 学生智能体样式：绿色/青色主题，Lightbulb 图标，显示"学生"标签
  - [x] 默认智能体样式：保持现有 Cpu 图标和样式
  - [x] 更新消息渲染逻辑，根据 msg.node 应用不同样式

- [x] Task 3: 更新 PracticeChat 组件确保 node 字段传递
  - [x] 在 hydrateSessionState 函数中保留 node 字段
  - [x] 在消息处理流程中确保 node 字段被正确传递和存储

# Task Dependencies
- Task 1 必须在 Task 2 之前完成
- Task 2 和 Task 3 可以并行执行
