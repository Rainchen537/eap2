import api from './index'
import type { AnnotationEntity, ApiResponse } from '@/types'

export interface CreateAnnotationDto {
  fileId: string
  type: 'focus' | 'exclude'
  text: string
  startOffset: number
  endOffset: number
  source: 'manual' | 'ai'
}

export const annotationsApi = {
  // 获取文件的所有标注
  getAnnotations(fileId: string): Promise<AnnotationEntity[]> {
    return api.get(`/annotations/file/${fileId}`).then(res => res.data)
  },

  // 创建标注
  createAnnotation(data: CreateAnnotationDto): Promise<AnnotationEntity> {
    return api.post('/annotations', data).then(res => res.data)
  },

  // 删除标注
  deleteAnnotation(id: string): Promise<void> {
    return api.delete(`/annotations/${id}`).then(res => res.data)
  },

  // 批量创建标注
  createBatchAnnotations(annotations: CreateAnnotationDto[]): Promise<AnnotationEntity[]> {
    return api.post('/annotations/batch', { annotations }).then(res => res.data)
  },

  // 更新标注
  updateAnnotation(id: string, data: Partial<CreateAnnotationDto>): Promise<AnnotationEntity> {
    return api.patch(`/annotations/${id}`, data).then(res => res.data)
  }
}
