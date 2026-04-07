# EasyDS 后端 API 文档

本文档基于当前工作区代码整理，主要对应以下实现：

- `easys_django/apps/api/urls.py`
- `easys_django/apps/api/views.py`
- `easys_django/apps/core/services.py`
- `src/knowledge_qa_runtime.py`
- `src/runtime_settings.py`

当前索引数据规模（来自 `data/ds_data/ds_indices.pkl`）：

- 章节数：8
- 题目数：510
- 知识点数：97

## 1. 基础信息

- 服务默认地址：`http://<host>:8000`
- API 前缀：`/api`
- 鉴权方式：当前未启用登录鉴权，默认允许匿名访问
- 主要响应格式：`application/json`
- 流式对话格式：`text/event-stream`
- 路径风格：当前接口以“无尾斜杠”定义，请优先使用文档中的原始路径

常见 ID 形态：

- `chapter_id`：章节 ID，例如 `01`
- `question_id`：题目 ID，例如 `q011002`
- `knowledge_id`：知识点 ID，例如 `kc0111`
- `session_id`：会话 ID，UUID 字符串

## 2. 通用约定

### 2.1 成功响应

除流式接口外，大多数接口返回 JSON 对象或 JSON 数组，HTTP 状态码默认为 `200 OK`。

### 2.2 统一错误响应

普通 REST 接口大多返回以下结构：

```json
{
  "detail": "错误描述"
}
```

常见状态码：

- `400 Bad Request`：请求参数缺失或格式错误
- `404 Not Found`：资源不存在
- `500 Internal Server Error`：服务端内部异常

### 2.3 流式接口约定

`GET /api/sessions/{session_id}/messages` 使用 SSE（Server-Sent Events）返回数据。

- 单条消息事件格式：`data: {"content":"...","node":"..."}`
- 结束事件：`event: end`
- 成功结束时，`end` 事件通常不携带正文
- 异常结束时，`end` 事件会携带 `{"error":"..."}` 结构

说明：

- `node` 常见值为 `student_agent`、`teacher_agent`
- 在工作流模式下，理论上也可能出现其他节点名；客户端最好按“未知节点 = 系统消息”兜底处理
- 前端当前会额外传 `_t` 作为时间戳防缓存参数，后端不会使用该参数

## 3. 接口总览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/` | API 根入口，返回服务信息 |
| GET | `/api/chapters` | 获取章节列表 |
| GET | `/api/chapters/{chapter_id}/questions` | 获取某章节题目列表 |
| GET | `/api/questions/{question_id}` | 获取题目详情 |
| GET | `/api/questions/{question_id}/knowledge-points` | 获取题目关联知识点 |
| GET | `/api/questions/{question_id}/similar` | 获取相似题目 |
| POST | `/api/sessions` | 创建会话 |
| GET | `/api/sessions/{session_id}/messages` | 发送讲解内容并接收 SSE 流式反馈 |
| GET | `/api/sessions/{session_id}/info` | 获取会话信息 |
| DELETE | `/api/sessions/{session_id}` | 删除会话 |
| GET | `/api/knowledge/chapters` | 获取章节与知识点映射 |
| GET | `/api/knowledge/{knowledge_id}` | 获取知识点摘要 |
| GET | `/api/knowledge/{knowledge_id}/title` | 获取知识点标题 |
| GET | `/api/knowledge/details/all` | 获取全部知识点 ID 与标题 |
| GET | `/api/settings/model` | 获取模型配置状态 |
| PUT | `/api/settings/model` | 保存 DeepSeek API Key |
| DELETE | `/api/settings/model` | 清除自定义 DeepSeek API Key |

## 4. 接口详情

### 4.1 获取 API 根入口

- 方法：`GET`
- 路径：`/`
- 说明：返回服务名、版本号和主要接口索引

响应示例：

```json
{
  "message": "EasyDS API Server",
  "version": "1.0.0",
  "apis": {
    "chapters": "/api/chapters",
    "questions": "/api/chapters/<id>/questions",
    "knowledge": "/api/knowledge/chapters",
    "sessions": "/api/sessions"
  }
}
```

### 4.2 获取章节列表

- 方法：`GET`
- 路径：`/api/chapters`
- 说明：按章节 ID 升序返回章节列表

响应示例：

```json
[
  {
    "id": "01",
    "title": "绪论"
  },
  {
    "id": "02",
    "title": "线性表"
  }
]
```

### 4.3 获取某章节题目列表

- 方法：`GET`
- 路径：`/api/chapters/{chapter_id}/questions`
- 路径参数：
  - `chapter_id`：章节 ID，例如 `01`
- 说明：返回该章节下的题目摘要列表

响应示例：

```json
[
  {
    "id": "q011002",
    "title": "非线性数据结构",
    "type": "concept",
    "difficulty": "integer"
  },
  {
    "id": "q011003",
    "title": "逻辑结构选项",
    "type": "concept",
    "difficulty": "integer"
  }
]
```

补充说明：

- 若章节不存在，当前实现通常返回空数组 `[]`，不会主动抛出 404
- `type`、`difficulty` 直接来自索引数据源，当前未做枚举约束或中文转换

### 4.4 获取题目详情

- 方法：`GET`
- 路径：`/api/questions/{question_id}`
- 路径参数：
  - `question_id`：题目 ID，例如 `q011002`
- 说明：返回题目的完整结构

响应示例：

```json
{
  "id": "q011002",
  "title": "非线性数据结构",
  "content": "下列四种数据结构中，（）是非线性数据结构。\nA.树\nB.字符串\nC.队列\nD.栈",
  "difficulty": "integer",
  "type": "concept",
  "knowledge_points": [
    "kc0111",
    "kc0112"
  ],
  "related_questions": [
    {
      "id": "string",
      "relation_type": "string"
    }
  ],
  "reference_answer": {
    "content": "A",
    "key_points": [
      "string"
    ],
    "explanation": "树和图是典型的非线性数据结构，其他选项都属于线性数据结构。"
  },
  "chapter": "01"
}
```

错误示例：

```json
{
  "detail": "问题未找到: q999999"
}
```

### 4.5 获取题目关联知识点

- 方法：`GET`
- 路径：`/api/questions/{question_id}/knowledge-points`
- 路径参数：
  - `question_id`：题目 ID
- 说明：返回该题关联的知识点标题与摘要

响应示例：

```json
[
  {
    "id": "kc0111",
    "title": "基本概念和术语",
    "summry": "**数据**\n**定义**：信息的载体，可被计算机程序处理的符号集合（数、字符等），是程序加工的原料。"
  },
  {
    "id": "kc0112",
    "title": "数据结构三要素",
    "summry": "..."
  }
]
```

补充说明：

- 返回字段名当前为 `summry`，这是后端实际输出字段，请按原字段名对接
- 如果题目不存在，或题目没有 `knowledge_points` 字段，当前实现返回空数组 `[]`

### 4.6 获取相似题目

- 方法：`GET`
- 路径：`/api/questions/{question_id}/similar`
- 路径参数：
  - `question_id`：题目 ID
- 说明：基于当前题目的知识点，最多返回 5 道相似题

响应示例：

```json
[
  {
    "id": "q011003",
    "title": "逻辑结构选项",
    "type": "concept"
  },
  {
    "id": "q011004",
    "title": "数据结构的基本概念",
    "type": "concept"
  },
  {
    "id": "q011005",
    "title": "数据存储中的元素关系",
    "type": "concept"
  }
]
```

补充说明：

- 若题目不存在，当前实现返回空数组 `[]`
- 返回结果去重，并排除当前题目自身

### 4.7 创建会话

- 方法：`POST`
- 路径：`/api/sessions`
- 请求头：
  - `Content-Type: application/json`
- 请求体：

```json
{
  "question_id": "q011002"
}
```

成功响应：

```json
{
  "session_id": "8fcb3947-4b03-4db9-bcfa-81f704fd4e3a"
}
```

错误响应：

```json
{
  "detail": "question_id是必需的"
}
```

```json
{
  "detail": "找不到问题 q999999"
}
```

说明：

- 当前成功状态码为 `200 OK`
- 会话只记录题目上下文，不要求用户先上传完整答案

### 4.8 流式发送消息

- 方法：`GET`
- 路径：`/api/sessions/{session_id}/messages`
- Content-Type：`text/event-stream; charset=utf-8`
- 路径参数：
  - `session_id`：会话 ID
- 查询参数：
  - `content`：用户本次输入的讲解/答案文本，必填
  - `_t`：可选，前端常用时间戳防缓存参数，后端忽略

请求示例：

```bash
curl -N "http://127.0.0.1:8000/api/sessions/8fcb3947-4b03-4db9-bcfa-81f704fd4e3a/messages?content=%E6%88%91%E8%A7%89%E5%BE%97%E7%AD%94%E6%A1%88%E6%98%AFA"
```

流式响应示例：

```text
data: {"content":"你的方向基本是对的。","node":"student_agent"}

data: {"content":"现在继续说明你的判断依据。","node":"student_agent"}

data: {"content":"参考结论：这道题的正确答案是 A。","node":"teacher_agent"}

event: end
data:
```

异常结束示例：

```text
data: {"content":"找不到会话 8fcb3947-4b03-4db9-bcfa-81f704fd4e3a","node":"system"}

event: end
data: {"error":"找不到会话 8fcb3947-4b03-4db9-bcfa-81f704fd4e3a"}
```

客户端处理建议：

- 普通消息监听 `onmessage`
- 结束事件监听 `end`
- `student_agent` 可视为追问/启发式反馈
- `teacher_agent` 可视为纠偏/总结性反馈
- 其它节点名建议按系统提示渲染

### 4.9 获取会话信息

- 方法：`GET`
- 路径：`/api/sessions/{session_id}/info`
- 路径参数：
  - `session_id`：会话 ID

响应示例：

```json
{
  "session_id": "8fcb3947-4b03-4db9-bcfa-81f704fd4e3a",
  "question_id": "q011002",
  "status": "created",
  "last_evaluation": {}
}
```

错误示例：

```json
{
  "detail": "找不到会话 8fcb3947-4b03-4db9-bcfa-81f704fd4e3a"
}
```

### 4.10 删除会话

- 方法：`DELETE`
- 路径：`/api/sessions/{session_id}`
- 路径参数：
  - `session_id`：会话 ID

成功响应：

```json
{
  "message": "会话已删除"
}
```

错误响应：

```json
{
  "detail": "会话未找到: 8fcb3947-4b03-4db9-bcfa-81f704fd4e3a"
}
```

### 4.11 获取章节与知识点映射

- 方法：`GET`
- 路径：`/api/knowledge/chapters`
- 说明：返回每个章节下对应的知识点 ID 列表

响应示例：

```json
{
  "01": [
    "kc0111",
    "kc0112",
    "kc0121",
    "kc0122"
  ],
  "02": [
    "kc0211",
    "kc0212"
  ]
}
```

### 4.12 获取知识点摘要

- 方法：`GET`
- 路径：`/api/knowledge/{knowledge_id}`
- 路径参数：
  - `knowledge_id`：知识点 ID，例如 `kc0111`
- 说明：返回知识点摘要文本

注意：

- 该接口底层返回的是“字符串响应”，不是对象
- 实际 HTTP 响应体会以 JSON 字符串形式输出，客户端解析后得到纯文本/Markdown 字符串

响应示例：

```json
"**数据**\n**定义**：信息的载体，可被计算机程序处理的符号集合（数、字符等），是程序加工的原料。"
```

错误示例：

```json
{
  "detail": "知识点未找到: kc9999"
}
```

### 4.13 获取知识点标题

- 方法：`GET`
- 路径：`/api/knowledge/{knowledge_id}/title`
- 路径参数：
  - `knowledge_id`：知识点 ID

响应示例：

```json
{
  "id": "kc0111",
  "title": "基本概念和术语"
}
```

错误示例：

```json
{
  "detail": "知识点标题未找到: kc9999"
}
```

### 4.14 获取全部知识点 ID 与标题

- 方法：`GET`
- 路径：`/api/knowledge/details/all`
- 说明：聚合全部章节下的知识点，按知识点 ID 去重后返回

响应示例：

```json
{
  "kc0111": {
    "id": "kc0111",
    "title": "基本概念和术语"
  },
  "kc0112": {
    "id": "kc0112",
    "title": "数据结构三要素"
  },
  "kc0121": {
    "id": "kc0121",
    "title": "算法的基本概念"
  }
}
```

### 4.15 获取模型配置状态

- 方法：`GET`
- 路径：`/api/settings/model`
- 说明：返回 DeepSeek API Key 的当前配置状态

响应示例：

```json
{
  "provider": "deepseek",
  "configured": true,
  "source": "custom",
  "masked_key": "sk-1********abcd"
}
```

字段说明：

- `provider`：当前模型提供方，固定为 `deepseek`
- `configured`：是否已配置可用密钥
- `source`：密钥来源，可能为 `custom`、`env`、`none`
- `masked_key`：脱敏后的密钥；未配置时为 `null`

### 4.16 保存模型配置

- 方法：`PUT`
- 路径：`/api/settings/model`
- 请求头：
  - `Content-Type: application/json`
- 请求体：

```json
{
  "api_key": "your_deepseek_api_key"
}
```

成功响应：

```json
{
  "provider": "deepseek",
  "configured": true,
  "source": "custom",
  "masked_key": "your********_key",
  "message": "DeepSeek API Key saved"
}
```

错误响应：

```json
{
  "detail": "api_key is required"
}
```

### 4.17 清除模型配置

- 方法：`DELETE`
- 路径：`/api/settings/model`
- 说明：删除保存在 `config/runtime_settings.json` 中的自定义 DeepSeek API Key

成功响应：

```json
{
  "provider": "deepseek",
  "configured": false,
  "source": "none",
  "masked_key": null,
  "message": "Custom DeepSeek API Key cleared"
}
```

补充说明：

- 如果环境变量 `DEEPSEEK_API_KEY` 仍然存在，清除自定义配置后，`source` 可能变为 `env`

## 5. 推荐联调顺序

如果前端要完整跑通当前教学链路，推荐顺序如下：

1. 调用 `/api/chapters` 获取章节
2. 调用 `/api/chapters/{chapter_id}/questions` 获取题目列表
3. 调用 `/api/questions/{question_id}` 获取题目详情
4. 调用 `/api/sessions` 创建会话
5. 调用 `/api/sessions/{session_id}/messages` 发起 SSE 讲解流
6. 按需调用 `/api/questions/{question_id}/knowledge-points`、`/api/questions/{question_id}/similar`
7. 对话结束后调用 `/api/sessions/{session_id}` 删除会话

## 6. 对接注意事项

- 当前会话消息接口使用 `GET` 而不是 `POST`
- 当前所有 API 路径都不带尾斜杠
- `summry` 字段拼写保持与后端一致，不要擅自改成 `summary`
- `/api/knowledge/{knowledge_id}` 返回字符串，不是对象
- 模型配置接口会读写 `config/runtime_settings.json`
- 跨域是否放行取决于服务端 `CORS_ALLOWED_ORIGINS` 配置

