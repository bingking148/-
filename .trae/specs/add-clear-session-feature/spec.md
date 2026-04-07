# 添加清空单个会话功能 Spec

## Why
用户需要能够清空当前题目的会话历史，以便重新开始对话。当前后端已提供删除会话的 API 接口 (`DELETE /api/sessions/<session_id>`)，但前端没有提供相应的交互功能。

## What Changes
- 在 `api.ts` 中添加 `deleteSession` 方法，调用后端删除会话接口
- 在 `PracticeChat` 组件中添加"清空会话"按钮
- 点击按钮后弹出确认对话框，确认后删除当前会话并清空聊天记录
- 删除成功后，界面显示空会话状态（同新建会话）

## Impact
- Affected code:
  - `frontend/src/services/api.ts` — 添加 deleteSession 方法
  - `frontend/src/pages/PracticeChat.tsx` — 添加清空会话按钮和处理逻辑

## ADDED Requirements

### Requirement: 清空会话按钮
系统 SHALL 在练习对话页面的合适位置（如顶部操作栏）提供"清空会话"按钮，允许用户删除当前题目的会话历史。

#### Scenario: 显示清空会话按钮
- **WHEN** 用户进入某个题目的对话页面
- **THEN** 在页面顶部或聊天区域显示"清空会话"按钮
- **AND** 当没有活跃会话时，按钮处于禁用状态或隐藏

### Requirement: 确认对话框
系统 SHALL 在点击"清空会话"按钮后显示确认对话框，防止用户误操作。

#### Scenario: 点击清空会话按钮
- **WHEN** 用户点击"清空会话"按钮
- **THEN** 弹出确认对话框，提示"确定要清空当前会话吗？此操作不可恢复。"
- **AND** 提供"取消"和"确认"两个选项

### Requirement: 删除会话并清空界面
系统 SHALL 在用户确认后调用后端 API 删除会话，并清空前端显示的聊天记录。

#### Scenario: 确认清空会话
- **WHEN** 用户确认清空会话
- **THEN** 调用 `DELETE /api/sessions/<session_id>` 接口
- **AND** 前端清空当前题目的聊天记录和会话 ID
- **AND** 界面显示空会话状态（显示"费曼学习区"提示）

#### Scenario: 删除失败处理
- **WHEN** 删除会话 API 调用失败
- **THEN** 显示错误提示信息
- **AND** 不清空前端聊天记录

## MODIFIED Requirements

### Requirement: API 服务层
添加 `deleteSession` 方法到 APIService：

```typescript
deleteSession: async (sessionId: string): Promise<void> => {
  await api.delete(`/sessions/${encodeURIComponent(sessionId)}`);
}
```

### Requirement: PracticeChat 组件状态管理
添加清空会话的处理逻辑：
- 添加 `handleClearSession` 函数处理清空操作
- 添加确认对话框状态管理
- 清空后重置 `chatByQuestion` 中当前题目的状态
