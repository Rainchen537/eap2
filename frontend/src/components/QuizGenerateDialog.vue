<template>
  <el-dialog
    v-model="visible"
    title="生成题目"
    width="500px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="题目集标题" prop="title">
        <el-input
          v-model="form.title"
          placeholder="请输入题目集标题（可选）"
          maxlength="100"
          show-word-limit
        />
        <div class="form-tip">留空将使用默认标题：{{ defaultTitle }}</div>
      </el-form-item>

      <el-form-item label="题目集描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入题目集描述（可选）"
          maxlength="500"
          show-word-limit
        />
        <div class="form-tip">留空将使用默认描述</div>
      </el-form-item>

      <el-form-item label="题目数量" prop="questionCount" required>
        <el-input-number
          v-model="form.questionCount"
          :min="1"
          :max="20"
          :step="1"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="题目类型" prop="questionType" required>
        <el-select v-model="form.questionType" style="width: 100%">
          <el-option label="单选题" value="mcq" />
          <el-option label="填空题" value="fill_blank" />
          <el-option label="简答题" value="short_answer" />
        </el-select>
      </el-form-item>

      <el-form-item label="题目难度" prop="difficulty">
        <el-select v-model="form.difficulty" style="width: 100%">
          <el-option label="简单" value="easy" />
          <el-option label="中等" value="medium" />
          <el-option label="困难" value="hard" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          生成题目
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { fixChineseFilename } from '@/utils/encoding'
import type { GenerateQuizDto } from '@/api/quizzes'

interface Props {
  modelValue: boolean
  fileId: string
  filename: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: GenerateQuizDto): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = reactive<GenerateQuizDto>({
  fileId: '',
  questionCount: 5,
  questionType: 'mcq',
  difficulty: 'medium',
  title: '',
  description: ''
})

const rules: FormRules = {
  questionCount: [
    { required: true, message: '请输入题目数量', trigger: 'blur' },
    { type: 'number', min: 1, max: 20, message: '题目数量必须在1-20之间', trigger: 'blur' }
  ],
  questionType: [
    { required: true, message: '请选择题目类型', trigger: 'change' }
  ]
}

const defaultTitle = computed(() => {
  const fixedFilename = fixChineseFilename(props.filename)
  return `${fixedFilename} - 自动生成题目`
})

// 监听props变化，更新表单
watch(() => props.fileId, (newFileId) => {
  form.fileId = newFileId
}, { immediate: true })

const handleClose = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  form.title = ''
  form.description = ''
  form.questionCount = 5
  form.questionType = 'mcq'
  form.difficulty = 'medium'
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    loading.value = true
    
    // 准备提交数据
    const submitData: GenerateQuizDto = {
      fileId: form.fileId,
      questionCount: form.questionCount,
      questionType: form.questionType,
      difficulty: form.difficulty
    }

    // 只有在用户输入了自定义标题/描述时才添加
    if (form.title?.trim()) {
      submitData.title = form.title.trim()
    }
    if (form.description?.trim()) {
      submitData.description = form.description.trim()
    }

    emit('submit', submitData)
    
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  setLoading: (value: boolean) => {
    loading.value = value
  }
})
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>
