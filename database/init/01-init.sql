-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS quizonly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE quizonly;

-- 设置时区
SET time_zone = '+08:00';

-- 创建默认管理员用户（密码：admin123）
-- 注意：这只是示例，生产环境中应该使用更安全的密码
INSERT IGNORE INTO users (id, email, password, firstName, lastName, role, status, createdAt, updatedAt) 
VALUES (
  'admin-uuid-1234-5678-9012',
  'admin@quizonly.com',
  '$2b$12$LQv3c1yqBwEHxPr5glPeXeH6GVQdl4MWMG8rVJ8rVJ8rVJ8rVJ8rV',
  'Admin',
  'User',
  'admin',
  'active',
  NOW(),
  NOW()
);

-- 创建默认套餐
INSERT IGNORE INTO plans (id, name, description, type, price, billingCycle, monthlyQuota, features, status, sortOrder, createdAt, updatedAt)
VALUES 
(
  'plan-free-uuid-1234',
  '免费版',
  '适合个人用户体验基础功能',
  'free',
  0.00,
  30,
  100,
  JSON_OBJECT(
    'maxFiles', 5,
    'maxFileSize', 10,
    'maxAnnotations', 50,
    'maxQuizzes', 10,
    'maxQuestions', 100,
    'aiAnnotations', true,
    'aiQuizGeneration', true,
    'customApiKeys', false,
    'prioritySupport', false,
    'exportFeatures', false,
    'advancedAnalytics', false
  ),
  'active',
  1,
  NOW(),
  NOW()
),
(
  'plan-basic-uuid-1234',
  '基础版',
  '适合小团队和个人专业用户',
  'basic',
  29.99,
  30,
  1000,
  JSON_OBJECT(
    'maxFiles', 50,
    'maxFileSize', 50,
    'maxAnnotations', 500,
    'maxQuizzes', 100,
    'maxQuestions', 1000,
    'aiAnnotations', true,
    'aiQuizGeneration', true,
    'customApiKeys', true,
    'prioritySupport', false,
    'exportFeatures', true,
    'advancedAnalytics', false
  ),
  'active',
  2,
  NOW(),
  NOW()
),
(
  'plan-premium-uuid-1234',
  '专业版',
  '适合中大型团队和企业用户',
  'premium',
  99.99,
  30,
  5000,
  JSON_OBJECT(
    'maxFiles', 500,
    'maxFileSize', 200,
    'maxAnnotations', 5000,
    'maxQuizzes', 1000,
    'maxQuestions', 10000,
    'aiAnnotations', true,
    'aiQuizGeneration', true,
    'customApiKeys', true,
    'prioritySupport', true,
    'exportFeatures', true,
    'advancedAnalytics', true
  ),
  'active',
  3,
  NOW(),
  NOW()
);

-- 创建默认LLM Provider
INSERT IGNORE INTO providers (id, name, description, type, config, status, priority, isDefault, createdAt, updatedAt)
VALUES 
(
  'provider-gemini-uuid-1234',
  'Google Gemini',
  'Google Gemini Pro API',
  'gemini',
  JSON_OBJECT(
    'model', 'gemini-pro',
    'maxTokens', 4096,
    'temperature', 0.7,
    'timeout', 30000,
    'rateLimit', JSON_OBJECT('requests', 60, 'window', 60),
    'pricing', JSON_OBJECT('inputTokens', 0.0005, 'outputTokens', 0.0015)
  ),
  'active',
  1,
  true,
  NOW(),
  NOW()
);

-- 为管理员用户分配免费套餐
INSERT IGNORE INTO user_plans (id, userId, planId, startAt, endAt, remainingQuota, usedQuota, status, autoRenew, createdAt, updatedAt)
VALUES (
  'user-plan-admin-uuid-1234',
  'admin-uuid-1234-5678-9012',
  'plan-premium-uuid-1234',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 1 YEAR),
  5000,
  0,
  'active',
  false,
  NOW(),
  NOW()
);
