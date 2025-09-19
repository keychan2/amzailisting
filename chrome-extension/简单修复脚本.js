// 简单的Amazon产品信息提取脚本 - 直接在控制台运行
// 如果插件无法工作，请复制此脚本到Amazon产品页面的控制台中运行

console.log('🔧 启动简单修复脚本...');

// 创建简单的产品信息提取器
const SimpleExtractor = {
    // 提取标题
    getTitle() {
        const selectors = ['#productTitle', '.product-title', 'h1[data-automation-id="product-title"]'];
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        return '未找到标题';
    },

    // 提取ASIN
    getASIN() {
        const urlMatch = window.location.href.match(/\/dp\/([A-Z0-9]{10})/);
        if (urlMatch) return urlMatch[1];
        
        const asinElement = document.querySelector('[data-asin]');
        if (asinElement) return asinElement.getAttribute('data-asin');
        
        return '未找到ASIN';
    },

    // 提取价格
    getPrice() {
        const selectors = ['.a-price-whole', '.a-price .a-offscreen', '#priceblock_dealprice', '#priceblock_ourprice'];
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        return '未找到价格';
    },

    // 提取五点描述
    getBulletPoints() {
        const bulletPoints = [];
        const selectors = [
            '#feature-bullets ul li span.a-list-item',
            '.a-unordered-list li span.a-list-item'
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
        
        return bulletPoints.length > 0 ? bulletPoints : ['未找到五点描述'];
    },

    // 复制到剪贴板
    async copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('✅ 复制成功！');
            return true;
        } catch (err) {
            console.log('❌ 复制失败，请手动复制以下内容：');
            console.log(text);
            return false;
        }
    },

    // 提取并显示所有信息
    extractAll() {
        const title = this.getTitle();
        const asin = this.getASIN();
        const price = this.getPrice();
        const bulletPoints = this.getBulletPoints();
        const url = window.location.href;

        const info = {
            标题: title,
            价格: price,
            ASIN: asin,
            五点描述: bulletPoints,
            链接: url
        };

        console.log('📋 提取的产品信息：', info);

        // 格式化为文本
        let text = `标题: ${title}\n`;
        text += `价格: ${price}\n`;
        text += `ASIN: ${asin}\n`;
        text += `\n五点描述:\n`;
        bulletPoints.forEach((point, index) => {
            text += `${index + 1}. ${point}\n`;
        });
        text += `\n链接: ${url}`;

        // 存储到全局变量
        window.extractedData = text;
        
        console.log('💾 数据已存储到 window.extractedData');
        console.log('📋 运行 SimpleExtractor.copyAll() 来复制所有信息');
        
        return info;
    },

    // 复制所有信息
    async copyAll() {
        if (!window.extractedData) {
            console.log('⚠️ 请先运行 SimpleExtractor.extractAll()');
            return;
        }
        
        await this.copyText(window.extractedData);
    }
};

// 自动运行提取
console.log('🚀 开始提取产品信息...');
SimpleExtractor.extractAll();

console.log('\n📖 使用说明：');
console.log('1. 运行 SimpleExtractor.copyAll() 复制所有信息');
console.log('2. 运行 SimpleExtractor.getTitle() 只获取标题');
console.log('3. 运行 SimpleExtractor.getPrice() 只获取价格');
console.log('4. 运行 SimpleExtractor.getBulletPoints() 只获取五点描述');

// 导出到全局
window.SimpleExtractor = SimpleExtractor;