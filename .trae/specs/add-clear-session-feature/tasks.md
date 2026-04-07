# Tasks

- [x] Task 1: 在 api.ts 中添加 deleteSession 方法
  - [x] 添加 deleteSession 方法，调用 DELETE /sessions/<session_id> 接口
  - [x] 确保方法返回 Promise<void>

- [x] Task 2: 在 PracticeChat 组件中添加清空会话功能
  - [x] 导入 Trash2 或 Eraser 图标用于清空按钮
  - [x] 添加确认对话框状态管理（showClearConfirm）
  - [x] 添加 handleClearSession 函数处理清空操作
  - [x] 在顶部操作栏添加"清空会话"按钮
  - [x] 实现确认对话框组件
  - [x] 删除成功后清空当前题目的聊天记录和会话 ID
  - [x] 处理删除失败情况，显示错误提示

# Task Dependencies
- Task 1 必须在 Task 2 之前完成
