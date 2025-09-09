import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const authStore = useAuthStore()
    
    // 添加认证token
    if (authStore.accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${authStore.accessToken}`
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const authStore = useAuthStore()
    
    if (error.response?.status === 401) {
      // Token过期，尝试刷新
      if (authStore.refreshToken && !error.config._retry) {
        error.config._retry = true
        
        try {
          await authStore.refreshTokens()
          // 重新发送原请求
          return api(error.config)
        } catch (refreshError) {
          // 刷新失败，清除认证信息并跳转到登录页
          authStore.logout()
          router.push('/login')
          ElMessage.error('登录已过期，请重新登录')
        }
      } else {
        // 没有刷新token或刷新失败
        authStore.logout()
        router.push('/login')
        ElMessage.error('登录已过期，请重新登录')
      }
    } else if (error.response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else if (error.message) {
      ElMessage.error(error.message)
    }
    
    return Promise.reject(error)
  }
)

export default api
