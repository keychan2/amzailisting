// Amazon产品信息提取脚本
class AmazonProductExtractor {
    constructor() {
        this.productData = {
            title: '',
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
        
        listItems.forEach(li => {
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
        
        tables.forEach(table => {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
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
        featureSelectors.forEach(selector => {
            const items = document.querySelectorAll(selector);
            items.forEach(item => {
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
                const dims = [l, w, h].sort((a,b) => b-a);
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
        const calculatorTabs = [];
        chrome.runtime.sendMessage({
            action: 'sendToCalculator',
            data: this.productData
        });
        
        return this.productData;
    }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractProduct') {
        const extractor = new AmazonProductExtractor();
        const productData = extractor.extractProductInfo();
        
        if (productData.title || productData.weight || productData.dimensions) {
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
    }
});

// 页面加载完成后自动检测
window.addEventListener('load', () => {
    // 检查是否在产品页面
    if (window.location.href.includes('/dp/') || window.location.href.includes('/gp/product/')) {
        console.log('检测到Amazon产品页面');
    }
});