# EasyDS 前端项目

基于 React 18 的前端应用，用于 EasyDS 数据结构智能教学系统。

## 技术栈

- React 18
- React Router 6
- Marked.js (Markdown 渲染)

## 开发环境配置

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start
```

开发服务器运行在 http://localhost:3000

## 生产构建

```bash
npm run build
```

构建输出到 `build/` 目录。

## 项目结构

```
frontend/
├── public/           # 静态资源
├── src/
│   ├── components/   # 可复用组件
│   │   └── Navbar.js # 导航栏
│   ├── pages/        # 页面组件
│   │   ├── Home.js       # 首页
│   │   ├── Problems.js   # 题库页面
│   │   ├── Knowledge.js  # 知识库页面
│   │   └── Chat.js       # 聊天页面
│   ├── services/     # API 服务
│   │   └── api.js
│   ├── App.js        # 应用主组件
│   ├── index.js      # 入口文件
│   └── styles.css    # 全局样式
└── package.json
```

## API 代理配置

在 `package.json` 中已配置代理：

```json
"proxy": "http://localhost:8000"
```

开发时前端请求 `/api/*` 会自动代理到后端服务。

## 页面说明

### 首页 (Home)
- 系统介绍和特色展示
- 使用指南

### 题库页面 (Problems)
- 左侧章节列表
- 右侧题目列表
- 点击题目进入聊天页面

### 聊天页面 (Chat)
- 左侧：题目详情、相关知识点、相似题目
- 右侧：笔记本风格的对话界面
- 支持 Markdown 渲染

### 知识库页面 (Knowledge)
- 三栏布局：章节列表、知识点列表、知识点详情
- 支持 Markdown 渲染知识点内容
