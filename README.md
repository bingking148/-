# EasyDS - 基于费曼学习法的考研数据结构教学系统


## 简介

EasyDS是一款创新型AI教育系统，专为考研数据结构学习设计。系统采用费曼学习法，通过多智能体协同教学模式，实现深度交互式学习体验。

## 系统架构

本项目采用**前后端分离架构**：

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   React     │◄────►│   Django    │◄────►│  PostgreSQL │
│  Frontend   │      │    API      │      │   Database  │
│  (Port 3000)│      │  (Port 8000)│      │  (Port 5432)│
└─────────────┘      └─────────────┘      └─────────────┘
```

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + React Router 6 | 用户界面、SPA单页应用 |
| 后端 | Django + DRF | RESTful API、SSE流式响应 |
| AI | LangGraph + DeepSeek | 多智能体协同教学 |

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 16+
- PostgreSQL（或SQLite用于开发）

### 1. 克隆项目并安装依赖

```bash
git clone https://github.com/yourusername/EasyDS.git
cd EasyDS

# 安装后端依赖
pip install -r requirements.txt

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 2. 配置环境变量

编辑 `.env` 文件：
```bash
# DeepSeek API 配置
DEEPSEEK_API_KEY=your-deepseek-api-key
```

### 3. 启动后端服务

```bash
# Windows
run_django.bat

# Linux/Mac
bash run_django.sh
```

后端将运行在 **http://localhost:8000**

### 4. 启动前端服务

新开一个终端窗口：
```bash
cd frontend
npm start
```

前端将运行在 **http://localhost:3000**

### 5. 访问应用

打开浏览器访问：**http://localhost:3000**

## 项目结构

```
EasyDS/
├── frontend/               # React前端项目
│   ├── src/
│   │   ├── components/    # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   │   ├── Home.js         # 首页
│   │   │   ├── Problems.js     # 题目列表
│   │   │   ├── Knowledge.js    # 知识库
│   │   │   └── Chat.js         # AI聊天
│   │   ├── services/
│   │   │   └── api.js     # API服务层
│   │   └── styles.css     # 全局样式
│   └── package.json
├── easys_django/          # Django后端项目
│   ├── apps/
│   │   ├── api/          # API应用
│   │   └── core/         # 核心服务
│   └── manage.py
├── src/                  # 智能体系统（共用）
│   ├── agents/           # 智能体实现
│   └── knowledge_qa_system.py
└── data/                 # 数据文件
```

## 技术特点

- **前后端分离**：React 前端 + Django REST API
- **实时通信**：Server-Sent Events (SSE) 实现流式AI回复
- **多智能体**：路由Agent、学生Agent、教师Agent协同
- **RAG增强**：基于知识库的精准知识点讲解
- **跨域支持**：CORS配置完善，支持独立部署

## API接口

基础URL: `http://localhost:8000/api`

| 接口 | 方法 | 说明 |
|------|------|------|
| `/chapters` | GET | 获取所有章节 |
| `/chapters/{id}/questions` | GET | 获取章节问题列表 |
| `/questions/{id}` | GET | 获取问题详情 |
| `/sessions` | POST | 创建会话 |
| `/sessions/{id}/messages` | GET | 发送消息（SSE流式） |
| `/knowledge/chapters` | GET | 获取知识点分布 |

更多接口详见 [README_Separated.md](README_Separated.md)

## 使用指南

1. **题目讲解**：选择章节题目，尝试自己讲解解题思路
2. **智能评估**：AI实时评估回答的正确性和完整性
3. **互动反馈**：
   - 回答正确但不完整 → 学生Agent追问
   - 回答不正确 → 教师Agent纠错指导
   - 回答正确且完整 → 教师Agent总结强化

## 生产部署

### 前端构建
```bash
cd frontend
npm run build
```

### 后端部署
```bash
cd easys_django
gunicorn easys_django.wsgi:application -b 0.0.0.0:8000
```

详细部署说明见 [README_Separated.md](README_Separated.md)

## 许可证

MIT License

## 联系方式

- 项目维护者：OphiraShen
- 电子邮件：ophira.shenyige@outlook.com
