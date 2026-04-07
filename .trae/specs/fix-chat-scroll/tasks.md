# Tasks

- [x] Task 1: 修改 `glass-card` CSS 类，移除 `overflow-hidden`
  - [x] 在 `frontend/src/index.css` 中将 `glass-card` 的 `overflow-hidden` 移除
  - [x] 确保 `::before` 伪元素（渐变效果）仍然通过自身定位正常工作
- [x] Task 2: 为需要 `overflow-hidden` 的现有 `glass-card` 实例补充样式
  - [x] 搜索所有使用 `glass-card` 的组件
  - [x] 为确实需要隐藏溢出的卡片（如非滚动容器）单独添加 `overflow-hidden` class
- [x] Task 3: 验证聊天消息列表和题目面板滚动功能
  - [x] 确认 `ChatMessageList` 可以独立滚动
  - [x] 确认左侧题目面板可以独立滚动
  - [x] 确认其他使用 `glass-card` 的页面视觉效果无回归

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1 and Task 2
