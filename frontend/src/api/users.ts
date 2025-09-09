import api from './index'
import type { User, ApiResponse } from '@/types'

export const usersApi = {
  // 获取用户统计信息
  getStats(): Promise<ApiResponse<{
    totalFiles: number
    totalAnnotations: number
    totalQuizzes: number
    totalAttempts: number
  }>> {
    return api.get('/users/stats').then(res => res.data)
  },

  // 获取当前用户信息
  getProfile(): Promise<ApiResponse<{ user: User }>> {
    return api.get('/users/profile').then(res => res.data)
  },

  // 更新用户信息
  updateProfile(data: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return api.patch('/users/profile', data).then(res => res.data)
  }
}
