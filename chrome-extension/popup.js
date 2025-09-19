document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractBtn');
    const status = document.getElementById('status');
    const productInfo = document.getElementById('productInfo');
    const openCalculatorBtn = document.getElementById('openCalculator');
    const copyTitleBtn = document.getElementById('copyTitleBtn');
    const copyBulletBtn = document.getElementById('copyBulletBtn');
    const copyProductInfoBtn = document.getElementById('copyProductInfoBtn');
    const copyAllBtn = document.getElementById('copyAllBtn');
    
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
        
        // 显示五点描述
        const bulletPointsSection = document.getElementById('bulletPointsSection');
        const bulletPointsList = document.getElementById('bulletPointsList');
        
        if (data.bulletPoints && data.bulletPoints.length > 0) {
            bulletPointsList.innerHTML = '';
            data.bulletPoints.forEach(point => {
                const li = document.createElement('li');
                li.textContent = point;
                bulletPointsList.appendChild(li);
            });
            bulletPointsSection.style.display = 'block';
        } else {
            bulletPointsSection.style.display = 'none';
        }
        
        productInfo.style.display = 'block';
        openCalculatorBtn.style.display = 'block';
    }
    
    // 检查content script是否已加载
    async function checkContentScriptLoaded(tabId) {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    return {
                        loaded: !!window.amazonExtractorLoaded,
                        marker: !!document.getElementById('amazon-extractor-loaded'),
                        url: window.location.href
                    };
                }
            });
            return results[0]?.result;
        } catch (error) {
            console.log('检查content script失败:', error);
            return { loaded: false, marker: false, url: '' };
        }
    }
    
    // 测试连接函数
    async function testConnection(tabId) {
        try {
            const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            return response && response.success;
        } catch (error) {
            console.log('连接测试失败:', error);
            return false;
        }
    }
    
    // 注入content script函数
    async function injectContentScript(tabId) {
        try {
            console.log('正在注入content script...');
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            });
            // 等待脚本初始化
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Content script注入完成');
            return true;
        } catch (error) {
            console.log('注入脚本失败:', error);
            return false;
        }
    }
    
    // 强制重新注入content script
    async function forceInjectContentScript(tabId) {
        try {
            console.log('强制重新注入content script...');
            // 先清除可能存在的标识
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    window.amazonExtractorLoaded = false;
                    const marker = document.getElementById('amazon-extractor-loaded');
                    if (marker) marker.remove();
                }
            });
            
            // 重新注入
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            });
            
            // 等待更长时间确保初始化完成
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('强制注入完成');
            return true;
        } catch (error) {
            console.log('强制注入失败:', error);
            return false;
        }
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
            if (!tab.url.includes('amazon.')) {
                throw new Error('请在Amazon产品页面使用此扩展');
            }
            
            // 检查页面是否可以注入脚本
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
                throw new Error('无法在此类型的页面使用插件');
            }
            
            showStatus('正在检查插件状态...', 'info');
            
            // 检查content script是否已加载
            const scriptStatus = await checkContentScriptLoaded(tab.id);
            console.log('Script status:', scriptStatus);
            
            let isConnected = false;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (!isConnected && attempts < maxAttempts) {
                attempts++;
                showStatus(`正在尝试连接... (${attempts}/${maxAttempts})`, 'info');
                
                // 如果content script未加载，先注入
                if (!scriptStatus.loaded || !scriptStatus.marker) {
                    console.log('Content script未加载，正在注入...');
                    if (attempts === 1) {
                        await injectContentScript(tab.id);
                    } else {
                        await forceInjectContentScript(tab.id);
                    }
                }
                
                // 测试连接
                isConnected = await testConnection(tab.id);
                console.log(`连接测试 ${attempts}: ${isConnected ? '成功' : '失败'}`);
                
                if (!isConnected && attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            if (!isConnected) {
                throw new Error('无法建立连接。请尝试：\
1. 刷新页面\
2. 重新加载插件\
3. 确保在Amazon产品页面');
            }
            
            showStatus('连接成功，正在提取产品信息...', 'info');
            
            // 发送提取请求
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
    
    // 通用的消息发送函数
    async function sendMessageToTab(tabId, action, buttonElement, buttonText) {
        try {
            // 测试连接
            const isConnected = await testConnection(tabId);
            if (!isConnected) {
                throw new Error('无法连接到页面脚本，请刷新页面后重试');
            }
            
            const response = await chrome.tabs.sendMessage(tabId, { action: action });
            
            if (response.success) {
                showStatus(response.message, 'success');
            } else {
                throw new Error(response.message);
            }
            
        } catch (error) {
            console.error(`${action}失败:`, error);
            showStatus(error.message || '操作失败，请重试', 'error');
        } finally {
            if (buttonElement) {
                buttonElement.disabled = false;
                buttonElement.textContent = buttonText;
            }
        }
    }
    
    // 复制标题功能
    copyTitleBtn.addEventListener('click', async function() {
        copyTitleBtn.disabled = true;
        copyTitleBtn.textContent = '复制中...';
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('amazon.')) {
            showStatus('请在Amazon产品页面使用此功能', 'error');
            copyTitleBtn.disabled = false;
            copyTitleBtn.textContent = '复制标题';
            return;
        }
        
        await sendMessageToTab(tab.id, 'copyTitle', copyTitleBtn, '复制标题');
    });
    
    // 复制五点描述功能
    copyBulletBtn.addEventListener('click', async function() {
        copyBulletBtn.disabled = true;
        copyBulletBtn.textContent = '复制中...';
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('amazon.')) {
            showStatus('请在Amazon产品页面使用此功能', 'error');
            copyBulletBtn.disabled = false;
            copyBulletBtn.textContent = '复制五点描述';
            return;
        }
        
        await sendMessageToTab(tab.id, 'copyBulletPoints', copyBulletBtn, '复制五点描述');
    });

    // 复制产品信息功能（重量、尺寸、ASIN、链接、价格）
    copyProductInfoBtn.addEventListener('click', async function() {
        copyProductInfoBtn.disabled = true;
        copyProductInfoBtn.textContent = '复制中...';
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('amazon.')) {
            showStatus('请在Amazon产品页面使用此功能', 'error');
            copyProductInfoBtn.disabled = false;
            copyProductInfoBtn.textContent = '复制产品信息';
            return;
        }
        
        await sendMessageToTab(tab.id, 'copyProductInfo', copyProductInfoBtn, '复制产品信息');
    });

    // 复制全部信息功能（标题+五点描述+产品信息）
    copyAllBtn.addEventListener('click', async function() {
        copyAllBtn.disabled = true;
        copyAllBtn.textContent = '复制中...';
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('amazon.')) {
            showStatus('请在Amazon产品页面使用此功能', 'error');
            copyAllBtn.disabled = false;
            copyAllBtn.textContent = '一键复制全部';
            return;
        }
        
        await sendMessageToTab(tab.id, 'copyAllInfo', copyAllBtn, '一键复制全部');
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