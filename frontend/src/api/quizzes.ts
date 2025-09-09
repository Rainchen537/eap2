import api from './index'
import type { QuizEntity, QuestionEntity, QuizAttemptEntity, ApiResponse } from '@/types'

export interface GenerateQuizDto {
  fileId: string
  questionCount: number
  questionType: 'mcq' | 'fill_blank' | 'short_answer'
  difficulty?: 'easy' | 'medium' | 'hard'
  title?: string
  description?: string
}

export interface SubmitAnswerDto {
  questionId: string
  answer: string
  timeSpent?: number
}

export interface StartQuizDto {
  quizId: string
}

export const quizzesApi = {
  // 生成题目
  generateQuiz(data: GenerateQuizDto): Promise<QuizEntity> {
    return api.post('/quizzes/generate', data).then(res => res.data)
  },

  // 获取题目列表
  getQuizzes(fileId?: string): Promise<QuizEntity[]> {
    const params = fileId ? { fileId } : {}
    return api.get('/quizzes', { params }).then(res => res.data)
  },

  // 获取题目详情
  getQuiz(id: string): Promise<QuizEntity> {
    return api.get(`/quizzes/${id}`).then(res => res.data)
  },

  // 开始答题
  startQuiz(data: StartQuizDto): Promise<QuizAttemptEntity> {
    return api.post('/quiz-attempts/start', data).then(res => res.data.data || res.data)
  },

  // 提交答案
  submitAnswer(attemptId: string, data: SubmitAnswerDto): Promise<QuizAttemptEntity> {
    return api.post(`/quiz-attempts/${attemptId}/answer`, data).then(res => res.data.data || res.data)
  },

  // 完成答题
  finishQuiz(attemptId: string, data?: { timeSpent?: number }): Promise<QuizAttemptEntity> {
    return api.post(`/quiz-attempts/${attemptId}/finish`, data || {}).then(res => res.data.data || res.data)
  },

  // 获取答题记录
  getAttempts(quizId?: string): Promise<QuizAttemptEntity[]> {
    const params = quizId ? { quizId } : {}
    return api.get('/quiz-attempts', { params }).then(res => res.data.data || res.data)
  },

  // 获取答题详情
  getAttempt(id: string): Promise<QuizAttemptEntity> {
    return api.get(`/quiz-attempts/${id}`).then(res => res.data.data || res.data)
  },

  // 删除题目
  deleteQuiz(id: string): Promise<void> {
    return api.delete(`/quizzes/${id}`).then(res => res.data)
  }
}
