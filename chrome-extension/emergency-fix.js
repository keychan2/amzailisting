// 紧急修复脚本 - 当插件无法正常工作时使用
// 在Amazon产品页面的控制台中运行此脚本

console.log('🚨 Amazon插件紧急修复脚本启动');

// 1. 清理可能的冲突
function cleanupConflicts() {
    console.log('清理可能的冲突...');
    
    // 移除可能存在的旧标识
    const oldMarkers = document.querySelectorAll('[id*="amazon-extractor"], [class*="amazon-extractor"]');
    oldMarkers.forEach(marker => marker.remove());
    
    // 清理全局变量
    delete window.amazonExtractorLoaded;
    delete window.AmazonProductExtractor;
    
    console.log('✅ 冲突清理完成');
}

// 2. 手动创建产品提取器
function createManualExtractor() {
    console.log('创建手动产品提取器...');
    
    window.ManualAmazonExtractor = {
        // 提取标题
        getTitle: function() {
            const selectors = [
                '#productTitle',
                '.product-title',
                'h1[data-automation-id="product-title"]',
                '.a-size-large.product-title-word-break'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    return element.textContent.trim();
                }
            }
            return null;
        },
        
        // 提取ASIN
        getASIN: function() {
            const urlMatch = window.location.href.match(/\/dp\/([A-Z0-9]{10})/);
            if (urlMatch) return urlMatch[1];
            
            const asinElement = document.querySelector('[data-asin]');
            if (asinElement) return asinElement.getAttribute('data-asin');
            
            return null;
        },
        
        // 提取五点描述
        getBulletPoints: function() {
            const bulletPoints = [];
            const selectors = [
                '#feature-bullets ul li:not(.aok-hidden) span.a-list-item',
                '#feature-bullets ul li span.a-list-item',
                '.a-unordered-list.a-nostyle.a-vertical.a-spacing-none.detail-bullet-list li span.a-list-item'
            ];
            
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    elements.forEach((element) => {
                        const text = element.textContent.trim();
                        if (text && text.length > 10 && bulletPoints.length < 5) {
                            bulletPoints.push(text);
                        }
                    });
                    if (bulletPoints.length > 0) break;
                }
            }
            
            return bulletPoints;
        },
        
        // 提取价格
        getPrice: function() {
            const priceSelectors = [
                '.a-price-whole',
                '.a-price .a-offscreen',
                '#priceblock_dealprice',
                '#priceblock_ourprice'
            ];

            for (const selector of priceSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    return element.textContent.trim();
                }
            }
            return null;
        },
        
        // 复制到剪贴板
        copyToClipboard: async function(text) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return success;
            }
        },
        
        // 获取所有信息
        getAllInfo: function() {
            return {
                title: this.getTitle(),
                asin: this.getASIN(),
                bulletPoints: this.getBulletPoints(),
                price: this.getPrice(),
                url: window.location.href
            };
        }
    };
    
    console.log('✅ 手动提取器创建完成');
}

// 3. 创建临时UI
function createEmergencyUI() {
    console.log('创建紧急UI...');
    
    // 移除可能存在的旧UI
    const oldUI = document.getElementById('emergency-amazon-extractor');
    if (oldUI) oldUI.remove();
    
    const ui = document.createElement('div');
    ui.id = 'emergency-amazon-extractor';
    ui.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        background: white;
        border: 2px solid #ff9900;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    
    ui.innerHTML = `
        <div style="background: #ff9900; color: white; padding: 8px; margin: -15px -15px 10px -15px; border-radius: 6px 6px 0 0;">
            <strong>🚨 Amazon插件紧急模式</strong>
            <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
        </div>
        <div id="emergency-status" style="margin-bottom: 10px; padding: 8px; background: #f0f0f0; border-radius: 4px;">
            准备就绪
        </div>
        <button onclick="emergencyExtract()" style="width: 100%; padding: 10px; background: #ff9900; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 8px;">
            提取产品信息
        </button>
        <button onclick="emergencyCopyAll()" style="width: 100%; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
            复制所有信息
        </button>
    `;
    
    document.body.appendChild(ui);
    console.log('✅ 紧急UI创建完成');
}

// 4. 紧急提取函数
window.emergencyExtract = function() {
    const status = document.getElementById('emergency-status');
    status.textContent = '正在提取...';
    status.style.background = '#fff3cd';
    
    try {
        const info = window.ManualAmazonExtractor.getAllInfo();
        console.log('提取的信息:', info);
        
        let result = '=== Amazon产品信息 ===\n';
        if (info.title) result += `标题: ${info.title}\n`;
        if (info.price) result += `价格: ${info.price}\n`;
        if (info.asin) result += `ASIN: ${info.asin}\n`;
        if (info.bulletPoints.length > 0) {
            result += '\n五点描述:\n';
            info.bulletPoints.forEach((point, index) => {
                result += `${index + 1}. ${point}\n`;
            });
        }
        result += `\n链接: ${info.url}`;
        
        // 存储到全局变量供复制使用
        window.emergencyExtractedData = result;
        
        status.textContent = '提取成功！';
        status.style.background = '#d4edda';
        
        // 显示提取结果
        console.log('提取结果:\n', result);
        
    } catch (error) {
        console.error('提取失败:', error);
        status.textContent = '提取失败: ' + error.message;
        status.style.background = '#f8d7da';
    }
};

// 5. 紧急复制函数
window.emergencyCopyAll = async function() {
    const status = document.getElementById('emergency-status');
    
    if (!window.emergencyExtractedData) {
        status.textContent = '请先提取产品信息';
        status.style.background = '#fff3cd';
        return;
    }
    
    try {
        const success = await window.ManualAmazonExtractor.copyToClipboard(window.emergencyExtractedData);
        if (success) {
            status.textContent = '复制成功！';
            status.style.background = '#d4edda';
        } else {
            throw new Error('复制失败');
        }
    } catch (error) {
        console.error('复制失败:', error);
        status.textContent = '复制失败，请手动复制控制台中的内容';
        status.style.background = '#f8d7da';
    }
};

// 执行修复流程
function runEmergencyFix() {
    console.log('开始紧急修复流程...');
    
    cleanupConflicts();
    createManualExtractor();
    createEmergencyUI();
    
    console.log('🎉 紧急修复完成！');
    console.log('现在可以使用右上角的紧急UI来提取产品信息');
    console.log('或者直接调用: window.ManualAmazonExtractor.getAllInfo()');
}

// 自动运行
runEmergencyFix();