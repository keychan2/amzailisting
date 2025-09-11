# Chrome插件故障排除指南

## 常见问题解决方案

### 1. "Could not establish connection. Receiving end does not exist" 错误

这个错误通常表示content script没有正确加载。请按以下步骤解决：

#### 解决步骤：
1. **首次使用或偶发错误（v2.0优化）**
   - 点击插件图标，直接点击"提取产品信息"
   - 如果提示"插件正在初始化"，等待2-3秒后重试
   - **通常无需刷新页面**

2. **持续连接问题**
   - 重新加载插件：打开 `chrome://extensions/` → 找到插件 → 点击刷新按钮（🔄）
   - 如果仍有问题，刷新Amazon页面

3. **检查页面URL**
   - 确保在Amazon.com域名下
   - 确保是产品详情页面（URL包含/dp/）

4. **使用测试脚本（推荐）**
   - 按F12打开开发者工具
   - 在Console标签页粘贴并运行test-connection.js中的测试脚本
   - 查看详细的诊断信息和解决建议

### 2. 插件安装步骤

1. **启用开发者模式**
   ```
   1. 打开Chrome浏览器
   2. 访问 chrome://extensions/
   3. 打开右上角的"开发者模式"开关
   ```

2. **加载插件**
   ```
   1. 点击"加载已解压的扩展程序"
   2. 选择chrome-extension文件夹
   3. 确认插件出现在扩展列表中
   ```

3. **验证安装**
   ```
   1. 访问任意Amazon产品页面
   2. 点击浏览器工具栏中的插件图标
   3. 应该看到插件弹窗界面
   ```

### 3. 功能测试

#### 测试基本提取功能：
1. 访问Amazon产品页面（例如：https://www.amazon.com/dp/B08N5WRWNW）
2. 点击插件图标
3. 点击"提取产品信息"
4. 检查是否显示：
   - 产品标题
   - 重量信息
   - 尺寸信息
   - ASIN
   - 五点描述

#### 测试复制功能：
1. 提取产品信息后
2. 点击"复制标题"按钮
3. 在任意文本编辑器中粘贴（Ctrl+V）
4. 点击"复制五点描述"按钮
5. 粘贴验证格式是否正确

### 4. 调试信息

如果问题仍然存在，请检查以下调试信息：

#### 在Amazon页面打开控制台（F12）：
```javascript
// 检查content script是否加载
console.log('Content script loaded:', typeof AmazonProductExtractor !== 'undefined');

// 手动测试提取功能
if (typeof AmazonProductExtractor !== 'undefined') {
    const extractor = new AmazonProductExtractor();
    const data = extractor.extractProductInfo();
    console.log('提取结果:', data);
}
```

#### 检查插件权限：
1. 访问 `chrome://extensions/`
2. 找到插件，点击"详细信息"
3. 确认"网站访问权限"包含Amazon.com

### 5. 支持的Amazon页面格式

插件支持以下Amazon页面：
- 标准产品页面：`https://www.amazon.com/dp/XXXXXXXXXX`
- 产品页面变体：`https://www.amazon.com/gp/product/XXXXXXXXXX`
- 带参数的产品页面：`https://www.amazon.com/product-name/dp/XXXXXXXXXX`

### 6. 浏览器兼容性

- Chrome 88+
- Microsoft Edge 88+
- 其他基于Chromium的浏览器

### 7. 常见问题FAQ

**Q: 每次使用都需要刷新页面吗？**
A: **不需要！** v2.0版本已优化，正常情况下无需刷新页面。如果首次使用提示连接错误，等待几秒重试即可。

**Q: 为什么有些产品信息提取不到？**
A: Amazon页面结构可能有变化，插件会尝试多种选择器。如果仍然无法提取，可以使用测试脚本诊断问题。

**Q: 复制功能不工作怎么办？**
A: 确保浏览器允许访问剪贴板。在某些情况下，可能需要手动授权剪贴板权限。

**Q: 插件图标不显示怎么办？**
A: 检查插件是否正确安装，并确保在支持的Amazon页面上。

**Q: 如何快速测试插件是否正常工作？**
A: 在Amazon产品页面按F12，在控制台中运行test-connection.js中的测试脚本，获取详细诊断信息。

如果以上方法都无法解决问题，请提供以下信息：
- Chrome版本
- 操作系统
- 具体的Amazon产品页面URL
- 控制台错误信息截图