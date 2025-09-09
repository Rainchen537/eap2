<template>
  <div class="file-list-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>文档管理</h1>
        <p>上传并管理您的文档，支持 Word (.docx)、Markdown (.md) 和文本 (.txt) 格式</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showUploadDialog = true" :icon="Upload">
          上传文档
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.totalFiles }}</div>
                <div class="stat-label">总文档数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon processing">
                <el-icon><Loading /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.processingFiles }}</div>
                <div class="stat-label">处理中</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon success">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.completedFiles }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon error">
                <el-icon><Close /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.failedFiles }}</div>
                <div class="stat-label">处理失败</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索文档名称或内容..."
            :prefix-icon="Search"
            @input="handleSearch"
            clearable
          />
        </el-col>
        <el-col :span="4">
          <el-select v-model="statusFilter" placeholder="状态筛选" @change="loadFiles">
            <el-option label="全部" value="" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="处理失败" value="failed" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="loadFiles" :icon="Refresh">刷新</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 文件列表 -->
    <el-card class="file-list-card">
      <el-table
        v-loading="loading"
        :data="files"
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column prop="originalFilename" label="文件名" min-width="200">
          <template #default="{ row }">
            <div class="file-name">
              <el-icon class="file-icon">
                <component :is="getFileIcon(row.mimeType)" />
              </el-icon>
              <span>{{ fixChineseFilename(row.originalFilename) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="size" label="大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="上传时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'completed'"
              type="primary"
              size="small"
              @click.stop="annotateFile(row)"
            >
              标注
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click.stop="deleteFile(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadFiles"
          @current-change="loadFiles"
        />
      </div>
    </el-card>

    <!-- 上传对话框 -->
    <FileUploadDialog
      v-model="showUploadDialog"
      @uploaded="handleFileUploaded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  Document,
  Loading,
  Check,
  Close,
  Search,
  Refresh,
  DocumentCopy,
  Tickets,
  Files
} from '@element-plus/icons-vue'
import { filesApi } from '@/api/files'
import FileUploadDialog from '@/components/FileUploadDialog.vue'
import { fixChineseFilename } from '@/utils/encoding'
import type { FileEntity } from '@/types'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const showUploadDialog = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const files = ref<FileEntity[]>([])

// 统计数据
const stats = reactive({
  totalFiles: 0,
  totalSize: 0,
  processingFiles: 0,
  completedFiles: 0,
  failedFiles: 0
})

// 搜索防抖
let searchTimeout: NodeJS.Timeout | null = null

// 计算属性
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    uploading: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    uploading: '上传中',
    processing: '处理中',
    completed: '已完成',
    failed: '处理失败'
  }
  return statusMap[status] || status
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
    return DocumentCopy
  } else if (mimeType.includes('markdown')) {
    return Tickets
  } else if (mimeType.includes('text/plain')) {
    return Files
  }
  return Document
}

// 方法
const loadFiles = async () => {
  loading.value = true
  try {
    const response = await filesApi.getFiles({
      page: currentPage.value,
      limit: pageSize.value,
      status: statusFilter.value,
      search: searchQuery.value
    })

    files.value = response.files
    total.value = response.total
  } catch (error) {
    console.error('加载文件列表失败:', error)
    ElMessage.error('加载文件列表失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const response = await filesApi.getStats()
    Object.assign(stats, response)
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadFiles()
  }, 500)
}

const handleRowClick = (row: FileEntity) => {
  if (row.status === 'completed') {
    annotateFile(row)
  }
}

const annotateFile = (file: FileEntity) => {
  router.push(`/files/${file.id}/annotate`)
}

const deleteFile = async (file: FileEntity) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${fixChineseFilename(file.originalFilename)}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await filesApi.deleteFile(file.id)
    ElMessage.success('文件删除成功')

    // 重新加载列表和统计
    loadFiles()
    loadStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除文件失败:', error)
      ElMessage.error('删除文件失败')
    }
  }
}

const handleFileUploaded = () => {
  showUploadDialog.value = false
  loadFiles()
  loadStats()
  ElMessage.success('文件上传成功，正在处理中...')
}

// 生命周期
onMounted(() => {
  loadFiles()
  loadStats()
})
</script>

<style scoped>
.file-list-view {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
}

.header-left p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #3b82f6;
  color: white;
  font-size: 20px;
}

.stat-icon.processing {
  background-color: #f59e0b;
}

.stat-icon.success {
  background-color: #10b981;
}

.stat-icon.error {
  background-color: #ef4444;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.search-card {
  margin-bottom: 24px;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.file-list-card {
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 16px;
  color: #6b7280;
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f8fafc;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #f8fafc;
  color: #374151;
  font-weight: 600;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}

@media (max-width: 768px) {
  .file-list-view {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .stats-cards .el-col {
    margin-bottom: 16px;
  }

  .search-card .el-row {
    flex-direction: column;
    gap: 16px;
  }

  .search-card .el-col {
    width: 100%;
  }
}
</style>
