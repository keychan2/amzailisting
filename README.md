# Amazon Listing Generator | 亚马逊商品描述生成器

一个智能的亚马逊商品描述生成工具，支持基础模式和高级模式，帮助卖家快速创建专业的商品listing。

## 🚀 功能特性

### 基础模式
- 快速生成商品标题和描述
- 支持多种商品类型
- 简单易用的界面

### 高级模式
- 智能提示词系统
- 针对不同商品类别的专业模板
- 详细的产品信息输入
- 目标用户分析
- 营销要素配置
- 动态提示词构建

### 其他功能
- 用户认证系统
- 历史记录管理
- 利润计算器
- Chrome扩展支持
- 响应式设计

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **样式**: 自定义CSS，响应式设计
- **部署**: Vercel
- **扩展**: Chrome Extension

## 📦 项目结构

```
├── index.html              # 主页面
├── auth.html              # 用户认证页面
├── history.html           # 历史记录页面
├── amazon_profit_calculator.html  # 利润计算器
├── auth.js                # 认证逻辑
├── chrome-extension/      # Chrome扩展文件
├── vercel.json           # Vercel部署配置
└── README.md             # 项目说明
```

## 🚀 快速开始

### 本地开发

1. 克隆项目
```bash
git clone <repository-url>
cd amzailisting
```

2. 启动本地服务器
```bash
# 使用Python
python3 -m http.server 8080

# 或使用Node.js
npx http-server -p 8080
```

3. 访问 `http://localhost:8080`

### Vercel部署

1. 连接GitHub仓库到Vercel
2. 自动部署，无需额外配置
3. 支持自定义域名

## 🎯 使用说明

### 基础模式
1. 选择商品类型
2. 输入基本信息
3. 点击生成获取结果

### 高级模式
1. 切换到高级模式
2. 填写详细的产品信息
3. 配置目标用户和营销要素
4. 系统自动生成优化的提示词
5. 获取专业的商品描述

## 🔧 配置说明

### 环境变量
- 无需特殊环境变量配置
- 纯前端应用，开箱即用

### 安全配置
- 已配置安全头信息
- XSS保护
- 内容类型保护
- 框架保护

## 📱 Chrome扩展

项目包含Chrome扩展，支持：
- 直接在亚马逊页面使用
- 快速提取商品信息
- 一键生成描述

安装方法请参考 `chrome-extension/` 目录下的说明文档。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目。

## 📄 许可证

本项目采用MIT许可证。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交Issue
- 发送邮件

---

**注意**: 本工具仅用于辅助生成商品描述，最终内容请根据实际情况调整。