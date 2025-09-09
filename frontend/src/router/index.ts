import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'files',
          name: 'files',
          component: () => import('@/views/files/FileListView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'files/:id',
          name: 'file-detail',
          component: () => import('@/views/files/FileDetailView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'files/:id/annotate',
          name: 'file-annotate',
          component: () => import('@/views/files/FileAnnotateView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'quizzes',
          name: 'quizzes',
          component: () => import('@/views/quizzes/QuizListView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'quizzes/:id',
          name: 'quiz-detail',
          component: () => import('@/views/quizzes/QuizDetailView.vue'),
          meta: { requiresAuth: true }
        },
      ]
    },
    {
      path: '/quizzes/:id/take',
      name: 'quiz-take',
      component: () => import('@/views/quizzes/QuizTakeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/plans',
      name: 'plans',
      component: () => import('@/views/PlansView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/admin/AdminDashboard.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue')
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 检查是否需要认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  
  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'dashboard' })
    return
  }
  
  // 如果已登录用户访问登录/注册页面，重定向到仪表板
  if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }
  
  next()
})

export default router
