import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import type { LoginRequest, RegisterRequest } from '@/types'

// Mock API
vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    refreshToken: vi.fn(),
    logout: vi.fn(),
  }
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default state', () => {
    const authStore = useAuthStore()
    
    expect(authStore.user).toBeNull()
    expect(authStore.token).toBeNull()
    expect(authStore.refreshToken).toBeNull()
    expect(authStore.loading).toBe(false)
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.isAdmin).toBe(false)
  })

  it('should set user and tokens on successful login', async () => {
    const authStore = useAuthStore()
    const { authApi } = await import('@/api/auth')
    
    const mockResponse = {
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user'
        },
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token'
      }
    }
    
    vi.mocked(authApi.login).mockResolvedValue(mockResponse)
    
    const loginData: LoginRequest = {
      email: 'test@example.com',
      password: 'password'
    }
    
    await authStore.login(loginData)
    
    expect(authStore.user).toEqual(mockResponse.data.user)
    expect(authStore.token).toBe('mock_access_token')
    expect(authStore.refreshToken).toBe('mock_refresh_token')
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.loading).toBe(false)
  })

  it('should set user and tokens on successful registration', async () => {
    const authStore = useAuthStore()
    const { authApi } = await import('@/api/auth')
    
    const mockResponse = {
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user'
        },
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token'
      }
    }
    
    vi.mocked(authApi.register).mockResolvedValue(mockResponse)
    
    const registerData: RegisterRequest = {
      email: 'test@example.com',
      password: 'password',
      firstName: 'Test',
      lastName: 'User'
    }
    
    await authStore.register(registerData)
    
    expect(authStore.user).toEqual(mockResponse.data.user)
    expect(authStore.token).toBe('mock_access_token')
    expect(authStore.refreshToken).toBe('mock_refresh_token')
    expect(authStore.isAuthenticated).toBe(true)
  })

  it('should clear state on logout', async () => {
    const authStore = useAuthStore()
    const { authApi } = await import('@/api/auth')
    
    // Set initial state
    authStore.user = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    } as any
    authStore.token = 'mock_token'
    authStore.refreshToken = 'mock_refresh_token'
    
    vi.mocked(authApi.logout).mockResolvedValue({ data: { message: 'Logged out' } })
    
    await authStore.logout()
    
    expect(authStore.user).toBeNull()
    expect(authStore.token).toBeNull()
    expect(authStore.refreshToken).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
  })

  it('should identify admin users correctly', () => {
    const authStore = useAuthStore()
    
    authStore.user = {
      id: '1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    } as any
    
    expect(authStore.isAdmin).toBe(true)
  })

  it('should handle login errors', async () => {
    const authStore = useAuthStore()
    const { authApi } = await import('@/api/auth')
    
    const mockError = new Error('Invalid credentials')
    vi.mocked(authApi.login).mockRejectedValue(mockError)
    
    const loginData: LoginRequest = {
      email: 'test@example.com',
      password: 'wrongpassword'
    }
    
    await expect(authStore.login(loginData)).rejects.toThrow('Invalid credentials')
    expect(authStore.loading).toBe(false)
    expect(authStore.isAuthenticated).toBe(false)
  })
})
