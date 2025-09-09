<template>
  <el-dialog
    v-model="visible"
    title="上传文档"
    width="600px"
    :before-close="handleClose"
  >
    <div class="upload-dialog">
      <!-- 文件格式说明 -->
      <div class="format-info">
        <h4>支持的文件格式</h4>
        <div class="format-list">
          <div class="format-item">
            <el-icon><DocumentCopy /></el-icon>
            <div class="format-details">
              <div class="format-name">Word 文档</div>
              <div class="format-desc">支持 .docx 格式，自动提取文本内容</div>
            </div>
          </div>
          <div class="format-item">
            <el-icon><Tickets /></el-icon>
            <div class="format-details">
              <div class="format-name">Markdown 文档</div>
              <div class="format-desc">支持 .md 格式，保留结构化信息</div>
            </div>
          </div>
          <div class="format-item">
            <el-icon><Document /></el-icon>
            <div class="format-details">
              <div class="format-name">纯文本文档</div>
              <div class="format-desc">支持 .txt 格式，按段落自动分块</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 上传区域 -->
      <div class="upload-area">
        <el-upload
          ref="uploadRef"
          class="upload-dragger"
          drag
          :action="uploadUrl"
          :headers="uploadHeaders"
          :before-upload="beforeUpload"
          :on-success="handleSuccess"
          :on-error="handleError"
          :on-progress="handleProgress"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :file-list="fileList"
          :auto-upload="false"
          accept=".docx,.md,.txt"
          :limit="1"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传 .docx/.md/.txt 文件，且不超过 10MB
            </div>
          </template>
        </el-upload>
      </div>

      <!-- 上传进度 -->
      <div v-if="uploading" class="upload-progress">
        <el-progress
          :percentage="uploadProgress"
          :status="uploadStatus"
          :stroke-width="8"
        />
        <div class="progress-text">{{ progressText }}</div>
      </div>

      <!-- 上传规则说明 -->
      <div class="upload-rules">
        <h4>文档处理规则</h4>
        <ul>
          <li><strong>自动文本提取：</strong>系统会自动提取文档中的文本内容，生成统一的标准格式</li>
          <li><strong>智能分块：</strong>根据段落、标题等结构自动将文档分割成语义块</li>
          <li><strong>格式保留：</strong>Markdown 文档会保留标题、列表等结构信息</li>
          <li><strong>编码支持：</strong>自动识别文本编码，支持中文内容</li>
          <li><strong>处理时间：</strong>文档上传后会进行后台处理，通常在几秒内完成</li>
        </ul>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="submitUpload"
          :loading="uploading"
          :disabled="fileList.length === 0"
        >
          {{ uploading ? '上传中...' : '开始上传' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type UploadInstance, type UploadProps, type UploadRawFile } from 'element-plus'
import { DocumentCopy, Tickets, Document, UploadFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'uploaded'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const uploadRef = ref<UploadInstance>()

// 响应式数据
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref<'success' | 'exception' | ''>('')
const fileList = ref<any[]>([])

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const uploadUrl = computed(() => {
  return `${import.meta.env.VITE_API_BASE_URL}/files/upload`
})

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${authStore.accessToken}`
  }
})

const progressText = computed(() => {
  if (uploadProgress.value === 100) {
    return '处理中，请稍候...'
  }
  return `上传中 ${uploadProgress.value}%`
})

// 方法
const beforeUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
    'text/x-markdown',
    'text/plain'
  ]
  
  const allowedExtensions = ['.docx', '.md', '.txt']
  const fileExtension = rawFile.name.toLowerCase().substring(rawFile.name.lastIndexOf('.'))
  
  if (!allowedTypes.includes(rawFile.type) && !allowedExtensions.includes(fileExtension)) {
    ElMessage.error('只支持 .docx、.md、.txt 格式的文件')
    return false
  }
  
  if (rawFile.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  
  return true
}

const handleProgress: UploadProps['onProgress'] = (evt) => {
  uploadProgress.value = Math.round(evt.percent || 0)
}

const handleSuccess: UploadProps['onSuccess'] = (response) => {
  uploading.value = false
  uploadStatus.value = 'success'
  uploadProgress.value = 100

  setTimeout(() => {
    emit('uploaded')
    resetUpload()
  }, 1000)
}

const handleError: UploadProps['onError'] = (error) => {
  uploading.value = false
  uploadStatus.value = 'exception'
  console.error('上传失败:', error)
  ElMessage.error('文件上传失败，请重试')
}

const handleFileChange: UploadProps['onChange'] = (file, files) => {
  console.log('文件变化:', file, files)
  fileList.value = files
}

const handleFileRemove: UploadProps['onRemove'] = (file, files) => {
  console.log('文件移除:', file, files)
  fileList.value = files
}

const submitUpload = () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }
  
  uploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = ''
  uploadRef.value?.submit()
}

const handleClose = () => {
  if (uploading.value) {
    ElMessage.warning('文件正在上传中，请稍候...')
    return
  }
  
  resetUpload()
  visible.value = false
}

const resetUpload = () => {
  uploading.value = false
  uploadProgress.value = 0
  uploadStatus.value = ''
  fileList.value = []
  uploadRef.value?.clearFiles()
}

// 监听对话框关闭
watch(visible, (newVal) => {
  if (!newVal) {
    resetUpload()
  }
})
</script>

<style scoped>
.upload-dialog {
  padding: 0;
}

.format-info {
  margin-bottom: 24px;
}

.format-info h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.format-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.format-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #f8fafc;
  border-radius: 8px;
}

.format-item .el-icon {
  font-size: 20px;
  color: #6b7280;
}

.format-details {
  flex: 1;
}

.format-name {
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.format-desc {
  font-size: 14px;
  color: #6b7280;
}

.upload-area {
  margin-bottom: 24px;
}

.upload-progress {
  margin-bottom: 24px;
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
}

.upload-rules {
  margin-bottom: 0;
}

.upload-rules h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.upload-rules ul {
  margin: 0;
  padding-left: 20px;
}

.upload-rules li {
  margin-bottom: 8px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.upload-rules li strong {
  color: #374151;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-upload-dragger) {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background-color: #fafafa;
  transition: all 0.3s;
}

:deep(.el-upload-dragger:hover) {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}

:deep(.el-upload-dragger .el-icon--upload) {
  font-size: 48px;
  color: #6b7280;
  margin-bottom: 16px;
}

:deep(.el-upload__text) {
  color: #374151;
  font-size: 16px;
}

:deep(.el-upload__text em) {
  color: #3b82f6;
  font-style: normal;
}

:deep(.el-upload__tip) {
  color: #6b7280;
  font-size: 14px;
  margin-top: 8px;
}
</style>
