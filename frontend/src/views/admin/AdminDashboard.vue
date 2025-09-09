<template>
  <div class="admin-dashboard">
    <div class="page-header">
      <h1>管理员面板</h1>
      <p>系统管理和配置中心</p>
    </div>

    <div class="admin-grid">
      <!-- AI配置管理 -->
      <el-card class="admin-card" @click="$router.push('/admin/ai-config')">
        <div class="card-content">
          <div class="card-icon">
            <el-icon size="48"><Setting /></el-icon>
          </div>
          <h3>AI配置管理</h3>
          <p>管理AI Provider配置，支持多种AI服务</p>
          <div class="card-stats">
            <el-tag type="primary">{{ providerCount }} 个配置</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 用户管理 -->
      <el-card class="admin-card">
        <div class="card-content">
          <div class="card-icon">
            <el-icon size="48"><User /></el-icon>
          </div>
          <h3>用户管理</h3>
          <p>管理系统用户和权限</p>
          <div class="card-stats">
            <el-tag type="success">开发中</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 系统监控 -->
      <el-card class="admin-card">
        <div class="card-content">
          <div class="card-icon">
            <el-icon size="48"><Monitor /></el-icon>
          </div>
          <h3>系统监控</h3>
          <p>查看系统运行状态和性能指标</p>
          <div class="card-stats">
            <el-tag type="warning">开发中</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 日志管理 -->
      <el-card class="admin-card">
        <div class="card-content">
          <div class="card-icon">
            <el-icon size="48"><Document /></el-icon>
          </div>
          <h3>日志管理</h3>
          <p>查看和管理系统日志</p>
          <div class="card-stats">
            <el-tag type="info">开发中</el-tag>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 快速统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalFiles }}</div>
            <div class="stat-label">总文档数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalQuizzes }}</div>
            <div class="stat-label">总题目数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ providerCount }}</div>
            <div class="stat-label">AI配置数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Setting, User, Monitor, Document } from '@element-plus/icons-vue'
import { providersApi } from '@/api/providers'

// 响应式数据
const providerCount = ref(0)
const stats = ref({
  totalUsers: 0,
  totalFiles: 0,
  totalQuizzes: 0
})

// 加载统计数据
const loadStats = async () => {
  try {
    // 加载Provider数量
    const providersResponse = await providersApi.getProviders(1, 1)
    providerCount.value = providersResponse.data.total

    // TODO: 加载其他统计数据
    stats.value = {
      totalUsers: 0,
      totalFiles: 0,
      totalQuizzes: 0
    }
  } catch (error) {
    console.error('Load stats error:', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
  font-size: 16px;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.admin-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 200px;
}

.admin-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  height: 100%;
  justify-content: center;
}

.card-icon {
  margin-bottom: 16px;
  color: #409eff;
}

.card-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.card-content p {
  margin: 0 0 16px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.card-stats {
  margin-top: auto;
}

.stats-row {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 20px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 12px;
  }

  .admin-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .admin-card {
    height: auto;
  }

  .card-content {
    padding: 20px;
  }
}
</style>
