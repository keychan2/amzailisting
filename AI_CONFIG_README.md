# AI助手配置说明

## Git配置

### 问题背景
在macOS系统中，由于Xcode命令行工具的问题，系统默认的git命令会出现以下错误：
```
xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools)
```

### 解决方案
使用Homebrew安装的Git来替代系统默认的git：

```bash
# 安装Homebrew Git（如果尚未安装）
brew install git

# 验证安装
/opt/homebrew/bin/git --version
```

### AI助手使用指南

#### 1. Git操作命令
AI助手在执行git操作时，应始终使用以下完整路径：

```bash
# 检查状态
/opt/homebrew/bin/git status

# 添加文件
/opt/homebrew/bin/git add .

# 提交更改
/opt/homebrew/bin/git commit -m "提交信息"

# 推送到远程仓库
/opt/homebrew/bin/git push origin main

# 拉取更新
/opt/homebrew/bin/git pull origin main
```

#### 2. 配置文件位置
- **主配置文件**: `.ai-config.json`
- **说明文档**: `AI_CONFIG_README.md`

#### 3. 验证步骤
在执行git操作前，AI助手应：
1. 检查 `/opt/homebrew/bin/git` 是否存在
2. 如果不存在，检查其他可能的安装位置
3. 确认git命令可以正常执行

#### 4. 备用方案
如果Homebrew git不可用，按以下顺序尝试：
1. `/usr/local/bin/git`
2. `which git` 查找其他安装位置
3. 提示用户安装或修复git

### 开发服务器配置
- **启动命令**: `node dev-server.js`
- **端口**: 8080
- **访问地址**: http://localhost:8080

### 注意事项
1. 这个配置是为了解决特定的系统环境问题
2. 在其他系统上可能不需要使用完整路径
3. 定期检查Homebrew git的更新：`brew upgrade git`

### 更新日志
- 2025-01-25: 创建初始配置，解决xcrun错误问题