# EasyDS - 前后端分离架构

本项目已改造为前后端分离架构。

## 架构说明

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   React     │─────▶│   Django    │─────▶│  PostgreSQL │
│  Frontend   │◀─────│    API      │◀─────│   Database  │
│  (Port 3000)│      │  (Port 8000)│      │             │
└─────────────┘      └─────────────┘      └─────────────┘
```

| 层级 | 技术 | 端口 | 说明 |
|------|------|------|------|
| 前端 | React | 3000 | 用户界面、路由、状态管理 |
| 后端 | Django + DRF | 8000 | RESTful API、SSE流式响应 |
| 数据库 | PostgreSQL | 5432 | 数据持久化 |

## 目录结构

```
EasyDS/
├── frontend/               # React前端项目
│   ├── public/
│   ├── src/
│   │   ├── components/    # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   │   ├── Home.js
│   │   │   ├── Problems.js
│   │   │   ├── Knowledge.js
│   │   │   └── Chat.js
│   │   ├── services/      # API服务层
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── styles.css
│   └── package.json
├── easys_django/          # Django后端项目
│   ├── apps/
│   │   ├── api/          # API应用
│   │   └── core/         # 核心服务
│   ├── easys_django/     # 配置
│   └── manage.py
├── src/                  # 智能体系统（与后端共用）
├── data/                 # 数据文件
└── requirements.txt
```

## 快速启动

### 1. 安装前端依赖

```bash
cd frontend
npm install
```

### 2. 启动后端服务（端口8000）

```bash
# Windows
cd ..
run_django.bat

# Linux/Mac
bash run_django.sh
```

### 3. 启动前端服务（端口3000）

新开一个终端窗口：

```bash
cd frontend
npm start
```

### 4. 访问应用

打开浏览器访问：**http://localhost:3000**

## API接口

### 基础URL

```
http://localhost:8000/api
```

### 接口列表

| 接口 | 方法 | 说明 |
|------|------|------|
| `/chapters` | GET | 获取所有章节 |
| `/chapters/{id}/questions` | GET | 获取章节下的问题 |
| `/questions/{id}` | GET | 获取问题详情 |
| `/questions/{id}/knowledge-points` | GET | 获取问题相关知识点 |
| `/questions/{id}/similar` | GET | 获取相似问题 |
| `/knowledge/chapters` | GET | 获取所有章节的知识点 |
| `/knowledge/{id}` | GET | 获取知识点概要 |
| `/knowledge/{id}/title` | GET | 获取知识点标题 |
| `/knowledge/details/all` | GET | 获取所有知识点详情 |
| `/sessions` | POST | 创建会话 |
| `/sessions/{id}/messages` | GET | 发送消息（SSE流式） |
| `/sessions/{id}/info` | GET | 获取会话信息 |
| `/sessions/{id}` | DELETE | 删除会话 |

### CORS配置

后端已配置允许所有来源的跨域请求：
```python
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
```

## 开发说明

### 前端开发

前端使用 React 18 + React Router 6：

```bash
cd frontend
npm start        # 开发模式
npm run build    # 生产构建
```

### 后端开发

后端仅提供API服务，不再渲染HTML模板。

```bash
cd easys_django
python manage.py runserver 0.0.0.0:8000
```

### 代理配置

前端 `package.json` 中已配置代理：
```json
"proxy": "http://localhost:8000"
```

开发时前端请求 `/api/*` 会自动代理到后端。

## 生产部署

### 前端部署

```bash
cd frontend
npm run build
# 将 build/ 目录部署到 Nginx 或 CDN
```

### 后端部署

```bash
cd easys_django
# 使用 Gunicorn 或 uWSGI
gunicorn easys_django.wsgi:application -b 0.0.0.0:8000
```

### Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/build;
        try_files $uri /index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 注意事项

1. **端口占用**：确保 3000 和 8000 端口未被占用
2. **API地址**：生产环境需要修改 `frontend/src/services/api.js` 中的 `API_BASE_URL`
3. **环境变量**：后端依赖 `.env` 文件中的 API 密钥
