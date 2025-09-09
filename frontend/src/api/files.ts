import api from './index'
import type { FileEntity, ApiResponse, PaginatedResponse, BlockEntity } from '@/types'

export interface FileListParams {
  page?: number
  limit?: number
  status?: string
  search?: string
}

export const filesApi = {
  // 上传文件
  upload(file: File, description?: string): Promise<ApiResponse<FileEntity>> {
    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }

    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(res => res.data)
  },

  // 获取文件列表
  getFiles(params: FileListParams = {}): Promise<{ files: FileEntity[]; total: number }> {
    const { page = 1, limit = 10, status, search } = params
    return api.get('/files', {
      params: { page, limit, status, search }
    }).then(res => res.data)
  },

  // 搜索文件
  searchFiles(query: string, page = 1, limit = 10): Promise<ApiResponse<{ files: FileEntity[]; total: number }>> {
    return api.get('/files/search', {
      params: { q: query, page, limit }
    }).then(res => res.data)
  },

  // 获取文件详情
  getFile(id: string): Promise<ApiResponse<FileEntity>> {
    return api.get(`/files/${id}`).then(res => res.data)
  },

  // 获取文件内容
  getFileContent(id: string): Promise<FileEntity & { blocks: BlockEntity[] }> {
    return api.get(`/files/${id}/content`).then(res => res.data)
  },

  // 获取文件处理状态
  getFileStatus(id: string): Promise<ApiResponse<{ status: string; error?: string }>> {
    return api.get(`/files/${id}/status`).then(res => res.data)
  },

  // 更新文件信息
  updateFile(id: string, data: Partial<FileEntity>): Promise<ApiResponse<FileEntity>> {
    return api.patch(`/files/${id}`, data).then(res => res.data)
  },

  // 删除文件
  deleteFile(id: string): Promise<ApiResponse> {
    return api.delete(`/files/${id}`).then(res => res.data)
  },

  // 获取文件统计
  getStats(): Promise<{
    totalFiles: number
    totalSize: number
    processingFiles: number
    completedFiles: number
    failedFiles: number
  }> {
    return api.get('/files/stats').then(res => res.data)
  }
}
