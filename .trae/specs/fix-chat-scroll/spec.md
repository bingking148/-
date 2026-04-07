# 修复聊天对话框独立滚动

## Why
聊天对话框（ChatMessageList）和左侧题目面板无法独立上下滚动。原因是 `glass-card` 工具类包含 `overflow-hidden`，导致子元素的 `overflow-y-auto` 被父容器的 `overflow-hidden` 覆盖，内容无法滚动。

## What Changes
- 修改 `glass-card` CSS 类：移除 `overflow-hidden`，改为 `overflow-visible`
- 给需要隐藏溢出的 `glass-card` 实例单独添加 `overflow-hidden`
- 确保 `ChatMessageList` 和左侧题目面板可以独立滚动

## Impact
- Affected code: `frontend/src/index.css`（glass-card 定义）、`frontend/src/pages/PracticeChat.tsx`、`frontend/src/components/practice/ChatMessageList.tsx`、以及所有使用 `glass-card` 的组件

## ADDED Requirements

### Requirement: 聊天消息列表独立滚动
`ChatMessageList` 组件必须能在内容超出容器高度时独立上下滚动，不受父容器 `overflow-hidden` 限制。

#### Scenario: 消息超出容器高度
- **WHEN** 聊天消息数量超出 `ChatMessageList` 容器的可视高度
- **THEN** `ChatMessageList` 内部出现滚动条，用户可以独立滚动查看历史消息

### Requirement: 左侧题目面板独立滚动
左侧题目面板的题目内容区域必须能在内容超出高度时独立滚动。

#### Scenario: 题目内容超出面板高度
- **WHEN** 题目内容文字超出左侧面板的可视高度
- **THEN** 题目内容区域出现滚动条，用户可以独立滚动查看完整题目

### Requirement: glass-card 不破坏子元素滚动
`glass-card` 工具类不能包含 `overflow-hidden`，以避免破坏子元素的滚动行为。

#### Scenario: glass-card 内有滚动子元素
- **WHEN** 一个 `glass-card` 容器内包含 `overflow-y-auto` 的子元素
- **THEN** 子元素的滚动功能正常工作，不被父容器裁剪
