// Amazon产品信息提取脚本 v2.0
// 新功能：五点描述提取、多种单独复制功能
class AmazonProductExtractor {
    constructor() {
        this.productData = {
            title: '',
            bulletPoints: [],
            weight: '',
            dimensions: '',
            length: 0,
            width: 0,
            height: 0,
            weightKg: 0,
            asin: '',
            url: window.location.href
        };
    }

    // 提取产品标题
    extractTitle() {
        const selectors = [
            '#productTitle',
            '.product-title',
            'h1[data-automation-id="product-title"]',
            '.a-size-large.product-title-word-break'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                this.productData.title = element.textContent.trim();
                return true;
            }
        }
        return false;
    }

    // 提取五点描述
    extractBulletPoints() {
        const bulletPoints = [];
        
        // 尝试多种选择器来获取五点描述
        const selectors = [
            '#feature-bullets ul li:not(.aok-hidden) span.a-list-item',
            '#feature-bullets ul li span.a-list-item',
            '.a-unordered-list.a-nostyle.a-vertical.a-spacing-none.detail-bullet-list li span.a-list-item',
            '.a-unordered-list.a-vertical li span.a-list-item',
            '[data-feature-name="featurebullets"] .a-list-item',
            '#featurebullets_feature_div ul li span'
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                elements.forEach((element) => {
                    const text = element.textContent.trim();
                    // 过滤掉空文本和"查看更多"等无用信息
                    if (text && 
                        text.length > 10 && 
                        !text.includes('查看更多') && 
                        !text.includes('See more') &&
                        !text.includes('›') &&
                        !text.includes('Make sure') &&
                        !text.includes('确保') &&
                        bulletPoints.length < 5) {
                        bulletPoints.push(text);
                    }
                });
                
                if (bulletPoints.length > 0) {
                    break; // 找到有效的五点描述就停止
                }
            }
        }
        
        // 如果上面的方法没找到，尝试从产品描述区域提取
        if (bulletPoints.length === 0) {
            const descriptionSelectors = [
                '#productDescription p',
                '.product-description p',
                '.aplus-v2 p'
            ];
            
            for (const selector of descriptionSelectors) {
                const elements = document.querySelectorAll(selector);
                elements.forEach((element) => {
                    const text = element.textContent.trim();
                    if (text && text.length > 20 && bulletPoints.length < 5) {
                        bulletPoints.push(text);
                    }
                });
                
                if (bulletPoints.length > 0) {
                    break;
                }
            }
        }
        
        this.productData.bulletPoints = bulletPoints;
        return bulletPoints.length > 0;
    }

    // 提取价格信息
    extractPrice() {
        const priceSelectors = [
            '.a-price-whole',
            '.a-price .a-offscreen',
            '#priceblock_dealprice',
            '#priceblock_ourprice',
            '.a-price-range .a-price .a-offscreen',
            '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
            '.a-price.a-text-price.a-size-base .a-offscreen'
        ];

        for (const selector of priceSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                const price = element.textContent.trim();
                return price;
            }
        }
        return null;
    }

    // 复制文本到剪贴板
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    }

    // 复制标题
    async copyTitle() {
        if (this.productData.title) {
            const success = await this.copyToClipboard(this.productData.title);
            return {
                success,
                message: success ? '标题已复制到剪贴板！' : '复制失败，请手动复制。',
                data: this.productData.title
            };
        }
        return {
            success: false,
            message: '未找到标题信息。'
        };
    }

    // 复制五点描述
    async copyBulletPoints() {
        if (this.productData.bulletPoints && this.productData.bulletPoints.length > 0) {
            const bulletText = this.productData.bulletPoints
                .map((point, index) => `${index + 1}. ${point}`)
                .join('\n');
            
            const success = await this.copyToClipboard(bulletText);
            return {
                success,
                message: success ? '五点描述已复制到剪贴板！' : '复制失败，请手动复制。',
                data: bulletText
            };
        }
        return {
            success: false,
            message: '未找到五点描述信息。'
        };
    }

    // 复制重量信息
    async copyWeight() {
        if (this.productData.weight) {
            const success = await this.copyToClipboard(this.productData.weight);
            return {
                success,
                message: success ? '重量信息已复制到剪贴板！' : '复制失败，请手动复制。',
                data: this.productData.weight
            };
        }
        return {
            success: false,
            message: '未找到重量信息。'
        };
    }

    // 复制尺寸信息
    async copyDimensions() {
        if (this.productData.dimensions) {
            const success = await this.copyToClipboard(this.productData.dimensions);
            return {
                success,
                message: success ? '尺寸信息已复制到剪贴板！' : '复制失败，请手动复制。',
                data: this.productData.dimensions
            };
        }
        return {
            success: false,
            message: '未找到尺寸信息。'
        };
    }

    // 复制产品链接
    async copyUrl() {
        const url = window.location.href;
        const success = await this.copyToClipboard(url);
        return {
            success,
            message: success ? '产品链接已复制到剪贴板！' : '复制失败，请手动复制。',
            data: url
        };
    }

    // 复制ASIN
    async copyAsin() {
        if (this.productData.asin) {
            const success = await this.copyToClipboard(this.productData.asin);
            return {
                success,
                message: success ? 'ASIN已复制到剪贴板！' : '复制失败，请手动复制。',
                data: this.productData.asin
            };
        }
        return {
            success: false,
            message: '未找到ASIN信息。'
        };
    }

    // 复制价格信息
    async copyPrice() {
        const price = this.extractPrice();
        if (price) {
            const success = await this.copyToClipboard(price);
            return {
                success,
                message: success ? '价格信息已复制到剪贴板！' : '复制失败，请手动复制。',
                data: price
            };
        }
        return {
            success: false,
            message: '未找到价格信息。'
        };
    }

    // 复制产品信息（重量、尺寸、ASIN、链接、价格）
    async copyProductInfo() {
        // 先提取所有信息
        this.extractProductInfo();
        const price = this.extractPrice();
        
        const infoLines = [];
        
        if (price) {
            infoLines.push(`价格: ${price}`);
        }
        
        if (this.productData.weight) {
            infoLines.push(`重量: ${this.productData.weight}`);
        }
        
        if (this.productData.dimensions) {
            infoLines.push(`尺寸: ${this.productData.dimensions}`);
        }
        
        if (this.productData.asin) {
            infoLines.push(`ASIN: ${this.productData.asin}`);
        }
        
        infoLines.push(`链接: ${window.location.href}`);
        
        const productInfo = infoLines.join('\n');
        
        if (productInfo.trim()) {
            const success = await this.copyToClipboard(productInfo);
            return {
                success,
                message: success ? '产品信息已复制到剪贴板！' : '复制失败，请手动复制。',
                data: productInfo
            };
        }
        
        return {
            success: false,
            message: '未找到产品信息。'
        };
    }

    // 复制全部信息（标题+五点描述+产品信息）
    async copyAllInfo() {
        // 先提取所有信息
        this.extractProductInfo();
        const price = this.extractPrice();
        
        const infoLines = [];
        
        if (this.productData.title) {
            infoLines.push(`标题: ${this.productData.title}`);
        }
        
        if (price) {
            infoLines.push(`价格: ${price}`);
        }
        
        if (this.productData.bulletPoints && this.productData.bulletPoints.length > 0) {
            infoLines.push('');
            infoLines.push('五点描述:');
            this.productData.bulletPoints.forEach((point, index) => {
                infoLines.push(`${index + 1}. ${point}`);
            });
        }
        
        if (this.productData.weight) {
            infoLines.push('');
            infoLines.push(`重量: ${this.productData.weight}`);
        }
        
        if (this.productData.dimensions) {
            infoLines.push(`尺寸: ${this.productData.dimensions}`);
        }
        
        if (this.productData.asin) {
            infoLines.push(`ASIN: ${this.productData.asin}`);
        }
        
        infoLines.push(`链接: ${window.location.href}`);
        
        const allInfo = infoLines.join('\n');
        
        if (allInfo.trim()) {
            const success = await this.copyToClipboard(allInfo);
            return {
                success,
                message: success ? '所有产品信息已复制到剪贴板！' : '复制失败，请手动复制。',
                data: allInfo
            };
        }
        
        return {
            success: false,
            message: '未找到足够的产品信息。'
        };
    }

    // 提取ASIN
    extractASIN() {
        // 从URL提取
        const urlMatch = window.location.href.match(/\/dp\/([A-Z0-9]{10})/);
        if (urlMatch) {
            this.productData.asin = urlMatch[1];
            return true;
        }
        
        // 从页面元素提取
        const asinElement = document.querySelector('[data-asin]');
        if (asinElement) {
            this.productData.asin = asinElement.getAttribute('data-asin');
            return true;
        }
        
        return false;
    }

    // 从详细信息区域提取
    extractFromDetailBullets() {
        const detailList = document.querySelector('#detailBullets_feature_div ul');
        if (!detailList) return false;

        let found = false;
        const listItems = detailList.querySelectorAll('li');
        
        listItems.forEach((li) => {
            const boldSpan = li.querySelector('span.a-text-bold');
            if (boldSpan) {
                const label = boldSpan.textContent.trim().toLowerCase();
                const valueSpan = boldSpan.parentElement.querySelectorAll('span')[1];
                if (!valueSpan) return;

                const value = valueSpan.textContent.trim();

                if (label.includes('product dimensions') || label.includes('dimensions')) {
                    this.productData.dimensions = value;
                    this.parseDimensions(value);
                    found = true;
                }
                if (label.includes('item weight') || label.includes('weight')) {
                    this.productData.weight = value;
                    this.parseWeight(value);
                    found = true;
                }
            }
        });

        return found;
    }

    // 从技术详情表格提取
    extractFromTechDetails() {
        const tables = document.querySelectorAll('table');
        let found = false;
        
        tables.forEach((table) => {
            const rows = table.querySelectorAll('tr');
            rows.forEach((row) => {
                const cells = row.querySelectorAll('td, th');
                if (cells.length >= 2) {
                    const label = cells[0].textContent.trim().toLowerCase();
                    const value = cells[1].textContent.trim();
                    
                    if ((label.includes('dimensions') || label.includes('size')) && !this.productData.dimensions) {
                        this.productData.dimensions = value;
                        this.parseDimensions(value);
                        found = true;
                    }
                    if (label.includes('weight') && !this.productData.weight) {
                        this.productData.weight = value;
                        this.parseWeight(value);
                        found = true;
                    }
                }
            });
        });
        
        return found;
    }

    // 从产品特性区域提取
    extractFromFeatures() {
        const featureSelectors = [
            '#feature-bullets ul li',
            '.a-unordered-list .a-list-item',
            '[data-feature-name] .a-list-item'
        ];
        
        let found = false;
        featureSelectors.forEach((selector) => {
            const items = document.querySelectorAll(selector);
            items.forEach((item) => {
                const text = item.textContent.toLowerCase();
                const fullText = item.textContent;
                
                if ((text.includes('dimensions') || text.includes('size')) && !this.productData.dimensions) {
                    this.productData.dimensions = fullText;
                    this.parseDimensions(fullText);
                    found = true;
                }
                if (text.includes('weight') && !this.productData.weight) {
                    this.productData.weight = fullText;
                    this.parseWeight(fullText);
                    found = true;
                }
            });
        });
        
        return found;
    }

    // 解析尺寸字符串
    parseDimensions(dimensionsStr) {
        if (!dimensionsStr) return false;
        
        // 支持多种格式的尺寸解析
        const patterns = [
            /(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)\s*(inches?|in|cm|centimeters?)/i,
            /(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)/i,
            /(\d+\.?\d*)\s*"\s*[x×]\s*(\d+\.?\d*)\s*"\s*[x×]\s*(\d+\.?\d*)\s*"/i
        ];
        
        for (const pattern of patterns) {
            const match = dimensionsStr.match(pattern);
            if (match) {
                let l = parseFloat(match[1]);
                let w = parseFloat(match[2]);
                let h = parseFloat(match[3]);
                
                // 单位转换 - 如果是英寸转换为厘米
                if (match[4] && (match[4].toLowerCase().includes('inch') || match[4].toLowerCase().includes('in') || match[4] === '"')) {
                    l *= 2.54;
                    w *= 2.54;
                    h *= 2.54;
                }
                
                // 按大小排序 (长、宽、高)
                const dims = [l, w, h].sort((a, b) => b - a);
                this.productData.length = dims[0];
                this.productData.width = dims[1];
                this.productData.height = dims[2];
                
                return true;
            }
        }
        
        return false;
    }

    // 解析重量字符串
    parseWeight(weightStr) {
        if (!weightStr) return false;
        
        const weightMatch = weightStr.match(/(\d+\.?\d*)\s*(pounds?|lbs?|ounces?|oz|kg|kilograms?|g|grams?)/i);
        if (weightMatch) {
            let weight = parseFloat(weightMatch[1]);
            const unit = weightMatch[2].toLowerCase();
            
            // 转换为千克
            if (unit.includes('pound') || unit.includes('lb')) {
                weight *= 0.453592;
            } else if (unit.includes('ounce') || unit.includes('oz')) {
                weight *= 0.0283495;
            } else if (unit.includes('g') && !unit.includes('kg')) {
                weight /= 1000;
            }
            // kg 不需要转换
            
            this.productData.weightKg = weight;
            return true;
        }
        
        return false;
    }

    // 主提取方法
    extractProductInfo() {
        console.log('开始提取Amazon产品信息...');
        
        // 提取基本信息
        this.extractTitle();
        this.extractASIN();
        this.extractBulletPoints();
        
        // 尝试多种方法提取尺寸和重量
        let found = false;
        found = this.extractFromDetailBullets() || found;
        found = this.extractFromTechDetails() || found;
        found = this.extractFromFeatures() || found;
        
        console.log('提取结果:', this.productData);
        return this.productData;
    }

    // 发送数据到计算器页面
    sendToCalculator() {
        // 存储到localStorage，供其他页面使用
        localStorage.setItem('amazonProductData', JSON.stringify(this.productData));
        
        // 如果计算器页面已打开，直接发送消息
        try {
            chrome.runtime.sendMessage({
                action: 'sendToCalculator',
                data: this.productData
            });
        } catch (error) {
            console.log('发送消息失败:', error);
        }
        
        return this.productData;
    }
}

// 防止重复注入
if (window.amazonExtractorLoaded) {
    console.log('Content script already loaded, skipping...');
} else {
    // 添加调试信息和连接测试
    console.log('Amazon产品提取器content script已加载');
    console.log('当前页面URL:', window.location.href);
    console.log('文档状态:', document.readyState);
    console.log('Chrome runtime可用:', !!chrome.runtime);

    // 设置全局标识，表示content script已加载
    window.amazonExtractorLoaded = true;
    
    // 在页面上添加一个隐藏的标识元素
    const marker = document.createElement('div');
    marker.id = 'amazon-extractor-loaded';
    marker.style.display = 'none';
    marker.setAttribute('data-version', '2.0.1');
    document.body.appendChild(marker);

    // 直接设置消息监听器，不依赖DOM状态
    console.log('设置消息监听器...');

    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('收到消息:', request);
        
        // 立即发送确认响应，防止连接超时
        if (request.action === 'ping') {
            sendResponse({ success: true, message: 'Content script已连接' });
            return true;
        }
        
        try {
            const extractor = new AmazonProductExtractor();
            
            if (request.action === 'extractProduct') {
                const productData = extractor.extractProductInfo();
                
                if (productData.title || productData.weight || productData.dimensions || productData.bulletPoints.length > 0) {
                    extractor.sendToCalculator();
                    sendResponse({
                        success: true,
                        data: productData,
                        message: '成功提取产品信息！'
                    });
                } else {
                    sendResponse({
                        success: false,
                        message: '未找到产品信息，请确保在Amazon产品页面上。'
                    });
                }
                return true;
                
            } else if (request.action === 'copyTitle') {
                extractor.extractProductInfo();
                extractor.copyTitle().then((result) => {
                    sendResponse(result);
                }).catch((error) => {
                    sendResponse({
                        success: false,
                        message: '复制失败: ' + error.message
                    });
                });
                return true;
                
            } else if (request.action === 'copyBulletPoints') {
                extractor.extractProductInfo();
                extractor.copyBulletPoints().then((result) => {
                    sendResponse(result);
                }).catch((error) => {
                    sendResponse({
                        success: false,
                        message: '复制失败: ' + error.message
                    });
                });
                return true;
                
            } else if (request.action === 'copyWeight') {
                extractor.extractProductInfo();
                extractor.copyWeight().then((result) => {
                    sendResponse(result);
                }).catch((error) => {
                    sendResponse({
                        success: false,
                        message: '复制失败: ' + error.message
                    });
                });
                return true;
                
            } else if (request.action === 'copyDimensions') {
                extractor.extractProductInfo();
                extractor.copyDimensions().then((result) => {
                    sendResponse(result);
                }).catch((error) => {
                    sendResponse({
                        success: false,
                        message: '复制失败: ' + error.message
                    });
                });
                return true;
                
            } else if (request.action === 'copyUrl') {
                extractor.copyUrl().then((result) => {
                    sendResponse(result);
                }).catch((error) => {
                    sendResponse({
                        success: false,
                        message: '复制失败: ' + error.message
                    });
                });
                return true;
                
            } else if (request.action === 'copyAsin') {
                extractor.extractProductInfo();
                extractor.copyAsin().then((result) => {
                    sendResponse(result);
                }).catch((error) => {
                    sendResponse({
                        success: false,
                        message: '复制失败: ' + error.message
                    });
                });
                return true;
                
            } else if (request.action === 'copyPrice') {
                extractor.copyPrice().then((result) => {
                    sendResponse(result);
                }).catch((error) => {
                    sendResponse({
                        success: false,
                        message: '复制失败: ' + error.message
                    });
                });
                return true;
                
            } else if (request.action === 'copyProductInfo') {
                extractor.extractProductInfo();
                extractor.copyProductInfo().then((result) => {
                    sendResponse(result);
                }).catch((error) => {
                    sendResponse({
                        success: false,
                        message: '复制失败: ' + error.message
                    });
                });
                return true;
                
            } else if (request.action === 'copyAllInfo') {
                extractor.copyAllInfo().then((result) => {
                    sendResponse(result);
                }).catch((error) => {
                    sendResponse({
                        success: false,
                        message: '复制失败: ' + error.message
                    });
                });
                return true;
            }
            
        } catch (error) {
            console.error('处理消息时出错:', error);
            sendResponse({
                success: false,
                message: '处理请求时出错: ' + error.message
            });
        }
        
        return true;
    });

    console.log('消息监听器已设置完成');

    // 向background script报告content script已加载
    try {
        chrome.runtime.sendMessage({ action: 'contentScriptLoaded' }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('发送加载消息失败:', chrome.runtime.lastError);
            } else {
                console.log('Content script加载消息已发送');
            }
        });
    } catch (error) {
        console.log('发送加载消息异常:', error);
    }

    // 页面加载完成后自动检测
    const checkPage = () => {
        // 检查是否在产品页面
        if (window.location.href.includes('/dp/') || window.location.href.includes('/gp/product/')) {
            console.log('检测到Amazon产品页面');
            console.log('当前URL:', window.location.href);
            
            // 设置页面标识
            document.body.setAttribute('data-amazon-extractor', 'ready');
        }
    };

    // 立即检查
    checkPage();

    // 页面加载完成后再次检查
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkPage);
    }
    window.addEventListener('load', checkPage);

    // 测试消息监听器是否正常工作
    window.addEventListener('message', (event) => {
        if (event.data.type === 'TEST_CONNECTION') {
            console.log('收到测试连接消息');
            event.source.postMessage({type: 'CONNECTION_OK'}, event.origin);
        }
    });

    // 定期检查连接状态
    setInterval(() => {
        if (chrome.runtime && chrome.runtime.id) {
            console.log('Content script运行正常');
        } else {
            console.warn('Chrome runtime连接丢失');
        }
    }, 30000); // 每30秒检查一次
}