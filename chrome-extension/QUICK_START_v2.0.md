# Amazon产品信息提取器 v2.0 快速使用指南

## 🚀 快速开始

### 1. 安装插件
1. 打开Chrome浏览器
2. 进入扩展程序管理页面 (`chrome://extensions/`)
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择插件文件夹

### 2. 使用插件
1. **访问Amazon产品页面** - 打开任意Amazon.com产品详情页
2. **点击插件图标** - 在浏览器工具栏点击插件图标
3. **提取信息** - 点击"提取产品信息"按钮
4. **选择复制** - 根据需要选择相应的复制功能

## 🎯 核心功能

### 📋 单独复制功能
| 按钮 | 功能 | 说明 |
|------|------|------|
| 复制标题 | 复制产品标题 | 获取完整的产品名称 |
| 复制五点描述 | 复制产品特性 | 格式化的产品要点列表 |
| 复制重量 | 复制重量信息 | 产品重量（自动单位转换） |
| 复制尺寸 | 复制尺寸信息 | 产品尺寸（长×宽×高） |
| 复制价格 | 复制当前价格 | 实时获取产品价格 |
| 复制ASIN | 复制产品ASIN | Amazon标准识别号 |
| 复制链接 | 复制产品链接 | 当前页面完整URL |
| **一键复制全部** | 复制所有信息 | 格式化的完整产品信息 |

### 🔄 工作流程
```
访问Amazon产品页 → 点击插件图标 → 提取产品信息 → 选择复制功能
```

## 💡 使用技巧

### 最佳实践
1. **先提取再复制** - 建议先点击"提取产品信息"获取完整数据
2. **按需复制** - 根据实际需要选择特定信息复制
3. **批量处理** - 使用"一键复制全部"获取完整信息
4. **格式化输出** - 复制的信息已经格式化，可直接使用

### 快捷操作
- **快速获取ASIN** - 直接点击"复制ASIN"，无需先提取
- **快速获取链接** - 直接点击"复制链接"，无需先提取
- **快速获取价格** - 直接点击"复制价格"，实时获取

## 🎨 界面说明

### 按钮布局
```
[提取产品信息] (主要功能按钮)

产品信息显示区域

[复制标题] [复制五点描述]
[复制重量] [复制尺寸]
[复制价格] [复制ASIN]
[复制链接] [一键复制全部] (绿色突出)
```

### 状态提示
- 🟢 **绿色提示** - 操作成功
- 🔴 **红色提示** - 操作失败或错误
- 🔵 **蓝色提示** - 信息提示

## 📝 复制格式示例

### 标题复制
```
ASUS ROG Strix G15 Gaming Laptop, 15.6" 144Hz IPS Display...
```

### 五点描述复制
```
1. AMD Ryzen 7 4800H Processor (8-core, 16-thread, up to 4.2 GHz max boost)
2. NVIDIA GeForce RTX 3060 6GB GDDR6 graphics (ROG Boost up to 1752MHz)
3. 15.6" 144Hz IPS-Type Full HD display with 3ms response time
4. 16GB DDR4-3200 RAM and 1TB PCIe NVMe M.2 SSD storage
5. ROG Intelligent Cooling thermal system with liquid metal compound
```

### 一键复制全部格式
```
标题: ASUS ROG Strix G15 Gaming Laptop...
价格: $1,299.99

五点描述:
1. AMD Ryzen 7 4800H Processor...
2. NVIDIA GeForce RTX 3060 6GB...
3. 15.6" 144Hz IPS-Type Full HD...
4. 16GB DDR4-3200 RAM...
5. ROG Intelligent Cooling...

重量: 5.07 pounds
尺寸: 14.2 x 10.8 x 1.03 inches
ASIN: B08SJLMQPX
链接: https://www.amazon.com/dp/B08SJLMQPX
```

## ⚠️ 注意事项

### 使用要求
- ✅ 必须在Amazon.com产品详情页使用
- ✅ 需要Chrome浏览器（推荐）或Edge浏览器
- ✅ 确保插件已正确安装并启用

### 常见问题
1. **"Could not establish connection"** - 刷新页面后重试
2. **"未找到产品信息"** - 确保在产品详情页面，不是列表页
3. **"复制失败"** - 检查浏览器剪贴板权限

### 故障排除
如遇到问题，请查看 `TROUBLESHOOTING.md` 文件获取详细解决方案。

## 🔧 高级功能

### 调试模式
1. 按F12打开开发者工具
2. 查看Console标签页
3. 查找以"Amazon产品提取器"开头的日志信息

### 测试连接
在产品页面控制台运行：
```javascript
// 加载测试脚本
const script = document.createElement('script');
script.src = chrome.runtime.getURL('test-connection.js');
document.head.appendChild(script);
```

## 📞 支持与反馈

如果您在使用过程中遇到任何问题或有改进建议，请：
1. 查看故障排除指南
2. 检查更新日志
3. 联系开发者反馈问题

---

**版本**: v2.0.0  
**更新日期**: 2025年1月10日  
**兼容性**: Chrome 88+, Edge 88+