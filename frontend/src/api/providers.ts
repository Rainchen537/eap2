import api from './index'

export interface ProviderConfig {
  apiKey: string
  baseUrl?: string
  model: string
  maxTokens?: number
  temperature?: number
  timeout?: number
}

export interface Provider {
  id: string
  name: string
  description?: string
  type: 'gemini' | 'openai' | 'azure' | 'claude' | 'local' | 'mock'
  config: ProviderConfig
  status: 'active' | 'inactive' | 'maintenance'
  priority: number
  isDefault: boolean
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CreateProviderDto {
  name: string
  description?: string
  type: 'gemini' | 'openai' | 'azure' | 'claude' | 'local' | 'mock'
  config: ProviderConfig
  priority?: number
  isDefault?: boolean
  metadata?: Record<string, any>
}

export interface UpdateProviderDto extends Partial<CreateProviderDto> {}

export interface TestProviderDto {
  providerId?: string
  testMessage?: string
}

export interface GetModelsDto {
  providerId?: string
}

export interface ProvidersResponse {
  providers: Provider[]
  total: number
}

export interface TestResult {
  success: boolean
  message: string
  response?: string
  error?: string
}

export const providersApi = {
  // 获取Provider列表
  async getProviders(page = 1, limit = 10): Promise<{ data: ProvidersResponse }> {
    const response = await api.get(`/providers?page=${page}&limit=${limit}`)
    return response.data
  },

  // 获取Provider详情
  async getProvider(id: string): Promise<{ data: { provider: Provider } }> {
    const response = await api.get(`/providers/${id}`)
    return response.data
  },

  // 创建Provider
  async createProvider(data: CreateProviderDto): Promise<{ data: { provider: Provider } }> {
    const response = await api.post('/providers', data)
    return response.data
  },

  // 更新Provider
  async updateProvider(id: string, data: UpdateProviderDto): Promise<{ data: { provider: Provider } }> {
    const response = await api.patch(`/providers/${id}`, data)
    return response.data
  },

  // 删除Provider
  async deleteProvider(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/providers/${id}`)
    return response.data
  },

  // 测试Provider连接
  async testProvider(data: TestProviderDto): Promise<{ data: TestResult }> {
    const response = await api.post('/providers/test', data)
    return response.data
  },

  // 获取可用模型
  async getModels(data: GetModelsDto): Promise<{ data: { models: string[] } }> {
    const response = await api.post('/providers/models', data)
    return response.data
  },

  // 设置默认Provider
  async setDefault(id: string): Promise<{ data: { provider: Provider } }> {
    const response = await api.patch(`/providers/${id}/default`)
    return response.data
  },

  // 切换Provider状态
  async toggleStatus(id: string): Promise<{ data: { provider: Provider } }> {
    const response = await api.patch(`/providers/${id}/status`)
    return response.data
  }
}
