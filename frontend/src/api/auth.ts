import api from './index'
import type { LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '@/types'

export const authApi = {
  // 用户注册
  register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    console.log('API: 发送注册请求', data)
    return api.post('/auth/register', data).then(res => {
      console.log('API: 注册响应', res)
      return res.data
    }).catch(error => {
      console.error('API: 注册请求失败', error)
      throw error
    })
  },

  // 用户登录
  login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return api.post('/auth/login', data).then(res => res.data)
  },

  // 刷新token
  refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    return api.post('/auth/refresh', { refreshToken }).then(res => res.data)
  },

  // 用户登出
  logout(): Promise<ApiResponse> {
    return api.post('/auth/logout').then(res => res.data)
  },

  // 获取用户信息
  getProfile(): Promise<ApiResponse<{ user: any }>> {
    return api.post('/auth/profile').then(res => res.data)
  }
}
