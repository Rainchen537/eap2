<template>
  <div class="quiz-detail-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="$router.back()" :icon="ArrowLeft">返回</el-button>
        <div class="quiz-info">
          <h1>{{ quiz?.title }}</h1>
          <p>{{ quiz?.description }}</p>
        </div>
      </div>
      <div class="header-right">
        <el-tag :type="getStatusType(quiz?.status)" size="large">
          {{ getStatusText(quiz?.status) }}
        </el-tag>
      </div>
    </div>

    <!-- 题目统计 -->
    <div class="quiz-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ quiz?.questionCount || 0 }}</div>
              <div class="stat-label">题目数量</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ quiz?.totalScore || 0 }}</div>
              <div class="stat-label">总分</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ formatDate(quiz?.createdAt) }}</div>
              <div class="stat-label">创建时间</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ quiz?.file?.originalFilename || '未知' }}</div>
              <div class="stat-label">源文档</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 题目列表 -->
    <el-card class="questions-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>题目列表</span>
          <el-button type="primary" @click="startQuiz" v-if="quiz?.status === 'completed'">
            开始答题
          </el-button>
        </div>
      </template>

      <div v-if="quiz?.status === 'generating'" class="generating-state">
        <el-result icon="info" title="正在生成题目" sub-title="AI正在基于您的标注内容生成题目，请稍候...">
          <template #extra>
            <el-button @click="loadQuiz">刷新状态</el-button>
          </template>
        </el-result>
      </div>

      <div v-else-if="quiz?.status === 'failed'" class="failed-state">
        <el-result icon="error" title="生成失败" sub-title="题目生成过程中出现错误，请重试">
          <template #extra>
            <el-button type="primary" @click="regenerateQuiz">重新生成</el-button>
          </template>
        </el-result>
      </div>

      <div v-else-if="quiz?.questions && quiz.questions.length > 0" class="questions-list">
        <div
          v-for="(question, index) in quiz.questions"
          :key="question.id"
          class="question-item"
        >
          <div class="question-header">
            <span class="question-number">第{{ index + 1 }}题</span>
            <el-tag :type="getDifficultyType(question.difficulty)" size="small">
              {{ getDifficultyText(question.difficulty) }}
            </el-tag>
            <span class="question-score">{{ question.score }}分</span>
          </div>

          <div class="question-content">
            <p class="question-text">{{ question.question }}</p>

            <div v-if="question.type === 'mcq' && question.options.length > 0" class="question-options">
              <div
                v-for="(option, optionIndex) in question.options"
                :key="optionIndex"
                class="option-item"
              >
                <span class="option-label">{{ String.fromCharCode(65 + optionIndex) }}.</span>
                <span class="option-text">{{ option }}</span>
              </div>
            </div>

            <div v-if="question.explanation" class="question-explanation">
              <el-divider content-position="left">解析</el-divider>
              <p>{{ question.explanation }}</p>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无题目" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { quizzesApi } from '@/api/quizzes'
import type { QuizEntity } from '@/types'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const quiz = ref<QuizEntity | null>(null)

// 获取题目ID
const quizId = computed(() => route.params.id as string)

// 加载题目详情
const loadQuiz = async () => {
  loading.value = true
  try {
    const response = await quizzesApi.getQuiz(quizId.value)
    quiz.value = response
  } catch (error) {
    console.error('加载题目失败:', error)
    ElMessage.error('加载题目失败')
  } finally {
    loading.value = false
  }
}

// 开始答题
const startQuiz = () => {
  router.push(`/quiz-attempts/start/${quizId.value}`)
}

// 重新生成题目
const regenerateQuiz = async () => {
  ElMessage.info('重新生成功能开发中...')
}

// 获取状态类型
const getStatusType = (status?: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'generating': return 'warning'
    case 'failed': return 'danger'
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status?: string) => {
  switch (status) {
    case 'completed': return '已完成'
    case 'generating': return '生成中'
    case 'failed': return '生成失败'
    default: return '未知'
  }
}

// 获取难度类型
const getDifficultyType = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'success'
    case 'medium': return 'warning'
    case 'hard': return 'danger'
    default: return 'info'
  }
}

// 获取难度文本
const getDifficultyText = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return '简单'
    case 'medium': return '中等'
    case 'hard': return '困难'
    default: return '未知'
  }
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '未知'
  return new Date(dateStr).toLocaleDateString()
}

// 生命周期
onMounted(() => {
  loadQuiz()

  // 如果是生成中状态，定时刷新
  const timer = setInterval(() => {
    if (quiz.value?.status === 'generating') {
      loadQuiz()
    } else {
      clearInterval(timer)
    }
  }, 3000)
})
</script>

<style scoped>
.quiz-detail-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.quiz-info h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.quiz-info p {
  margin: 4px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.quiz-stats {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 20px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.questions-card {
  min-height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.generating-state,
.failed-state {
  padding: 40px;
}

.questions-list {
  max-height: 600px;
  overflow-y: auto;
}

.question-item {
  margin-bottom: 24px;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.question-number {
  font-weight: bold;
  color: #303133;
}

.question-score {
  margin-left: auto;
  color: #409eff;
  font-weight: bold;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  color: #303133;
  margin-bottom: 16px;
}

.question-options {
  margin-bottom: 16px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
}

.option-label {
  font-weight: bold;
  color: #409eff;
  margin-right: 8px;
  min-width: 20px;
}

.option-text {
  flex: 1;
  line-height: 1.4;
}

.question-explanation {
  margin-top: 16px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.question-explanation p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}
</style>
