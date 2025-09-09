<template>
  <div class="quiz-list-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>题目管理</h1>
        <p>管理您生成的题目集，查看题目详情和统计信息</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="$router.push('/files')" :icon="Plus">
          生成新题目
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
                <el-icon><Edit /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.totalQuizzes }}</div>
                <div class="stat-label">题目集总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.totalQuestions }}</div>
                <div class="stat-label">题目总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.completedQuizzes }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Loading /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.generatingQuizzes }}</div>
                <div class="stat-label">生成中</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 题目列表 -->
    <el-card class="quiz-table-card">
      <template #header>
        <div class="card-header">
          <span>题目集列表</span>
          <div class="header-actions">
            <el-input
              v-model="searchQuery"
              placeholder="搜索题目集..."
              :prefix-icon="Search"
              style="width: 300px"
              @input="handleSearch"
            />
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="quizzes"
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column prop="title" label="题目集名称" min-width="200">
          <template #default="{ row }">
            <div class="quiz-title">
              <el-icon class="quiz-icon">
                <Edit />
              </el-icon>
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="题目数量" width="100">
          <template #default="{ row }">
            <span>{{ getQuestionCount(row) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="totalScore" label="总分" width="80">
          <template #default="{ row }">
            <span>{{ row.totalScore || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="源文档" min-width="150">
          <template #default="{ row }">
            <span>{{ row.file?.originalFilename ? fixChineseFilename(row.file.originalFilename) : '未知' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            <span>{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click.stop="viewQuiz(row)"
            >
              查看详情
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click.stop="deleteQuiz(row)"
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
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Document, Check, Loading, Search } from '@element-plus/icons-vue'
import { quizzesApi } from '@/api/quizzes'
import { fixChineseFilename } from '@/utils/encoding'
import type { Quiz } from '@/types'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const quizzes = ref<Quiz[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 统计信息
const stats = computed(() => {
  const totalQuizzes = quizzes.value.length
  const totalQuestions = quizzes.value.reduce((sum, quiz) => sum + getQuestionCount(quiz), 0)
  const completedQuizzes = quizzes.value.filter(quiz => (quiz as any).status === 'completed').length
  const generatingQuizzes = quizzes.value.filter(quiz => (quiz as any).status === 'generating').length

  return {
    totalQuizzes,
    totalQuestions,
    completedQuizzes,
    generatingQuizzes
  }
})

// 加载题目列表
const loadQuizzes = async () => {
  loading.value = true
  try {
    const response = await quizzesApi.getQuizzes()
    quizzes.value = response as any
    total.value = response.length
  } catch (error) {
    console.error('加载题目列表失败:', error)
    ElMessage.error('加载题目列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  // TODO: 实现搜索功能
  console.log('搜索:', searchQuery.value)
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadQuizzes()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadQuizzes()
}

// 行点击处理
const handleRowClick = (row: Quiz) => {
  viewQuiz(row)
}

// 查看题目详情
const viewQuiz = (quiz: Quiz) => {
  router.push(`/quizzes/${quiz.id}`)
}

// 删除题目
const deleteQuiz = async (quiz: Quiz) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除题目集 "${quiz.title}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await quizzesApi.deleteQuiz(quiz.id)
    ElMessage.success('删除成功')
    loadQuizzes()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'generating': return 'warning'
    case 'failed': return 'danger'
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return '已完成'
    case 'generating': return '生成中'
    case 'failed': return '生成失败'
    case 'draft': return '草稿'
    default: return '未知'
  }
}

// 获取题目数量
const getQuestionCount = (quiz: Quiz) => {
  if (quiz.questions && Array.isArray(quiz.questions)) {
    return quiz.questions.length
  }
  if ((quiz as any).questionEntities && Array.isArray((quiz as any).questionEntities)) {
    return (quiz as any).questionEntities.length
  }
  return 0
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

// 生命周期
onMounted(() => {
  loadQuizzes()
})
</script>

<style scoped>
.quiz-list-view {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-left h1 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  font-size: 32px;
  color: #409eff;
  margin-right: 16px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.quiz-table-card {
  min-height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quiz-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quiz-icon {
  color: #409eff;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>
