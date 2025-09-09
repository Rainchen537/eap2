<template>
  <div class="quiz-result-view">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-card>
        <div class="loading-content">
          <el-icon class="is-loading" size="32"><Loading /></el-icon>
          <p>正在加载答题结果...</p>
        </div>
      </el-card>
    </div>

    <!-- 结果展示 -->
    <div v-else-if="attempt && quiz" class="result-container">
      <!-- 成绩概览 -->
      <el-card class="score-card">
        <div class="score-overview">
          <div class="score-circle">
            <el-progress
              type="circle"
              :percentage="attempt.percentage || 0"
              :width="120"
              :stroke-width="8"
              :color="getScoreColor(attempt.percentage || 0)"
            >
              <template #default="{ percentage }">
                <span class="score-text">{{ percentage }}%</span>
              </template>
            </el-progress>
          </div>
          <div class="score-details">
            <h2>答题完成！</h2>
            <div class="score-info">
              <div class="score-item">
                <span class="label">得分：</span>
                <span class="value">{{ attempt.score || 0 }} / {{ attempt.totalScore || 0 }}</span>
              </div>
              <div class="score-item">
                <span class="label">正确率：</span>
                <span class="value">{{ Math.round(attempt.percentage || 0) }}%</span>
              </div>
              <div class="score-item">
                <span class="label">用时：</span>
                <span class="value">{{ formatTime(attempt.timeSpent || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 题目详情 -->
      <el-card class="questions-review">
        <template #header>
          <h3>题目详情</h3>
        </template>
        
        <div class="questions-list">
          <div 
            v-for="(question, index) in quiz.questionEntities" 
            :key="question.id"
            class="question-item"
            :class="{ 'correct': isCorrect(question.id), 'incorrect': !isCorrect(question.id) }"
          >
            <div class="question-header">
              <span class="question-number">第 {{ index + 1 }} 题</span>
              <el-tag 
                :type="isCorrect(question.id) ? 'success' : 'danger'"
                size="small"
              >
                {{ isCorrect(question.id) ? '正确' : '错误' }}
              </el-tag>
              <span class="question-score">
                {{ getQuestionScore(question.id) }} / {{ question.score }} 分
              </span>
            </div>

            <div class="question-content">
              <div class="question-text">{{ question.question }}</div>
              
              <!-- 选择题展示 -->
              <div v-if="question.type === 'mcq'" class="mcq-review">
                <div 
                  v-for="(option, optionIndex) in question.options" 
                  :key="optionIndex"
                  class="option-item"
                  :class="{
                    'user-answer': getUserAnswer(question.id) === String.fromCharCode(65 + optionIndex),
                    'correct-answer': question.correctAnswer === String.fromCharCode(65 + optionIndex),
                    'wrong-answer': getUserAnswer(question.id) === String.fromCharCode(65 + optionIndex) && !isCorrect(question.id)
                  }"
                >
                  <span class="option-label">{{ String.fromCharCode(65 + optionIndex) }}.</span>
                  <span class="option-text">{{ option }}</span>
                  <span v-if="question.correctAnswer === String.fromCharCode(65 + optionIndex)" class="correct-mark">✓</span>
                  <span v-if="getUserAnswer(question.id) === String.fromCharCode(65 + optionIndex) && !isCorrect(question.id)" class="wrong-mark">✗</span>
                </div>
              </div>

              <!-- 填空题/简答题展示 -->
              <div v-else class="text-review">
                <div class="answer-comparison">
                  <div class="user-answer-section">
                    <label>您的答案：</label>
                    <div class="answer-content" :class="{ 'correct': isCorrect(question.id), 'incorrect': !isCorrect(question.id) }">
                      {{ getUserAnswer(question.id) || '未作答' }}
                    </div>
                  </div>
                  <div class="correct-answer-section">
                    <label>正确答案：</label>
                    <div class="answer-content correct">
                      {{ question.correctAnswer }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 解析 -->
              <div v-if="question.explanation" class="explanation">
                <label>解析：</label>
                <p>{{ question.explanation }}</p>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 操作按钮 -->
      <el-card class="actions-card">
        <div class="actions">
          <el-button @click="goBack" size="large">
            返回题目
          </el-button>
          <el-button @click="goToQuizList" size="large">
            题目列表
          </el-button>
          <el-button type="primary" @click="retakeQuiz" size="large">
            重新答题
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-container">
      <el-card>
        <el-result
          icon="error"
          title="加载失败"
          :sub-title="errorMessage || '无法加载答题结果，请稍后重试'"
        >
          <template #extra>
            <el-button type="primary" @click="goToQuizList">返回题目列表</el-button>
          </template>
        </el-result>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { quizzesApi } from '@/api/quizzes'
import type { QuizEntity, QuizAttemptEntity } from '@/types'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(true)
const attempt = ref<QuizAttemptEntity | null>(null)
const quiz = ref<QuizEntity | null>(null)
const errorMessage = ref('')

// 获取答题记录ID
const attemptId = route.params.id as string

// 初始化
onMounted(async () => {
  await loadAttemptResult()
})

// 加载答题结果
const loadAttemptResult = async () => {
  try {
    loading.value = true
    
    // 获取答题记录详情
    attempt.value = await quizzesApi.getAttempt(attemptId)
    
    if (!attempt.value) {
      throw new Error('答题记录不存在')
    }

    // 获取题目详情
    quiz.value = await quizzesApi.getQuiz(attempt.value.quizId)
    
  } catch (error: any) {
    console.error('加载答题结果失败:', error)
    errorMessage.value = error.message || '加载答题结果失败'
  } finally {
    loading.value = false
  }
}

// 获取用户答案
const getUserAnswer = (questionId: string): string => {
  const answer = attempt.value?.answers?.find((a: any) => a.questionId === questionId)
  return answer?.answer || ''
}

// 检查答案是否正确
const isCorrect = (questionId: string): boolean => {
  const answer = attempt.value?.answers?.find((a: any) => a.questionId === questionId)
  return answer?.isCorrect || false
}

// 获取题目得分
const getQuestionScore = (questionId: string): number => {
  const answer = attempt.value?.answers?.find((a: any) => a.questionId === questionId)
  return answer?.points || 0
}

// 获取分数颜色
const getScoreColor = (percentage: number) => {
  if (percentage >= 90) return '#67c23a'
  if (percentage >= 80) return '#e6a23c'
  if (percentage >= 60) return '#f56c6c'
  return '#909399'
}

// 格式化时间
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// 返回题目详情
const goBack = () => {
  if (quiz.value) {
    router.push(`/quizzes/${quiz.value.id}`)
  } else {
    router.back()
  }
}

// 前往题目列表
const goToQuizList = () => {
  router.push('/quizzes')
}

// 重新答题
const retakeQuiz = () => {
  if (quiz.value) {
    router.push(`/quizzes/${quiz.value.id}/take`)
  }
}
</script>

<style scoped>
.quiz-result-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-content {
  text-align: center;
}

.loading-content .el-icon {
  margin-bottom: 16px;
  color: var(--el-color-primary);
}

.result-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.score-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.score-overview {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 20px;
}

.score-circle {
  flex-shrink: 0;
}

.score-text {
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.score-details h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
}

.score-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-item .label {
  font-weight: 500;
  opacity: 0.9;
}

.score-item .value {
  font-weight: 600;
  font-size: 16px;
}

.questions-review {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-item {
  border: 2px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 20px;
}

.question-item.correct {
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
}

.question-item.incorrect {
  border-color: var(--el-color-danger-light-5);
  background: var(--el-color-danger-light-9);
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-weight: 500;
}

.question-number {
  color: var(--el-color-primary);
  font-weight: 600;
}

.question-score {
  margin-left: auto;
  color: var(--el-color-warning);
  font-weight: 600;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}

.mcq-review {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
}

.option-item.correct-answer {
  background: var(--el-color-success-light-9);
  border-color: var(--el-color-success-light-5);
}

.option-item.wrong-answer {
  background: var(--el-color-danger-light-9);
  border-color: var(--el-color-danger-light-5);
}

.option-label {
  font-weight: 600;
  min-width: 20px;
}

.option-text {
  flex: 1;
}

.correct-mark {
  color: var(--el-color-success);
  font-weight: 600;
}

.wrong-mark {
  color: var(--el-color-danger);
  font-weight: 600;
}

.text-review {
  margin-bottom: 16px;
}

.answer-comparison {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-answer-section,
.correct-answer-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-answer-section label,
.correct-answer-section label {
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.answer-content {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.answer-content.correct {
  background: var(--el-color-success-light-9);
  border-color: var(--el-color-success-light-5);
}

.answer-content.incorrect {
  background: var(--el-color-danger-light-9);
  border-color: var(--el-color-danger-light-5);
}

.explanation {
  padding: 12px;
  background: var(--el-color-info-light-9);
  border-radius: 6px;
  border-left: 4px solid var(--el-color-info);
}

.explanation label {
  font-weight: 600;
  color: var(--el-color-info);
  margin-bottom: 4px;
  display: block;
}

.explanation p {
  margin: 0;
  line-height: 1.6;
}

.actions-card {
  border: none;
  background: var(--el-bg-color-page);
}

.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.actions .el-button {
  min-width: 120px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quiz-result-view {
    padding: 16px;
  }
  
  .score-overview {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .answer-comparison {
    gap: 8px;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .actions .el-button {
    width: 100%;
  }
}
</style>
