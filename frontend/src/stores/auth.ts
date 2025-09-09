import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { User, LoginRequest, RegisterRequest } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const loading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 方法
  const setAuth = (authData: { user: User; accessToken: string; refreshToken: string }) => {
    user.value = authData.user
    accessToken.value = authData.accessToken
    refreshToken.value = authData.refreshToken
  }

  const clearAuth = () => {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
  }

  const login = async (credentials: LoginRequest) => {
    loading.value = true
    try {
      const response = await authApi.login(credentials)
      if (response.data) {
        setAuth(response.data)
      }
      return response
    } finally {
      loading.value = false
    }
  }

  const register = async (userData: RegisterRequest) => {
    loading.value = true
    try {
      console.log('Auth Store: 开始注册请求', userData)
      const response = await authApi.register(userData)
      console.log('Auth Store: 注册响应', response)

      if (response.data) {
        setAuth(response.data)
        console.log('Auth Store: 认证信息已设置')
      }
      return response
    } catch (error) {
      console.error('Auth Store: 注册失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    try {
      if (accessToken.value) {
        await authApi.logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
      loading.value = false
    }
  }

  const refreshTokens = async () => {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await authApi.refreshToken(refreshToken.value)
      if (response.data) {
        setAuth(response.data)
      }
      return response
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  const fetchProfile = async () => {
    if (!accessToken.value) return

    try {
      const response = await authApi.getProfile()
      if (response.data?.user) {
        user.value = response.data.user
      }
    } catch (error) {
      console.error('Fetch profile error:', error)
      clearAuth()
    }
  }

  const updateProfile = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
    }
  }

  return {
    // 状态
    user,
    accessToken,
    refreshToken,
    loading,
    
    // 计算属性
    isAuthenticated,
    isAdmin,
    
    // 方法
    login,
    register,
    logout,
    refreshTokens,
    fetchProfile,
    updateProfile,
    setAuth,
    clearAuth
  }
}, {
  persist: {
    key: 'auth',
    storage: localStorage,
    paths: ['user', 'accessToken', 'refreshToken']
  }
})
