# EAP2 API 文档

## 概述

EAP2 提供 RESTful API，支持文档上传、智能标注、AI出题等核心功能。所有API都需要认证，除了登录和注册接口。

**Base URL**: `http://localhost:3000/api`

**认证方式**: Bearer Token (JWT)

## 认证 API

### 用户注册
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "张",
  "lastName": "三"
}
```

**响应**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "张",
    "lastName": "三",
    "role": "user",
    "status": "active"
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

### 用户登录
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 刷新Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "refresh_token"
}
```

### 退出登录
```http
POST /auth/logout
Authorization: Bearer {access_token}
```

## 文件管理 API

### 上传文件
```http
POST /files/upload
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file: [文件内容]
```

**支持格式**: .docx, .md, .txt

**响应**:
```json
{
  "id": "file_uuid",
  "originalFilename": "document.docx",
  "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "size": 1024,
  "status": "processing",
  "uploadedAt": "2024-01-01T00:00:00Z"
}
```

### 获取文件列表
```http
GET /files?page=1&limit=10&status=completed
Authorization: Bearer {access_token}
```

### 获取文件详情
```http
GET /files/{fileId}
Authorization: Bearer {access_token}
```

**响应**:
```json
{
  "id": "file_uuid",
  "originalFilename": "document.docx",
  "canonicalText": "文档的统一文本表示...",
  "blocks": [
    {
      "type": "paragraph",
      "content": "段落内容",
      "startOffset": 0,
      "endOffset": 10
    }
  ],
  "status": "completed",
  "annotations": [...],
  "quizzes": [...]
}
```

### 删除文件
```http
DELETE /files/{fileId}
Authorization: Bearer {access_token}
```

## 标注管理 API

### 创建标注
```http
POST /annotations
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "fileId": "file_uuid",
  "type": "focus",
  "text": "需要标注的文本",
  "startOffset": 100,
  "endOffset": 120,
  "note": "标注说明"
}
```

### 获取文件标注
```http
GET /annotations?fileId={fileId}&type=focus
Authorization: Bearer {access_token}
```

### 更新标注
```http
PATCH /annotations/{annotationId}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "note": "更新的标注说明",
  "type": "exclude"
}
```

### 删除标注
```http
DELETE /annotations/{annotationId}
Authorization: Bearer {access_token}
```

### AI自动标注
```http
POST /annotations/ai-suggest
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "fileId": "file_uuid",
  "types": ["focus", "exclude"]
}
```

## 题目管理 API

### 生成题目
```http
POST /quizzes/generate
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "fileId": "file_uuid",
  "types": ["mcq", "fill", "short"],
  "count": 10,
  "difficulty": "medium"
}
```

### 获取题目列表
```http
GET /quizzes?fileId={fileId}&type=mcq&page=1&limit=10
Authorization: Bearer {access_token}
```

### 获取题目详情
```http
GET /quizzes/{quizId}
Authorization: Bearer {access_token}
```

### 提交答案
```http
POST /quizzes/{quizId}/submit
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "answers": [
    {
      "questionId": "question_uuid",
      "answer": "A"
    }
  ]
}
```

**响应**:
```json
{
  "score": 85,
  "totalQuestions": 10,
  "correctAnswers": 8,
  "results": [
    {
      "questionId": "question_uuid",
      "correct": true,
      "userAnswer": "A",
      "correctAnswer": "A",
      "explanation": "解释说明"
    }
  ],
  "feedback": "整体表现良好..."
}
```

## 套餐管理 API

### 获取套餐列表
```http
GET /plans
Authorization: Bearer {access_token}
```

### 获取用户套餐
```http
GET /plans/my-plan
Authorization: Bearer {access_token}
```

### 购买套餐
```http
POST /plans/{planId}/purchase
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "paymentMethod": "stripe",
  "billingCycle": 30
}
```

## 用户管理 API

### 获取用户信息
```http
GET /users/profile
Authorization: Bearer {access_token}
```

### 更新用户信息
```http
PATCH /users/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "firstName": "新名字",
  "lastName": "新姓氏"
}
```

### 获取使用统计
```http
GET /users/stats
Authorization: Bearer {access_token}
```

**响应**:
```json
{
  "totalFiles": 25,
  "totalAnnotations": 150,
  "totalQuizzes": 45,
  "totalAttempts": 120,
  "currentPlan": {
    "name": "基础版",
    "remainingQuota": 850,
    "usedQuota": 150
  }
}
```

## 管理员 API

### 获取所有用户
```http
GET /admin/users?page=1&limit=20&role=user
Authorization: Bearer {admin_token}
```

### 更新用户状态
```http
PATCH /admin/users/{userId}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "suspended"
}
```

### 创建套餐
```http
POST /admin/plans
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "企业版",
  "description": "适合大型企业",
  "type": "enterprise",
  "price": 299.99,
  "billingCycle": 30,
  "monthlyQuota": 10000,
  "features": {
    "maxFiles": 1000,
    "maxFileSize": 500,
    "customApiKeys": true,
    "prioritySupport": true
  }
}
```

## 错误响应

所有API错误都遵循统一格式：

```json
{
  "statusCode": 400,
  "message": "错误描述",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/files/upload"
}
```

### 常见错误码

- `400` - 请求参数错误
- `401` - 未认证或Token过期
- `403` - 权限不足
- `404` - 资源不存在
- `409` - 资源冲突（如邮箱已存在）
- `413` - 文件过大
- `422` - 数据验证失败
- `429` - 请求频率限制
- `500` - 服务器内部错误

## 限制说明

### 文件上传限制
- 最大文件大小: 根据用户套餐（免费版10MB，基础版50MB，专业版200MB）
- 支持格式: .docx, .md, .txt
- 并发上传: 最多3个文件

### API调用限制
- 普通用户: 100次/分钟
- 付费用户: 300次/分钟
- 管理员: 1000次/分钟

### 套餐配额
- 免费版: 100次AI调用/月
- 基础版: 1000次AI调用/月
- 专业版: 5000次AI调用/月
