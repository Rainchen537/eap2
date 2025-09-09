# EAP2 部署指南

## 概述

EAP2 支持多种部署方式，推荐使用Docker进行生产环境部署。本文档详细介绍各种部署方案。

## 系统要求

### 最低配置
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / macOS / Windows

### 推荐配置
- **CPU**: 4核心
- **内存**: 8GB RAM
- **存储**: 50GB SSD
- **网络**: 100Mbps带宽

## 快速部署（推荐）

### 1. 使用部署脚本

```bash
# 克隆项目
git clone <repository-url>
cd eap2

# 运行一键部署脚本
./scripts/deploy.sh
```

脚本会自动：
- 检查Docker环境
- 创建环境变量文件
- 构建并启动所有服务
- 进行健康检查

### 2. 访问应用

部署完成后，访问以下地址：
- **前端应用**: http://localhost
- **API文档**: http://localhost:3000/api/docs
- **默认管理员**: admin@eap2.com / admin123

## Docker部署

### 1. 环境准备

```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量（重要！）
nano .env
```

**必须修改的变量**:
```bash
# 数据库密码
DB_PASSWORD=your-secure-password

# JWT密钥（生产环境必须修改）
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# AI API密钥
GEMINI_API_KEY=your-gemini-api-key
```

### 3. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 健康检查

```bash
# 检查后端健康状态
curl http://localhost:3000/api/health

# 检查前端健康状态
curl http://localhost/health
```

## 开发环境部署

### 1. 环境准备

```bash
# 安装Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 设置开发环境

```bash
# 运行开发环境设置脚本
./scripts/dev-setup.sh
```

### 3. 启动开发服务器

```bash
# 启动后端（终端1）
cd backend
npm run start:dev

# 启动前端（终端2）
cd frontend
npm run dev
```

### 4. 访问开发环境

- **前端**: http://localhost:5173
- **后端**: http://localhost:3000
- **API文档**: http://localhost:3000/api/docs
- **数据库管理**: http://localhost:8080

## 生产环境部署

### 1. 服务器配置

#### Ubuntu/Debian
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
```

#### CentOS/RHEL
```bash
# 更新系统
sudo yum update -y

# 安装必要软件
sudo yum install -y curl wget git nginx certbot python3-certbot-nginx

# 安装Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 2. 域名和SSL配置

```bash
# 配置Nginx反向代理
sudo nano /etc/nginx/sites-available/eap2

# 添加以下配置
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 启用站点
sudo ln -s /etc/nginx/sites-available/eap2 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 申请SSL证书
sudo certbot --nginx -d your-domain.com
```

### 3. 环境变量配置

```bash
# 生产环境变量
cat > .env << EOF
NODE_ENV=production

# 数据库配置
DB_HOST=mysql
DB_PASSWORD=your-very-secure-password
DB_DATABASE=eap2

# JWT密钥（必须修改）
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# 域名配置
CORS_ORIGIN=https://your-domain.com

# AI API密钥
GEMINI_API_KEY=your-gemini-api-key

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 支付配置
STRIPE_SECRET_KEY=your-stripe-secret-key
EOF
```

### 4. 部署和启动

```bash
# 拉取最新代码
git pull origin main

# 构建并启动服务
docker-compose -f docker-compose.yml up -d

# 设置自动启动
sudo systemctl enable docker
```

## 监控和维护

### 1. 日志管理

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# 日志轮转配置
sudo nano /etc/logrotate.d/docker-compose
```

### 2. 备份策略

```bash
# 数据库备份脚本
#!/bin/bash
BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker-compose exec mysql mysqldump -u root -p$DB_PASSWORD eap2 > $BACKUP_DIR/eap2_$DATE.sql

# 保留最近30天的备份
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
```

### 3. 更新部署

```bash
# 更新代码
git pull origin main

# 重新构建并部署
docker-compose down
docker-compose up --build -d

# 清理旧镜像
docker system prune -f
```

### 4. 性能监控

```bash
# 查看资源使用情况
docker stats

# 查看服务状态
docker-compose ps

# 数据库性能监控
docker-compose exec mysql mysql -u root -p -e "SHOW PROCESSLIST;"
```

## 故障排除

### 常见问题

#### 1. 服务启动失败
```bash
# 查看详细错误信息
docker-compose logs service-name

# 检查端口占用
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :80
```

#### 2. 数据库连接失败
```bash
# 检查数据库状态
docker-compose exec mysql mysql -u root -p -e "SELECT 1;"

# 重置数据库密码
docker-compose exec mysql mysql -u root -p -e "ALTER USER 'root'@'%' IDENTIFIED BY 'new_password';"
```

#### 3. 文件上传失败
```bash
# 检查uploads目录权限
ls -la uploads/
sudo chown -R 1001:1001 uploads/
```

#### 4. AI功能不可用
```bash
# 检查API密钥配置
docker-compose exec backend printenv | grep API_KEY

# 测试API连接
curl -H "Authorization: Bearer $GEMINI_API_KEY" https://generativelanguage.googleapis.com/v1/models
```

### 性能优化

#### 1. 数据库优化
```sql
-- 添加索引
CREATE INDEX idx_files_user_id ON files(userId);
CREATE INDEX idx_annotations_file_id ON annotations(fileId);
CREATE INDEX idx_quizzes_file_id ON quizzes(fileId);

-- 优化配置
SET innodb_buffer_pool_size = 1G;
SET max_connections = 200;
```

#### 2. 缓存配置
```bash
# Redis缓存配置
echo "maxmemory 512mb" >> redis.conf
echo "maxmemory-policy allkeys-lru" >> redis.conf
```

#### 3. Nginx优化
```nginx
# 启用Gzip压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# 静态文件缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 安全配置

### 1. 防火墙设置
```bash
# Ubuntu UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# CentOS firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. 安全加固
```bash
# 禁用root SSH登录
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# 设置fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 3. 定期更新
```bash
# 系统更新
sudo apt update && sudo apt upgrade -y

# Docker镜像更新
docker-compose pull
docker-compose up -d
```
