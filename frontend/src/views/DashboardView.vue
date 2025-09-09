<template>
  <div class="dashboard">
    <div class="dashboard-content">
        <!-- 欢迎区域 -->
        <div class="welcome-section">
          <h1>欢迎回来，{{ authStore.user?.firstName || '用户' }}！</h1>
          <p>开始您的文档精炼与出题之旅</p>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="32"><Document /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ stats.totalFiles }}</h3>
              <p>文档总数</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="32"><Edit /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ stats.totalAnnotations }}</h3>
              <p>标注总数</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="32"><List /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ stats.totalQuizzes }}</h3>
              <p>题目总数</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon size="32"><Trophy /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ stats.totalAttempts }}</h3>
              <p>答题次数</p>
            </div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="quick-actions">
          <h2>快速操作</h2>
          <div class="actions-grid">
            <el-card class="action-card" @click="$router.push('/files')">
              <div class="action-content">
                <el-icon size="48"><Upload /></el-icon>
                <h3>上传文档</h3>
                <p>上传新的文档开始标注</p>
              </div>
            </el-card>
            
            <el-card class="action-card" @click="$router.push('/files')">
              <div class="action-content">
                <el-icon size="48"><Document /></el-icon>
                <h3>管理文档</h3>
                <p>查看和管理已上传的文档</p>
              </div>
            </el-card>
            
            <el-card class="action-card" @click="$router.push('/quizzes')">
              <div class="action-content">
                <el-icon size="48"><List /></el-icon>
                <h3>题目库</h3>
                <p>查看和管理生成的题目</p>
              </div>
            </el-card>
            
            <el-card class="action-card" @click="$router.push('/plans')">
              <div class="action-content">
                <el-icon size="48"><Star /></el-icon>
                <h3>套餐管理</h3>
                <p>查看当前套餐和使用情况</p>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 最近活动 -->
        <div class="recent-activity">
          <h2>最近活动</h2>
          <el-card>
            <el-empty v-if="!recentFiles.length" description="暂无最近活动" />
            <div v-else class="activity-list">
              <div
                v-for="file in recentFiles"
                :key="file.id"
                class="activity-item"
                @click="$router.push(`/files/${file.id}`)"
              >
                <div class="activity-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="activity-content">
                  <h4>{{ fixChineseFilename(file.originalFilename) }}</h4>
                  <p>{{ formatDate(file.updatedAt) }}</p>
                </div>
                <div class="activity-status">
                  <el-tag :type="getStatusType(file.status)">
                    {{ getStatusText(file.status) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Document, Edit, List, Trophy, Upload, Star } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useFilesStore } from '@/stores/files'
import { usersApi } from '@/api/users'
import { fixChineseFilename } from '@/utils/encoding'

import type { FileEntity } from '@/types'

const authStore = useAuthStore()
const filesStore = useFilesStore()

const stats = ref({
  totalFiles: 0,
  totalAnnotations: 0,
  totalQuizzes: 0,
  totalAttempts: 0
})

const recentFiles = ref<FileEntity[]>([])

onMounted(async () => {
  await loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    // 加载统计数据
    const statsResponse = await usersApi.getStats()
    if (statsResponse.data) {
      stats.value = statsResponse.data
    }

    // 加载最近文件
    await filesStore.fetchFiles(1, 5)
    recentFiles.value = filesStore.files
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'processing':
      return 'warning'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'uploading':
      return '上传中'
    case 'processing':
      return '处理中'
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    default:
      return '未知'
  }
}
</script>

<style scoped>
.dashboard-content {
  padding: 20px;
}

.welcome-section {
  margin-bottom: 30px;
}

.welcome-section h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 10px;
}

.welcome-section p {
  color: #666;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  color: #409eff;
}

.stat-content h3 {
  font-size: 1.8rem;
  color: #333;
  margin: 0 0 5px 0;
}

.stat-content p {
  color: #666;
  margin: 0;
}

.quick-actions,
.recent-activity {
  margin-bottom: 40px;
}

.quick-actions h2,
.recent-activity h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 20px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.action-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
}

.action-content {
  text-align: center;
  padding: 20px;
}

.action-content .el-icon {
  color: #409eff;
  margin-bottom: 15px;
}

.action-content h3 {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 10px;
}

.action-content p {
  color: #666;
  font-size: 0.9rem;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.activity-item:hover {
  background-color: #f8f9fa;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  color: #409eff;
  margin-right: 15px;
}

.activity-content {
  flex: 1;
}

.activity-content h4 {
  font-size: 1rem;
  color: #333;
  margin: 0 0 5px 0;
}

.activity-content p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.activity-status {
  margin-left: 15px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
