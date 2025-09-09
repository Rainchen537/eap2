<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h2>注册</h2>
          <p>创建您的 EAP2 账号</p>
        </div>

        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="register-form"
          @submit.prevent="handleRegister"
        >
          <el-form-item prop="email">
            <el-input
              v-model="registerForm.email"
              type="email"
              placeholder="请输入邮箱"
              size="large"
              :prefix-icon="Message"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请确认密码"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item prop="firstName">
                <el-input
                  v-model="registerForm.firstName"
                  placeholder="姓"
                  size="large"
                  :prefix-icon="User"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="lastName">
                <el-input
                  v-model="registerForm.lastName"
                  placeholder="名"
                  size="large"
                  :prefix-icon="User"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="authStore.loading"
              class="register-button"
              @click="handleRegister"
            >
              注册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="register-footer">
          <p>
            已有账号？
            <router-link to="/login" class="link">立即登录</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Message, Lock, User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import type { RegisterRequest } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const registerFormRef = ref<FormInstance>()

const registerForm = reactive<RegisterRequest & { confirmPassword: string }>({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    console.log('开始表单验证...')
    await registerFormRef.value.validate()
    console.log('表单验证通过')

    // 从表单数据中移除 confirmPassword 字段
    const { confirmPassword, ...registerData } = registerForm
    console.log('准备发送注册数据:', registerData)

    const result = await authStore.register(registerData)
    console.log('注册成功:', result)

    ElMessage.success('注册成功')
    router.push('/dashboard')
  } catch (error: any) {
    console.error('注册错误详情:', error)
    console.error('错误响应:', error.response)
    console.error('错误数据:', error.response?.data)

    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else if (typeof error === 'string') {
      ElMessage.error(error)
    } else if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('注册失败，请重试')
    }
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  width: 100%;
  max-width: 450px;
}

.register-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h2 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 10px;
}

.register-header p {
  color: #666;
  font-size: 0.9rem;
}

.register-form {
  margin-bottom: 20px;
}

.register-button {
  width: 100%;
}

.register-footer {
  text-align: center;
}

.register-footer p {
  color: #666;
  font-size: 0.9rem;
}

.link {
  color: #409eff;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .register-card {
    padding: 30px 20px;
  }
}
</style>
