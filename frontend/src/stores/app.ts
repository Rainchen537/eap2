import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const loading = ref(false)
  const sidebarCollapsed = ref(false)
  const theme = ref<'light' | 'dark'>('light')
  const language = ref('zh-CN')

  // 方法
  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setSidebarCollapsed = (value: boolean) => {
    sidebarCollapsed.value = value
  }

  const setTheme = (value: 'light' | 'dark') => {
    theme.value = value
    // 这里可以添加主题切换逻辑
    document.documentElement.setAttribute('data-theme', value)
  }

  const setLanguage = (value: string) => {
    language.value = value
    // 这里可以添加语言切换逻辑
  }

  return {
    // 状态
    loading,
    sidebarCollapsed,
    theme,
    language,
    
    // 方法
    setLoading,
    toggleSidebar,
    setSidebarCollapsed,
    setTheme,
    setLanguage
  }
}, {
  persist: {
    key: 'app',
    storage: localStorage,
    paths: ['sidebarCollapsed', 'theme', 'language']
  }
})
