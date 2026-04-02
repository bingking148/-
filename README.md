# EasyDS - 数据结构智能教学系统

基于 **费曼学习法**（"以教促学"）的 AI 驱动数据结构智能教学系统，面向 CS2026 考研备考。

## 项目简介

EasyDS 是一个多智能体协作的教学系统，涵盖数据结构 8 大核心章节的知识点讲解、题目练习和智能问答。系统通过 **Router-Teacher-Student** 三智能体协作机制，对用户的答题进行评估、追问和纠正，帮助用户深入理解数据结构知识。

### 核心工作流

1. 用户浏览 **8 个章节**的数据结构知识点
2. 选择章节中的 **题目** 进行练习
3. 用自己的语言 **解释解题思路**（费曼学习法）
4. **多智能体 AI 系统**评估回答：
   - **Router Agent**：评估答案的正确性和完整性，决定路由
   - **Student Agent**：对正确但不完整的回答进行追问，加深理解
   - **Teacher Agent**：对错误回答进行纠正和知识点总结
5. 通过 **SSE (Server-Sent Events)** 实时流式输出响应

## 技术栈

### 后端

- **Python 3.10+**
- **Django 4.2** - Web 框架
- **Django REST Framework** - API 接口
- **LangGraph** - 多智能体工作流编排
- **LangChain** - LLM 应用框架（DeepSeek / Qwen2.5 / 通义千问）
- **Pydantic** - 数据模型校验
- **PostgreSQL** - 数据库

### 前端

- **React 18** (开发中)
- **Tailwind CSS** - UI 样式
- **Marked.js** - Markdown 渲染
- **Highlight.js** - 代码高亮
- **MathJax** - 数学公式渲染

### 数据处理

- **PyMuPDF / pdfplumber** - PDF 文本提取
- **PaddleOCR** - OCR 文字识别
- **PyTorch / Transformers / PEFT** - RLHF/SFT 模型微调

## 项目结构

```
django1/
├── config/                      # 配置文件
│   ├── db_config.yaml           # 数据库配置
│   └── paths.py                 # 路径常量
├── data/                        # 数据文件
│   ├── DS2026_extracted/         # 提取的 PDF 页面
│   └── ds_data/                  # 结构化数据
│       ├── chapters.json         # 章节定义
│       ├── ds_indices.pkl        # 预构建索引
│       ├── knowledgepoints/      # 知识点 JSON
│       ├── questions/            # 题目 JSON
│       └── data_processing/      # 数据处理脚本
├── easys_django/                 # Django 项目
│   ├── manage.py
│   ├── easys_django/             # 项目配置
│   │   ├── settings.py
│   │   ├── settings_base.py
│   │   ├── settings_dev.py
│   │   ├── settings_prod.py
│   │   └── urls.py
│   ├── apps/
│   │   ├── core/                 # 页面渲染应用
│   │   └── api/                  # REST API 应用
│   ├── templates/                # HTML 模板
│   └── static/                   # 静态资源 (CSS/JS)
├── frontend/                     # React 前端 (开发中)
├── src/                          # 核心业务逻辑
│   ├── knowledge_qa_system.py    # QA 系统主入口
│   ├── agents/                   # 多智能体系统
│   │   ├── agents/
│   │   │   ├── router.py         # 路由智能体
│   │   │   ├── teacher.py        # 教师智能体
│   │   │   └── student.py        # 学生智能体
│   │   ├── models.py             # LLM 模型工厂
│   │   ├── workflow.py           # LangGraph 工作流
│   │   └── prompts/              # 系统提示词
│   ├── database/
│   │   └── schema.py             # 数据模型定义
│   └── models/rlhf/sft/          # SFT 微调流水线
└── .env                          # 环境变量
```

## 章节内容

| 章节 | 内容 |
|------|------|
| 第 1 章 | 绪论 |
| 第 2 章 | 线性表 |
| 第 3 章 | 栈、队列和数组 |
| 第 4 章 | 串 |
| 第 5 章 | 树与二叉树 |
| 第 6 章 | 图 |
| 第 7 章 | 查找 |
| 第 8 章 | 排序 |

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 16+ (前端开发)
- PostgreSQL 14+

### 1. 克隆项目

```bash
git clone git@github.com:bingking148/-.git
cd django1
```

### 2. 安装 Python 依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

复制 `.env` 文件并填入你的配置：

```env
# LLM API Keys
DEEPSEEK_API_KEY=your_deepseek_api_key
TONGYI_API_KEY=your_tongyi_api_key

# Django
DJANGO_SECRET_KEY=your_secret_key
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL
POSTGRES_DB=easys_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
```

### 4. 初始化数据库

```bash
cd easys_django
python manage.py migrate
```

### 5. 启动开发服务器

```bash
python manage.py runserver
```

访问 http://127.0.0.1:8000 即可使用系统。

### 6. 启动前端开发服务器（可选）

```bash
cd frontend
npm install
npm start
```

前端开发服务器默认运行在 http://localhost:3000，自动代理 API 请求到 Django 后端。

## API 接口

所有 API 接口以 `/api/` 为前缀：

| 接口 | 说明 |
|------|------|
| `/api/chapters/` | 获取章节列表 |
| `/api/chapters/<id>/questions/` | 获取章节题目 |
| `/api/knowledge-points/` | 获取知识点 |
| `/api/chat/<session_id>/` | SSE 流式对话 |
| `/api/sessions/` | 会话管理 |

## 数据处理

### PDF 数据提取

```bash
cd data/ds_data/data_processing
python pdf_extractor.py    # 提取 PDF 文本
python index_builder.py    # 构建索引
```

### 知识点摘要生成

```bash
python parallel_data_creation.py  # 使用 DeepSeek 批量生成知识点摘要
```

## 许可证

本项目仅供学习交流使用。
