<template>
  <div class="app-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside :width="appStore.sidebarCollapsed ? '64px' : '250px'" class="sidebar">
        <div class="sidebar-header">
          <div v-if="!appStore.sidebarCollapsed" class="logo">
            <h3>QuizOnly</h3>
          </div>
          <el-button
            text
            :icon="appStore.sidebarCollapsed ? Expand : Fold"
            @click="appStore.toggleSidebar"
          />
        </div>
        
        <el-menu
          :default-active="$route.path"
          :collapse="appStore.sidebarCollapsed"
          :router="true"
          class="sidebar-menu"
        >
          <el-menu-item index="/dashboard">
            <el-icon><House /></el-icon>
            <span>仪表板</span>
          </el-menu-item>
          
          <el-menu-item index="/files">
            <el-icon><Document /></el-icon>
            <span>文档管理</span>
          </el-menu-item>
          
          <el-menu-item index="/quizzes">
            <el-icon><List /></el-icon>
            <span>题目管理</span>
          </el-menu-item>
          
          <el-menu-item index="/plans">
            <el-icon><Star /></el-icon>
            <span>套餐管理</span>
          </el-menu-item>
          
          <el-sub-menu v-if="authStore.isAdmin" index="admin">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/admin">
              <el-icon><Monitor /></el-icon>
              <span>管理面板</span>
            </el-menu-item>
            <el-menu-item index="/admin/ai-config">
              <el-icon><Cpu /></el-icon>
              <span>AI配置</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <el-container>
        <!-- 顶部导航 -->
        <el-header class="header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item
                v-for="item in breadcrumbs"
                :key="item.path"
                :to="item.path"
              >
                {{ item.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="header-right">
            <!-- 用户菜单 -->
            <el-dropdown @command="handleUserCommand">
              <div class="user-info">
                <el-avatar :size="32" :src="authStore.user?.avatar">
                  {{ authStore.user?.firstName?.charAt(0) || 'U' }}
                </el-avatar>
                <span v-if="!appStore.sidebarCollapsed" class="username">
                  {{ authStore.user?.firstName || '用户' }}
                </span>
                <el-icon><ArrowDown /></el-icon>
              </div>
              
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人资料
                  </el-dropdown-item>
                  <el-dropdown-item command="settings">
                    <el-icon><Setting /></el-icon>
                    设置
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 主要内容 -->
        <el-main class="main-content">
          <slot />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  House,
  Document,
  List,
  Star,
  Setting,
  User,
  SwitchButton,
  ArrowDown,
  Expand,
  Fold,
  Monitor,
  Cpu
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// 面包屑导航
const breadcrumbs = computed(() => {
  const routeMap: Record<string, string> = {
    '/dashboard': '仪表板',
    '/files': '文档管理',
    '/quizzes': '题目管理',
    '/plans': '套餐管理',
    '/profile': '个人资料',
    '/admin': '系统管理'
  }

  const paths = route.path.split('/').filter(Boolean)
  const breadcrumbItems = []
  
  let currentPath = ''
  for (const path of paths) {
    currentPath += `/${path}`
    const title = routeMap[currentPath]
    if (title) {
      breadcrumbItems.push({
        path: currentPath,
        title
      })
    }
  }
  
  return breadcrumbItems
})

// 处理用户菜单命令
const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      // TODO: 实现设置页面
      ElMessage.info('设置功能开发中')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await authStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      } catch (error) {
        // 用户取消操作
      }
      break
  }
}
</script>

<style scoped>
.app-layout {
  height: 100vh;
}

.sidebar {
  background: #001529;
  transition: width 0.3s ease;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #1f1f1f;
}

.logo h3 {
  color: white;
  margin: 0;
  font-size: 1.2rem;
}

.sidebar-header .el-button {
  color: white;
}

.sidebar-menu {
  border: none;
  background: #001529;
}

.sidebar-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.65);
}

.sidebar-menu .el-menu-item:hover,
.sidebar-menu .el-menu-item.is-active {
  background-color: #1890ff;
  color: white;
}

.header {
  background: white;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.username {
  font-size: 0.9rem;
  color: #333;
}

.main-content {
  background: #f5f5f5;
  padding: 0;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
  }
  
  .header-left {
    display: none;
  }
}
</style>
