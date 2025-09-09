<template>
  <div class="ai-config-view">
    <div class="page-header">
      <h1>AI配置管理</h1>
      <p>管理AI Provider配置，支持Google Gemini、OpenAI等多种AI服务</p>
    </div>

    <div class="actions-bar">
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        添加AI配置
      </el-button>
      <el-button @click="loadProviders">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <!-- Provider列表 -->
    <el-card class="providers-card">
      <template #header>
        <div class="card-header">
          <span>AI Provider列表</span>
          <el-tag v-if="defaultProvider" type="success">
            默认: {{ defaultProvider.name }}
          </el-tag>
        </div>
      </template>

      <el-table 
        :data="providers" 
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getProviderTypeColor(row.type)">
              {{ getProviderTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="config.model" label="模型" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '活跃' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isDefault" label="默认" width="80">
          <template #default="{ row }">
            <el-icon v-if="row.isDefault" color="#67C23A"><Check /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="testProvider(row)">
              测试连接
            </el-button>
            <el-button size="small" @click="getModels(row)">
              获取模型
            </el-button>
            <el-button size="small" @click="editProvider(row)">
              编辑
            </el-button>
            <el-button 
              size="small" 
              :type="row.isDefault ? 'warning' : 'success'"
              @click="setDefault(row)"
              :disabled="row.isDefault"
            >
              {{ row.isDefault ? '已默认' : '设为默认' }}
            </el-button>
            <el-button 
              size="small" 
              :type="row.status === 'active' ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '停用' : '启用' }}
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteProvider(row)"
              :disabled="row.isDefault"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadProviders"
          @current-change="loadProviders"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingProvider ? '编辑AI配置' : '添加AI配置'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入配置名称" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            placeholder="请输入配置描述"
            :rows="2"
          />
        </el-form-item>

        <el-form-item label="Provider类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择Provider类型" @change="onTypeChange">
            <el-option label="Google Gemini" value="gemini" />
            <el-option label="OpenAI" value="openai" />
            <el-option label="Claude" value="claude" />
            <el-option label="Azure OpenAI" value="azure" />
            <el-option label="本地模型" value="local" />
          </el-select>
        </el-form-item>

        <el-form-item label="API密钥" prop="config.apiKey">
          <el-input 
            v-model="form.config.apiKey" 
            type="password" 
            placeholder="请输入API密钥"
            show-password
          />
        </el-form-item>

        <el-form-item label="API基础URL" prop="config.baseUrl">
          <el-input 
            v-model="form.config.baseUrl" 
            placeholder="请输入API基础URL（可选，使用中转站时填写）"
          />
          <div class="form-tip">
            <p>常用中转站示例：</p>
            <p>• OpenAI官方: https://api.openai.com</p>
            <p>• Gemini官方: https://generativelanguage.googleapis.com</p>
          </div>
        </el-form-item>

        <el-form-item label="模型名称" prop="config.model">
          <el-input v-model="form.config.model" placeholder="请输入模型名称" />
          <div class="form-tip">
            <p>常用模型示例：</p>
            <p v-if="form.type === 'gemini'">• gemini-pro, gemini-1.5-pro, gemini-1.5-flash</p>
            <p v-if="form.type === 'openai'">• gpt-4, gpt-4-turbo, gpt-3.5-turbo, gpt-4o</p>
            <p v-if="form.type === 'claude'">• claude-3-opus, claude-3-sonnet, claude-3-haiku</p>
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最大Token数" prop="config.maxTokens">
              <el-input-number 
                v-model="form.config.maxTokens" 
                :min="1" 
                :max="32000"
                placeholder="2048"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="温度参数" prop="config.temperature">
              <el-input-number 
                v-model="form.config.temperature" 
                :min="0" 
                :max="2" 
                :step="0.1"
                placeholder="0.7"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="超时时间(ms)" prop="config.timeout">
              <el-input-number 
                v-model="form.config.timeout" 
                :min="1000" 
                :max="300000"
                placeholder="30000"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-input-number 
                v-model="form.priority" 
                :min="0" 
                :max="100"
                placeholder="0"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-checkbox v-model="form.isDefault">设为默认Provider</el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="saveProvider" :loading="saving">
            {{ editingProvider ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 测试结果对话框 -->
    <el-dialog v-model="showTestDialog" title="连接测试结果" width="500px">
      <div class="test-result">
        <el-result
          :icon="testResult?.success ? 'success' : 'error'"
          :title="testResult?.message"
        >
          <template #sub-title>
            <div v-if="testResult?.response" class="test-response">
              <h4>AI响应:</h4>
              <p>{{ testResult.response }}</p>
            </div>
            <div v-if="testResult?.error" class="test-error">
              <h4>错误信息:</h4>
              <p>{{ testResult.error }}</p>
            </div>
          </template>
        </el-result>
      </div>
    </el-dialog>

    <!-- 模型列表对话框 -->
    <el-dialog v-model="showModelsDialog" title="可用模型列表" width="400px">
      <div class="models-list">
        <el-tag 
          v-for="model in availableModels" 
          :key="model" 
          class="model-tag"
          @click="copyToClipboard(model)"
        >
          {{ model }}
        </el-tag>
        <el-empty v-if="!availableModels.length" description="暂无可用模型" />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showModelsDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Check } from '@element-plus/icons-vue'
import { providersApi, type Provider, type CreateProviderDto, type TestResult } from '@/api/providers'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const providers = ref<Provider[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框状态
const showCreateDialog = ref(false)
const showTestDialog = ref(false)
const showModelsDialog = ref(false)

// 编辑状态
const editingProvider = ref<Provider | null>(null)
const testResult = ref<TestResult | null>(null)
const availableModels = ref<string[]>([])

// 表单数据
const form = reactive<CreateProviderDto>({
  name: '',
  description: '',
  type: 'gemini',
  config: {
    apiKey: '',
    baseUrl: '',
    model: '',
    maxTokens: 2048,
    temperature: 0.7,
    timeout: 30000
  },
  priority: 0,
  isDefault: false
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入配置名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择Provider类型', trigger: 'change' }
  ],
  'config.apiKey': [
    { required: true, message: '请输入API密钥', trigger: 'blur' }
  ],
  'config.model': [
    { required: true, message: '请输入模型名称', trigger: 'blur' }
  ]
}

const formRef = ref()

// 计算属性
const defaultProvider = computed(() => {
  return providers.value.find(p => p.isDefault)
})

// 方法
const loadProviders = async () => {
  loading.value = true
  try {
    const response = await providersApi.getProviders(currentPage.value, pageSize.value)
    providers.value = response.data.providers
    total.value = response.data.total
  } catch (error) {
    ElMessage.error('加载Provider列表失败')
    console.error('Load providers error:', error)
  } finally {
    loading.value = false
  }
}

const getProviderTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    gemini: 'Gemini',
    openai: 'OpenAI',
    claude: 'Claude',
    azure: 'Azure',
    local: '本地'
  }
  return typeMap[type] || type
}

const getProviderTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    gemini: 'primary',
    openai: 'success',
    claude: 'warning',
    azure: 'info',
    local: 'danger'
  }
  return colorMap[type] || 'default'
}

const onTypeChange = () => {
  // 根据类型设置默认值
  const defaults: Record<string, Partial<CreateProviderDto['config']>> = {
    gemini: {
      model: 'gemini-pro',
      baseUrl: 'https://generativelanguage.googleapis.com'
    },
    openai: {
      model: 'gpt-4',
      baseUrl: 'https://api.openai.com'
    },
    claude: {
      model: 'claude-3-sonnet',
      baseUrl: ''
    }
  }

  const defaultConfig = defaults[form.type]
  if (defaultConfig) {
    Object.assign(form.config, defaultConfig)
  }
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    description: '',
    type: 'gemini',
    config: {
      apiKey: '',
      baseUrl: '',
      model: '',
      maxTokens: 2048,
      temperature: 0.7,
      timeout: 30000
    },
    priority: 0,
    isDefault: false
  })
  editingProvider.value = null
  formRef.value?.clearValidate()
}

const editProvider = (provider: Provider) => {
  editingProvider.value = provider
  Object.assign(form, {
    name: provider.name,
    description: provider.description || '',
    type: provider.type,
    config: { ...provider.config },
    priority: provider.priority,
    isDefault: provider.isDefault
  })
  showCreateDialog.value = true
}

const saveProvider = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    saving.value = true

    if (editingProvider.value) {
      await providersApi.updateProvider(editingProvider.value.id, form)
      ElMessage.success('更新Provider成功')
    } else {
      await providersApi.createProvider(form)
      ElMessage.success('创建Provider成功')
    }

    showCreateDialog.value = false
    resetForm()
    await loadProviders()
  } catch (error: any) {
    if (error.errors) {
      // 表单验证错误
      return
    }
    ElMessage.error(editingProvider.value ? '更新Provider失败' : '创建Provider失败')
    console.error('Save provider error:', error)
  } finally {
    saving.value = false
  }
}

const deleteProvider = async (provider: Provider) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除Provider "${provider.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await providersApi.deleteProvider(provider.id)
    ElMessage.success('删除Provider成功')
    await loadProviders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除Provider失败')
      console.error('Delete provider error:', error)
    }
  }
}

const testProvider = async (provider: Provider) => {
  try {
    loading.value = true
    const response = await providersApi.testProvider({ providerId: provider.id })
    testResult.value = response.data
    showTestDialog.value = true
  } catch (error) {
    ElMessage.error('测试连接失败')
    console.error('Test provider error:', error)
  } finally {
    loading.value = false
  }
}

const getModels = async (provider: Provider) => {
  try {
    loading.value = true
    const response = await providersApi.getModels({ providerId: provider.id })
    availableModels.value = response.data.models
    showModelsDialog.value = true
  } catch (error) {
    ElMessage.error('获取模型列表失败')
    console.error('Get models error:', error)
  } finally {
    loading.value = false
  }
}

const setDefault = async (provider: Provider) => {
  try {
    await providersApi.setDefault(provider.id)
    ElMessage.success(`已将 "${provider.name}" 设为默认Provider`)
    await loadProviders()
  } catch (error) {
    ElMessage.error('设置默认Provider失败')
    console.error('Set default error:', error)
  }
}

const toggleStatus = async (provider: Provider) => {
  try {
    await providersApi.toggleStatus(provider.id)
    const action = provider.status === 'active' ? '停用' : '启用'
    ElMessage.success(`${action}Provider成功`)
    await loadProviders()
  } catch (error) {
    ElMessage.error('切换Provider状态失败')
    console.error('Toggle status error:', error)
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 生命周期
onMounted(() => {
  loadProviders()
})
</script>

<style scoped>
.ai-config-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.actions-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
}

.providers-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.form-tip p {
  margin: 2px 0;
}

.test-result {
  text-align: center;
}

.test-response,
.test-error {
  margin-top: 16px;
  text-align: left;
}

.test-response h4,
.test-error h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.test-response p,
.test-error p {
  margin: 0;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.test-error p {
  background-color: #fef0f0;
  color: #f56c6c;
}

.models-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.model-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.model-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-config-view {
    padding: 12px;
  }

  .actions-bar {
    flex-direction: column;
  }

  .el-table {
    font-size: 12px;
  }
}
</style>
