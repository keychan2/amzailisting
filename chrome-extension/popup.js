document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractBtn');
    const status = document.getElementById('status');
    const productInfo = document.getElementById('productInfo');
    const openCalculatorBtn = document.getElementById('openCalculator');
    
    // 设置插件安装标识
    localStorage.setItem('amazonExtensionInstalled', 'true');
    
    // 显示状态消息
    function showStatus(message, type = 'info') {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        }
    }
    
    // 显示产品信息
    function showProductInfo(data) {
        document.getElementById('productTitle').textContent = data.title || '未找到';
        document.getElementById('productWeight').textContent = data.weight || '未找到';
        document.getElementById('productDimensions').textContent = data.dimensions || '未找到';
        document.getElementById('productAsin').textContent = data.asin || '未找到';
        
        productInfo.style.display = 'block';
        openCalculatorBtn.style.display = 'block';
    }
    
    // 提取产品信息
    extractBtn.addEventListener('click', async function() {
        extractBtn.disabled = true;
        extractBtn.textContent = '提取中...';
        showStatus('正在提取产品信息...', 'info');
        
        try {
            // 获取当前活动标签页
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // 检查是否在Amazon页面
            if (!tab.url.includes('amazon.com')) {
                throw new Error('请在Amazon.com产品页面使用此扩展');
            }
            
            // 发送消息到内容脚本
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProduct' });
            
            if (response.success) {
                showStatus(response.message, 'success');
                showProductInfo(response.data);
                
                // 存储数据供计算器使用
                await chrome.storage.local.set({ 
                    amazonProductData: response.data,
                    extractTime: Date.now()
                });
                
                // 同时存储到localStorage供网页访问
                localStorage.setItem('amazonProductData', JSON.stringify(response.data));
                localStorage.setItem('amazonExtensionInstalled', 'true');
                
            } else {
                throw new Error(response.message);
            }
            
        } catch (error) {
            console.error('提取失败:', error);
            showStatus(error.message || '提取失败，请重试', 'error');
        } finally {
            extractBtn.disabled = false;
            extractBtn.textContent = '提取产品信息';
        }
    });
    
    // 打开计算器
    openCalculatorBtn.addEventListener('click', async function() {
        try {
            // 获取存储的产品数据
            const result = await chrome.storage.local.get(['amazonProductData']);
            
            if (result.amazonProductData) {
                // 将数据存储到localStorage供网页访问
                localStorage.setItem('amazonProductData', JSON.stringify(result.amazonProductData));
            }
            
            // 直接跳转到amzailisting.com的利润计算器页面
            const calculatorUrl = 'https://amzailisting.com/amazon_profit_calculator.html';
            chrome.tabs.create({ url: calculatorUrl });
            window.close();
        } catch (error) {
            console.error('打开计算器失败:', error);
            showStatus('打开计算器失败', 'error');
        }
    });
    
    // 检查是否有之前提取的数据
    chrome.storage.local.get(['amazonProductData', 'extractTime'], function(result) {
        if (result.amazonProductData && result.extractTime) {
            // 如果数据是最近5分钟内的，显示它
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            if (result.extractTime > fiveMinutesAgo) {
                showProductInfo(result.amazonProductData);
                showStatus('显示最近提取的产品信息', 'info');
            }
        }
    });
});