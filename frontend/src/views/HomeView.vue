<template>
  <div class="home-page">
    <!-- 导航栏 -->
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <h2>QuizOnly 智能出题平台</h2>
        </div>
        <div class="nav-actions">
          <el-button type="primary" @click="$router.push('/login')">登录</el-button>
          <el-button @click="$router.push('/register')">注册</el-button>
        </div>
      </div>
    </el-header>

    <!-- 主要内容 -->
    <div class="main-content">
      <!-- 英雄区域 -->
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">智能文档精炼与出题平台</h1>
          <p class="hero-subtitle">
            上传文档，AI智能标注重点内容，自动生成题目，让学习更高效
          </p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="$router.push('/register')">
              免费开始
            </el-button>
            <el-button size="large" @click="scrollToFeatures">
              了解更多
            </el-button>
          </div>
        </div>
      </section>

      <!-- 功能特性 -->
      <section id="features" class="features-section">
        <div class="container">
          <h2 class="section-title">核心功能</h2>
          <div class="features-grid">
            <div class="feature-card">
              <el-icon class="feature-icon" size="48">
                <Upload />
              </el-icon>
              <h3>多格式支持</h3>
              <p>支持Word、TXT、Markdown等多种文档格式上传</p>
            </div>
            <div class="feature-card">
              <el-icon class="feature-icon" size="48">
                <Edit />
              </el-icon>
              <h3>智能标注</h3>
              <p>AI自动识别重点内容和排除信息，支持手动调整</p>
            </div>
            <div class="feature-card">
              <el-icon class="feature-icon" size="48">
                <Document />
              </el-icon>
              <h3>自动出题</h3>
              <p>基于标注内容生成选择题、填空题、简答题</p>
            </div>
            <div class="feature-card">
              <el-icon class="feature-icon" size="48">
                <Trophy />
              </el-icon>
              <h3>智能评分</h3>
              <p>AI辅助评分，提供详细反馈和改进建议</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 使用流程 -->
      <section class="process-section">
        <div class="container">
          <h2 class="section-title">使用流程</h2>
          <div class="process-steps">
            <div class="step">
              <div class="step-number">1</div>
              <h3>上传文档</h3>
              <p>支持拖拽上传，自动解析文档内容</p>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <h3>智能标注</h3>
              <p>AI识别重点，用户可手动调整标注</p>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <h3>生成题目</h3>
              <p>基于标注内容自动生成多种题型</p>
            </div>
            <div class="step">
              <div class="step-number">4</div>
              <h3>在线答题</h3>
              <p>完成答题并获得智能评分反馈</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 页脚 -->
    <el-footer class="footer">
      <div class="footer-content">
        <p>&copy; 2024 QuizOnly 智能出题平台. All rights reserved.</p>
      </div>
    </el-footer>
  </div>
</template>

<script setup lang="ts">
import { Upload, Edit, Document, Trophy } from '@element-plus/icons-vue'

const scrollToFeatures = () => {
  const element = document.getElementById('features')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 100%;
}

.logo h2 {
  color: #409eff;
  margin: 0;
}

.main-content {
  flex: 1;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 100px 20px;
  text-align: center;
}

.hero-title {
  font-size: 3rem;
  margin-bottom: 20px;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.features-section,
.process-section {
  padding: 80px 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 60px;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
}

.feature-card {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  color: #409eff;
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

.process-section {
  background: #f8f9fa;
}

.process-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
}

.step {
  text-align: center;
}

.step-number {
  width: 60px;
  height: 60px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 auto 20px;
}

.step h3 {
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: #333;
}

.step p {
  color: #666;
  line-height: 1.6;
}

.footer {
  background: #333;
  color: white;
  text-align: center;
  padding: 20px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .header-content {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }
}
</style>
