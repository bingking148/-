# 教师和学生智能体区分显示 Spec

## Why
当前前端会话中，教师智能体和学生智能体的消息在 UI 上没有明显区别，都使用相同的头像、样式和标识。用户无法直观区分哪个消息来自教师智能体（负责纠正错误概念、提供知识点总结），哪个来自学生智能体（负责追问、引导深入思考）。这降低了用户对不同智能体角色的认知，影响了学习体验。

## What Changes
- 修改前端消息类型定义，支持 `agentRole` 或 `node` 字段来区分教师/学生智能体
- 更新 `ChatMessageList` 组件，根据 `node` 字段显示不同的头像、名称和样式
- 教师智能体：使用教育/指导相关的图标（如 GraduationCap），显示"教师"标签，使用紫色/蓝色主题色
- 学生智能体：使用学习/思考相关的图标（如 Lightbulb 或 BookOpen），显示"学生"标签，使用绿色/青色主题色
- 保持现有用户消息的显示样式不变

## Impact
- Affected code:
  - `frontend/src/services/api.ts` — 更新 SessionMessage 类型，添加 agentRole/node 字段
  - `frontend/src/components/practice/ChatMessageList.tsx` — 根据 node 字段渲染不同的智能体样式
  - `frontend/src/pages/PracticeChat.tsx` — 确保 node 字段在消息处理中传递

## ADDED Requirements

### Requirement: 教师智能体消息显示
系统 SHALL 在聊天界面中，将来自教师智能体（teacher_agent）的消息以独特的视觉样式展示，与用户消息和学生智能体消息明显区分。

#### Scenario: 教师智能体回复消息
- **WHEN** 后端返回的消息 node 字段为 'teacher_agent'
- **THEN** 消息气泡显示教师智能体头像（如 GraduationCap 图标）
- **AND** 显示"教师"或"Teacher"标签
- **AND** 使用紫色/蓝色主题色区分

### Requirement: 学生智能体消息显示
系统 SHALL 在聊天界面中，将来自学生智能体（student_agent）的消息以独特的视觉样式展示，与教师智能体消息明显区分。

#### Scenario: 学生智能体回复消息
- **WHEN** 后端返回的消息 node 字段为 'student_agent'
- **THEN** 消息气泡显示学生智能体头像（如 Lightbulb 或 BookOpen 图标）
- **AND** 显示"学生"或"Student"标签
- **AND** 使用绿色/青色主题色区分

### Requirement: 保持向后兼容
系统 SHALL 对没有 node 字段或 node 字段为其他值的消息，保持现有的通用智能体样式显示。

#### Scenario: 未知类型智能体消息
- **WHEN** 消息的 node 字段为空或不是 teacher_agent/student_agent
- **THEN** 使用现有的通用 Cpu 图标和默认样式显示

## MODIFIED Requirements

### Requirement: 消息类型定义
更新前端消息类型以包含 node 字段：

```typescript
interface SessionMessage {
  role: 'user' | 'agent';
  content: string;
  node?: string;  // 'teacher_agent' | 'student_agent' | 'router_agent' | etc.
}
```

### Requirement: 消息列表渲染逻辑
ChatMessageList 组件 SHALL 根据消息的 node 字段决定渲染样式：
- `node === 'teacher_agent'` → 教师智能体样式
- `node === 'student_agent'` → 学生智能体样式
- 其他或未定义 → 现有默认智能体样式
