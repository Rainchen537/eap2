import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { filesApi } from '@/api/files'
import type { FileEntity } from '@/types'

export const useFilesStore = defineStore('files', () => {
  // 状态
  const files = ref<FileEntity[]>([])
  const currentFile = ref<FileEntity | null>(null)
  const loading = ref(false)
  const uploading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)

  // 计算属性
  const totalPages = computed(() => Math.ceil(total.value / limit.value))
  const hasFiles = computed(() => files.value.length > 0)

  // 方法
  const fetchFiles = async (pageNum = 1, pageSize = 10) => {
    loading.value = true
    try {
      page.value = pageNum
      limit.value = pageSize
      
      const response = await filesApi.getFiles(pageNum, pageSize)
      if (response.data) {
        files.value = response.data.files
        total.value = response.data.total
      }
    } finally {
      loading.value = false
    }
  }

  const searchFiles = async (query: string, pageNum = 1, pageSize = 10) => {
    loading.value = true
    try {
      page.value = pageNum
      limit.value = pageSize
      
      const response = await filesApi.searchFiles(query, pageNum, pageSize)
      if (response.data) {
        files.value = response.data.files
        total.value = response.data.total
      }
    } finally {
      loading.value = false
    }
  }

  const fetchFile = async (id: string) => {
    loading.value = true
    try {
      const response = await filesApi.getFile(id)
      if (response.data) {
        currentFile.value = response.data
      }
    } finally {
      loading.value = false
    }
  }

  const uploadFile = async (file: File, description?: string) => {
    uploading.value = true
    try {
      const response = await filesApi.upload(file, description)
      if (response.data) {
        // 添加到文件列表开头
        files.value.unshift(response.data)
        total.value += 1
      }
      return response.data
    } finally {
      uploading.value = false
    }
  }

  const updateFile = async (id: string, data: Partial<FileEntity>) => {
    try {
      const response = await filesApi.updateFile(id, data)
      if (response.data) {
        // 更新列表中的文件
        const index = files.value.findIndex(f => f.id === id)
        if (index !== -1) {
          files.value[index] = response.data
        }
        
        // 更新当前文件
        if (currentFile.value?.id === id) {
          currentFile.value = response.data
        }
      }
      return response.data
    } catch (error) {
      throw error
    }
  }

  const deleteFile = async (id: string) => {
    try {
      await filesApi.deleteFile(id)
      
      // 从列表中移除
      const index = files.value.findIndex(f => f.id === id)
      if (index !== -1) {
        files.value.splice(index, 1)
        total.value -= 1
      }
      
      // 清除当前文件
      if (currentFile.value?.id === id) {
        currentFile.value = null
      }
    } catch (error) {
      throw error
    }
  }

  const getFileContent = async (id: string) => {
    try {
      const response = await filesApi.getFileContent(id)
      return response.data
    } catch (error) {
      throw error
    }
  }

  const getFileStatus = async (id: string) => {
    try {
      const response = await filesApi.getFileStatus(id)
      return response.data
    } catch (error) {
      throw error
    }
  }

  const clearFiles = () => {
    files.value = []
    currentFile.value = null
    total.value = 0
    page.value = 1
  }

  const setCurrentFile = (file: FileEntity | null) => {
    currentFile.value = file
  }

  return {
    // 状态
    files,
    currentFile,
    loading,
    uploading,
    total,
    page,
    limit,
    
    // 计算属性
    totalPages,
    hasFiles,
    
    // 方法
    fetchFiles,
    searchFiles,
    fetchFile,
    uploadFile,
    updateFile,
    deleteFile,
    getFileContent,
    getFileStatus,
    clearFiles,
    setCurrentFile
  }
})
