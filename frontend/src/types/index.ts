// 用户相关类型
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  avatar?: string
  role: 'user' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  updatedAt: string
}

// 认证相关类型
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// 文件相关类型
export interface FileBlock {
  blockId: string
  type: 'paragraph' | 'heading' | 'list' | 'table'
  text: string
  startOffset: number
  endOffset: number
  page?: number
  meta?: Record<string, any>
}

export interface FileEntity {
  id: string
  originalFilename: string
  filename: string
  mimeType: string
  size: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  canonicalText?: string
  blocks?: FileBlock[]
  processingError?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 标注相关类型
export interface Annotation {
  id: string
  type: 'focus' | 'exclude'
  text: string
  startOffset: number
  endOffset: number
  source: 'manual' | 'ai_suggested'
  confidence?: number
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface AnnotationEntity extends Annotation {
  fileId: string
  userId: string
}

export interface BlockEntity {
  blockId: string
  type: 'heading' | 'paragraph' | 'list'
  text: string
  startOffset: number
  endOffset: number
}

// 题目相关类型
export interface QuizQuestion {
  id: string
  type: 'mcq' | 'fill' | 'short'
  stem: string
  options?: string[]
  answer: string
  explanation?: string
  points: number
  metadata?: Record<string, any>
}

export interface Quiz {
  id: string
  title: string
  description?: string
  questions: QuizQuestion[]
  status: 'draft' | 'published' | 'archived'
  totalPoints: number
  timeLimit: number
  settings?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface AttemptAnswer {
  questionId: string
  answer: string | string[]
  isCorrect?: boolean
  points?: number
  feedback?: string
}

export interface QuizAttempt {
  id: string
  answers: AttemptAnswer[]
  status: 'in_progress' | 'submitted' | 'graded'
  score?: number
  totalPoints?: number
  percentage?: number
  gradingMethod?: 'auto' | 'manual' | 'ai_assisted'
  startedAt?: string
  submittedAt?: string
  gradedAt?: string
  timeSpent?: number
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// 后端实体类型
export interface QuizEntity {
  id: string
  title: string
  description?: string
  fileId: string
  userId: string
  status: 'generating' | 'completed' | 'failed'
  questionCount: number
  totalScore: number
  questions?: QuestionEntity[]
  file?: FileEntity
  createdAt: string
  updatedAt: string
}

export interface QuestionEntity {
  id: string
  quizId: string
  type: 'mcq' | 'fill_blank' | 'short_answer'
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  score: number
  order: number
  createdAt: string
  updatedAt: string
}

export interface QuizAttemptEntity {
  id: string
  quizId: string
  userId: string
  status: 'in_progress' | 'completed' | 'abandoned'
  score?: number
  totalScore?: number
  percentage?: number
  startedAt: string
  completedAt?: string
  timeSpent?: number
  answers: any[]
  quiz?: QuizEntity
  createdAt: string
  updatedAt: string
}

// 套餐相关类型
export interface PlanFeatures {
  maxFiles: number
  maxFileSize: number
  maxAnnotations: number
  maxQuizzes: number
  maxQuestions: number
  aiAnnotations: boolean
  aiQuizGeneration: boolean
  customApiKeys: boolean
  prioritySupport: boolean
  exportFeatures: boolean
  advancedAnalytics: boolean
}

export interface Plan {
  id: string
  name: string
  description?: string
  type: 'free' | 'basic' | 'premium' | 'enterprise'
  price: number
  billingCycle: number
  monthlyQuota: number
  features: PlanFeatures
  status: 'active' | 'inactive' | 'deprecated'
  sortOrder: number
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface UserPlan {
  id: string
  startAt: string
  endAt: string
  remainingQuota: number
  usedQuota: number
  status: 'active' | 'expired' | 'cancelled' | 'suspended'
  autoRenew: boolean
  cancelledAt?: string
  cancellationReason?: string
  metadata?: Record<string, any>
  plan: Plan
  createdAt: string
  updatedAt: string
}

// API响应类型
export interface ApiResponse<T = any> {
  message: string
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 通用类型
export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface TableColumn {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  sortable?: boolean
  formatter?: (row: any, column: any, cellValue: any) => string
}
