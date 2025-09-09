<template>
  <div class="quiz-take-view">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-card>
        <div class="loading-content">
          <el-icon class="is-loading" size="32"><Loading /></el-icon>
          <p>正在加载题目...</p>
        </div>
      </el-card>
    </div>

    <!-- 答题界面 -->
    <div v-else-if="quiz && attempt" class="quiz-container">
      <!-- 答题头部信息 -->
      <el-card class="quiz-header" shadow="never">
        <div class="quiz-info">
          <h2>{{ quiz.title }}</h2>
          <p class="quiz-description">{{ quiz.description }}</p>
          <div class="quiz-meta">
            <el-tag type="info">{{ (quiz as any).questionEntities?.length || 0 }} 道题目</el-tag>
            <el-tag type="warning">总分 {{ quiz.totalScore }} 分</el-tag>
            <el-tag v-if="timeSpent > 0" type="success">
              已用时 {{ formatTime(timeSpent) }}
            </el-tag>
          </div>
        </div>
      </el-card>

      <!-- 题目进度 -->
      <el-card class="progress-card" shadow="never">
        <div class="progress-info">
          <span>答题进度：{{ answeredCount }}/{{ totalQuestions }}</span>
          <el-progress
            :percentage="progressPercentage"
            :stroke-width="8"
            :show-text="false"
          />
        </div>
      </el-card>

      <!-- 题目列表 -->
      <div class="questions-container">
        <el-card
          v-for="(question, index) in (quiz as any).questionEntities"
          :key="question.id"
          class="question-card"
          :class="{ 'answered': isQuestionAnswered(question.id) }"
        >
          <template #header>
            <div class="question-header">
              <span class="question-number">第 {{ index + 1 }} 题</span>
              <el-tag
                v-if="isQuestionAnswered(question.id)"
                type="success"
                size="small"
              >
                已答
              </el-tag>
              <el-tag
                :type="getDifficultyType(question.difficulty)"
                size="small"
              >
                {{ getDifficultyText(question.difficulty) }}
              </el-tag>
              <span class="question-score">{{ question.score }} 分</span>
            </div>
          </template>

          <div class="question-content">
            <div class="question-text">{{ question.question }}</div>

            <!-- 选择题 -->
            <div v-if="question.type === 'mcq'" class="mcq-options">
              <el-radio-group
                v-model="answers[question.id]"
                @change="handleAnswerChange(question.id, $event)"
              >
                <el-radio
                  v-for="(option, optionIndex) in question.options"
                  :key="optionIndex"
                  :label="String.fromCharCode(65 + optionIndex)"
                  class="option-radio"
                >
                  {{ String.fromCharCode(65 + optionIndex) }}. {{ option }}
                </el-radio>
              </el-radio-group>
            </div>

            <!-- 填空题 -->
            <div v-else-if="question.type === 'fill_blank'" class="fill-blank">
              <el-input
                v-model="answers[question.id]"
                placeholder="请输入答案"
                @blur="handleAnswerChange(question.id, answers[question.id])"
                clearable
              />
            </div>

            <!-- 简答题 -->
            <div v-else-if="question.type === 'short_answer'" class="short-answer">
              <el-input
                v-model="answers[question.id]"
                type="textarea"
                :rows="4"
                placeholder="请输入答案"
                @blur="handleAnswerChange(question.id, answers[question.id])"
                clearable
              />
            </div>
          </div>
        </el-card>
      </div>

      <!-- 提交按钮 -->
      <el-card class="submit-card" shadow="never">
        <div class="submit-actions">
          <el-button @click="goBack" size="large">
            返回
          </el-button>
          <el-button
            type="primary"
            size="large"
            @click="submitQuiz"
            :loading="submitting"
            :disabled="answeredCount === 0"
          >
            {{ answeredCount === totalQuestions ? '提交答案' : `继续答题 (${answeredCount}/${totalQuestions})` }}
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
          :sub-title="errorMessage || '无法加载题目，请稍后重试'"
        >
          <template #extra>
            <el-button type="primary" @click="goBack">返回</el-button>
          </template>
        </el-result>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { quizzesApi } from '@/api/quizzes'
import type { QuizEntity, QuizAttemptEntity } from '@/types'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(true)
const submitting = ref(false)
const quiz = ref<QuizEntity | null>(null)
const attempt = ref<QuizAttemptEntity | null>(null)
const answers = ref<Record<string, string>>({})
const errorMessage = ref('')
const startTime = ref<Date>(new Date())
const timeSpent = ref(0)

// 计时器
let timer: NodeJS.Timeout | null = null

// 计算属性
const totalQuestions = computed(() => (quiz.value as any)?.questionEntities?.length || 0)
const answeredCount = computed(() => Object.keys(answers.value).filter(key => answers.value[key]?.trim()).length)
const progressPercentage = computed(() =>
  totalQuestions.value > 0 ? Math.round((answeredCount.value / totalQuestions.value) * 100) : 0
)

// 获取题目ID
const quizId = route.params.id as string

// 初始化
onMounted(async () => {
  await initializeQuiz()
  startTimer()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

// 初始化题目和答题记录
const initializeQuiz = async () => {
  try {
    loading.value = true

    // 获取题目详情
    quiz.value = await quizzesApi.getQuiz(quizId)

    if (!quiz.value) {
      throw new Error('题目不存在')
    }

    if (quiz.value.status !== 'completed') {
      throw new Error('题目尚未生成完成')
    }

    // 开始答题
    attempt.value = await quizzesApi.startQuiz({ quizId })

    // 如果有已保存的答案，恢复它们
    if (attempt.value.answers && attempt.value.answers.length > 0) {
      const savedAnswers: Record<string, string> = {}
      attempt.value.answers.forEach((answer: any) => {
        savedAnswers[answer.questionId] = answer.answer
      })
      answers.value = savedAnswers
    }

  } catch (error: any) {
    console.error('初始化答题失败:', error)
    errorMessage.value = error.message || '加载题目失败'
  } finally {
    loading.value = false
  }
}

// 开始计时
const startTimer = () => {
  timer = setInterval(() => {
    timeSpent.value = Math.floor((new Date().getTime() - startTime.value.getTime()) / 1000)
  }, 1000)
}

// 处理答案变化
const handleAnswerChange = async (questionId: string, answer: string) => {
  if (!attempt.value || !answer?.trim()) return

  try {
    await quizzesApi.submitAnswer(attempt.value.id, {
      questionId,
      answer: answer.trim(),
      timeSpent: timeSpent.value
    })

    // 更新本地答案
    answers.value[questionId] = answer.trim()

  } catch (error: any) {
    console.error('提交答案失败:', error)
    ElMessage.error('答案保存失败，请重试')
  }
}

// 检查题目是否已回答
const isQuestionAnswered = (questionId: string): boolean => {
  return !!answers.value[questionId]?.trim()
}

// 获取难度类型
const getDifficultyType = (difficulty: string) => {
  const types: Record<string, string> = {
    'easy': 'success',
    'medium': 'warning',
    'hard': 'danger'
  }
  return types[difficulty] || 'info'
}

// 获取难度文本
const getDifficultyText = (difficulty: string) => {
  const texts: Record<string, string> = {
    'easy': '简单',
    'medium': '中等',
    'hard': '困难'
  }
  return texts[difficulty] || '未知'
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

// 提交答题
const submitQuiz = async () => {
  if (!attempt.value) return

  // 检查是否有未答题目
  if (answeredCount.value < totalQuestions.value) {
    const result = await ElMessageBox.confirm(
      `您还有 ${totalQuestions.value - answeredCount.value} 道题目未回答，确定要提交吗？`,
      '确认提交',
      {
        confirmButtonText: '确定提交',
        cancelButtonText: '继续答题',
        type: 'warning',
      }
    ).catch(() => false)

    if (!result) return
  }

  try {
    submitting.value = true

    // 完成答题
    const result = await quizzesApi.finishQuiz(attempt.value.id)

    ElMessage.success('答题完成！')

    // 跳转到结果页面
    router.push(`/quiz-results/${result.id}`)

  } catch (error: any) {
    console.error('提交答题失败:', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}
</script>

<style scoped>
.quiz-take-view {
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

.quiz-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.quiz-header {
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.quiz-header :deep(.el-card__body) {
  padding: 24px;
}

.quiz-info h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.quiz-description {
  margin: 0 0 16px 0;
  opacity: 0.9;
  font-size: 14px;
}

.quiz-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quiz-meta .el-tag {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.progress-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-info span {
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.progress-info .el-progress {
  flex: 1;
}

.questions-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card {
  border: 2px solid var(--el-border-color-light);
  transition: all 0.3s ease;
}

.question-card:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.question-card.answered {
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
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

.question-content {
  padding: 0;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.mcq-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-radio {
  margin: 0;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.option-radio:hover {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}

.option-radio.is-checked {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.fill-blank,
.short-answer {
  margin-top: 8px;
}

.submit-card {
  border: none;
  background: var(--el-bg-color-page);
  position: sticky;
  bottom: 20px;
  z-index: 100;
}

.submit-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.submit-actions .el-button {
  min-width: 120px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quiz-take-view {
    padding: 16px;
  }

  .quiz-info h2 {
    font-size: 20px;
  }

  .progress-info {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .question-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .submit-actions {
    flex-direction: column;
  }

  .submit-actions .el-button {
    width: 100%;
  }
}
</style>
