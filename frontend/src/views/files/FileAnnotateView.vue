<template>
  <div class="file-annotate-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="$router.back()" :icon="ArrowLeft">返回</el-button>
        <div class="file-info">
          <h1>{{ file?.originalFilename ? fixChineseFilename(file.originalFilename) : '' }}</h1>
          <p>文档标注 - 标记重要内容区域</p>
        </div>
      </div>
      <div class="header-right">
        <el-button type="success" @click="generateQuiz" :loading="generating" :icon="Edit">
          生成题目
        </el-button>
      </div>
    </div>

    <!-- 标注工具栏 -->
    <div class="annotation-toolbar">
      <el-radio-group v-model="annotationMode" @change="handleModeChange">
        <el-radio-button value="view">查看模式</el-radio-button>
        <el-radio-button value="focus">Focus标注</el-radio-button>
        <el-radio-button value="exclude">Exclude标注</el-radio-button>
        <el-radio-button value="eraser">橡皮擦</el-radio-button>
      </el-radio-group>

      <div class="toolbar-actions">
        <el-button @click="clearAnnotations" :icon="Delete">清除所有标注</el-button>
        <el-button @click="saveAnnotations" type="primary" :icon="Check">保存标注</el-button>
      </div>
    </div>

    <!-- 文档内容区域 -->
    <div class="content-area">
      <el-card class="document-content" v-loading="loading">
        <div
          v-for="(block, index) in blocks"
          :key="block.blockId"
          :class="['text-block', getBlockClass(block)]"
          @mouseup="handleTextSelection(block, index)"
          v-html="renderBlock(block)"
        ></div>
      </el-card>

      <!-- 标注列表 -->
      <el-card class="annotations-panel">
        <template #header>
          <div class="panel-header">
            <span>标注列表 ({{ annotations.length }})</span>
          </div>
        </template>

        <div class="annotations-list">
          <div
            v-for="annotation in annotations"
            :key="annotation.id"
            :class="['annotation-item', annotation.type]"
            @click="highlightAnnotation(annotation)"
          >
            <div class="annotation-header">
              <el-tag :type="annotation.type === 'focus' ? 'success' : 'danger'" size="small">
                {{ annotation.type === 'focus' ? 'Focus' : 'Exclude' }}
              </el-tag>
              <el-button
                @click.stop="deleteAnnotation(annotation.id)"
                :icon="Delete"
                size="small"
                type="danger"
                text
              />
            </div>
            <div class="annotation-text">{{ annotation.text }}</div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, Delete, Check } from '@element-plus/icons-vue'
import { filesApi } from '@/api/files'
import { annotationsApi } from '@/api/annotations'
import { quizzesApi } from '@/api/quizzes'
import { fixChineseFilename } from '@/utils/encoding'
import type { FileEntity, AnnotationEntity, BlockEntity } from '@/types'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const generating = ref(false)
const file = ref<FileEntity | null>(null)
const blocks = ref<BlockEntity[]>([])
const annotations = ref<AnnotationEntity[]>([])
const annotationMode = ref<'view' | 'focus' | 'exclude' | 'eraser'>('view')

// 获取文件ID
const fileId = computed(() => route.params.id as string)

// 加载文件内容
const loadFile = async () => {
  loading.value = true
  try {
    const response = await filesApi.getFileContent(fileId.value)
    file.value = response
    blocks.value = response.blocks || []
  } catch (error) {
    console.error('加载文件失败:', error)
    ElMessage.error('加载文件失败')
  } finally {
    loading.value = false
  }
}

// 加载标注
const loadAnnotations = async () => {
  try {
    const response = await annotationsApi.getAnnotations(fileId.value)
    annotations.value = response
  } catch (error) {
    console.error('加载标注失败:', error)
  }
}

// 处理文本选择
const handleTextSelection = (block: BlockEntity, index: number) => {
  if (annotationMode.value === 'view') return

  const selection = window.getSelection()
  if (!selection || selection.toString().trim() === '') return

  const selectedText = selection.toString().trim()
  const range = selection.getRangeAt(0)

  // 计算选中文本在整个文档中的偏移量
  const startOffset = block.startOffset + range.startOffset
  const endOffset = startOffset + selectedText.length

  if (annotationMode.value === 'eraser') {
    // 橡皮擦模式：删除选中区域的标注
    eraseAnnotations(startOffset, endOffset)
  } else {
    // 标注模式：创建新标注（会自动覆盖重叠的标注）
    createAnnotation(selectedText, startOffset, endOffset)
  }

  selection.removeAllRanges()
}

// 创建标注
const createAnnotation = async (text: string, startOffset: number, endOffset: number) => {
  try {
    const annotation = {
      fileId: fileId.value,
      type: annotationMode.value as 'focus' | 'exclude',
      text,
      startOffset,
      endOffset,
      source: 'manual' as const
    }

    const response = await annotationsApi.createAnnotation(annotation)

    // 重新加载标注列表以确保显示最新状态（因为后端会处理重叠标注）
    await loadAnnotations()
    ElMessage.success('标注创建成功')
  } catch (error) {
    console.error('创建标注失败:', error)
    ElMessage.error('创建标注失败')
  }
}

// 橡皮擦功能：删除选中区域内的标注
const eraseAnnotations = async (startOffset: number, endOffset: number) => {
  try {
    // 找到与选中区域重叠的标注
    const overlappingAnnotations = annotations.value.filter(annotation => {
      return annotation.startOffset < endOffset && annotation.endOffset > startOffset
    })

    if (overlappingAnnotations.length === 0) {
      ElMessage.info('选中区域没有标注')
      return
    }

    // 删除重叠的标注
    for (const annotation of overlappingAnnotations) {
      await annotationsApi.deleteAnnotation(annotation.id)
    }

    // 更新本地标注列表
    annotations.value = annotations.value.filter(annotation =>
      !overlappingAnnotations.some(overlap => overlap.id === annotation.id)
    )

    ElMessage.success(`已删除 ${overlappingAnnotations.length} 个标注`)
  } catch (error) {
    console.error('删除标注失败:', error)
    ElMessage.error('删除标注失败')
  }
}

// 删除标注
const deleteAnnotation = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个标注吗？', '确认删除', {
      type: 'warning'
    })

    await annotationsApi.deleteAnnotation(id)
    annotations.value = annotations.value.filter(a => a.id !== id)
    ElMessage.success('标注删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除标注失败:', error)
      ElMessage.error('删除标注失败')
    }
  }
}

// 清除所有标注
const clearAnnotations = async () => {
  try {
    await ElMessageBox.confirm('确定要清除所有标注吗？', '确认清除', {
      type: 'warning'
    })

    for (const annotation of annotations.value) {
      await annotationsApi.deleteAnnotation(annotation.id)
    }

    annotations.value = []
    ElMessage.success('标注清除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清除标注失败:', error)
      ElMessage.error('清除标注失败')
    }
  }
}

// 保存标注
const saveAnnotations = () => {
  ElMessage.success('标注已保存')
}

// 高亮标注
const highlightAnnotation = (annotation: AnnotationEntity) => {
  // 滚动到标注位置并高亮显示
  const element = document.querySelector(`[data-annotation-id="${annotation.id}"]`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// 处理模式变化
const handleModeChange = (mode: string) => {
  if (mode === 'view') {
    ElMessage.info('切换到查看模式')
  } else if (mode === 'focus') {
    ElMessage.info('切换到Focus标注模式，选择重要内容')
  } else if (mode === 'exclude') {
    ElMessage.info('切换到Exclude标注模式，选择要排除的内容')
  } else if (mode === 'eraser') {
    ElMessage.info('切换到橡皮擦模式，选择文本删除标注')
  }
}

// 渲染文本块
const renderBlock = (block: BlockEntity) => {
  let html = block.text

  // 为标注添加高亮
  annotations.value.forEach(annotation => {
    if (annotation.startOffset >= block.startOffset &&
        annotation.endOffset <= block.endOffset) {
      const relativeStart = annotation.startOffset - block.startOffset
      const relativeEnd = annotation.endOffset - block.startOffset
      const beforeText = html.substring(0, relativeStart)
      const annotatedText = html.substring(relativeStart, relativeEnd)
      const afterText = html.substring(relativeEnd)

      const className = annotation.type === 'focus' ? 'annotation-focus' : 'annotation-exclude'
      html = beforeText +
             `<span class="${className}" data-annotation-id="${annotation.id}">${annotatedText}</span>` +
             afterText
    }
  })

  return html
}

// 获取块样式类
const getBlockClass = (block: BlockEntity) => {
  const classes = [block.type]
  if (annotationMode.value !== 'view') {
    classes.push('selectable')
  }
  if (annotationMode.value === 'eraser') {
    classes.push('eraser-mode')
  }
  return classes
}

// 生成题目
const generateQuiz = async () => {
  if (annotations.value.filter(a => a.type === 'focus').length === 0) {
    ElMessage.warning('请先标注一些重要内容')
    return
  }

  generating.value = true
  try {
    const response = await quizzesApi.generateQuiz({
      fileId: fileId.value,
      questionCount: 5,
      questionType: 'mcq'
    })

    ElMessage.success('题目生成成功')
    router.push(`/quizzes/${response.id}`)
  } catch (error) {
    console.error('生成题目失败:', error)
    ElMessage.error('生成题目失败')
  } finally {
    generating.value = false
  }
}

// 生命周期
onMounted(() => {
  loadFile()
  loadAnnotations()
})
</script>

<style scoped>
.file-annotate-view {
  padding: 20px;
  max-width: 1400px;
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

.file-info h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.file-info p {
  margin: 4px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.annotation-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

.content-area {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  min-height: 600px;
}

.document-content {
  height: fit-content;
}

.text-block {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 6px;
  line-height: 1.6;
  transition: all 0.2s;
}

.text-block.selectable {
  cursor: text;
}

.text-block.selectable:hover {
  background-color: #f0f9ff;
}

.text-block.heading {
  font-weight: bold;
  font-size: 18px;
  color: #1f2937;
}

.text-block.paragraph {
  color: #374151;
}

.text-block.list {
  color: #374151;
  padding-left: 20px;
}

.annotations-panel {
  height: fit-content;
  max-height: 600px;
  overflow-y: auto;
}

.panel-header {
  font-weight: 600;
  color: #303133;
}

.annotations-list {
  max-height: 500px;
  overflow-y: auto;
}

.annotation-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.2s;
}

.annotation-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
}

.annotation-item.focus {
  border-left: 4px solid #67c23a;
}

.annotation-item.exclude {
  border-left: 4px solid #f56c6c;
}

.annotation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.annotation-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
  word-break: break-word;
}

/* 标注高亮样式 */
:deep(.annotation-focus) {
  background-color: #f0f9ff;
  border-bottom: 2px solid #67c23a;
  padding: 2px 4px;
  border-radius: 3px;
}

:deep(.annotation-exclude) {
  background-color: #fef0f0;
  border-bottom: 2px solid #f56c6c;
  padding: 2px 4px;
  border-radius: 3px;
  text-decoration: line-through;
  opacity: 0.7;
}

/* 橡皮擦模式样式 */
.text-block.eraser-mode {
  cursor: crosshair;
}

.text-block.eraser-mode:hover {
  background-color: #fff2f0;
}

.text-block.eraser-mode :deep(.annotation-focus),
.text-block.eraser-mode :deep(.annotation-exclude) {
  position: relative;
}

.text-block.eraser-mode :deep(.annotation-focus):hover,
.text-block.eraser-mode :deep(.annotation-exclude):hover {
  background-color: #ffebee !important;
  box-shadow: 0 0 0 2px #f56c6c;
  cursor: crosshair;
}

@media (max-width: 1200px) {
  .content-area {
    grid-template-columns: 1fr;
  }

  .annotations-panel {
    order: -1;
    max-height: 300px;
  }
}
</style>
