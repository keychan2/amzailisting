// Amazon插件测试脚本
// 在Amazon产品页面的控制台中运行此脚本来测试插件功能

console.log('=== Amazon插件测试脚本 ===');

// 测试1: 检查content script是否加载
function testContentScriptLoaded() {
    console.log('\n1. 测试Content Script加载状态...');
    
    if (window.amazonExtractorLoaded) {
        console.log('✅ Content Script已加载');
        return true;
    } else {
        console.log('❌ Content Script未加载');
        return false;
    }
}

// 测试2: 检查页面类型
function testPageType() {
    console.log('\n2. 测试页面类型...');
    
    const url = window.location.href;
    const isProductPage = url.includes('/dp/') || url.includes('/gp/product/');
    const isAmazonDomain = url.includes('amazon.');
    
    console.log('当前URL:', url);
    console.log('是Amazon域名:', isAmazonDomain ? '✅' : '❌');
    console.log('是产品页面:', isProductPage ? '✅' : '❌');
    
    return isAmazonDomain && isProductPage;
}

// 测试3: 测试产品信息提取
function testProductExtraction() {
    console.log('\n3. 测试产品信息提取...');
    
    try {
        const extractor = new AmazonProductExtractor();
        const productData = extractor.extractProductInfo();
        
        console.log('提取结果:', productData);
        
        const hasTitle = !!productData.title;
        const hasAsin = !!productData.asin;
        const hasBulletPoints = productData.bulletPoints && productData.bulletPoints.length > 0;
        
        console.log('标题:', hasTitle ? '✅' : '❌', productData.title || '未找到');
        console.log('ASIN:', hasAsin ? '✅' : '❌', productData.asin || '未找到');
        console.log('五点描述:', hasBulletPoints ? '✅' : '❌', `找到${productData.bulletPoints?.length || 0}条`);
        console.log('重量:', productData.weight ? '✅' : '❌', productData.weight || '未找到');
        console.log('尺寸:', productData.dimensions ? '✅' : '❌', productData.dimensions || '未找到');
        
        return hasTitle || hasAsin || hasBulletPoints;
    } catch (error) {
        console.log('❌ 提取失败:', error.message);
        return false;
    }
}

// 测试4: 测试Chrome扩展API
function testChromeAPI() {
    console.log('\n4. 测试Chrome扩展API...');
    
    const hasChrome = !!window.chrome;
    const hasRuntime = !!(window.chrome && window.chrome.runtime);
    const hasRuntimeId = !!(window.chrome && window.chrome.runtime && window.chrome.runtime.id);
    
    console.log('Chrome API:', hasChrome ? '✅' : '❌');
    console.log('Runtime API:', hasRuntime ? '✅' : '❌');
    console.log('Runtime ID:', hasRuntimeId ? '✅' : '❌');
    
    return hasChrome && hasRuntime;
}

// 测试5: 测试消息通信
async function testMessageCommunication() {
    console.log('\n5. 测试消息通信...');
    
    if (!window.chrome || !window.chrome.runtime) {
        console.log('❌ Chrome API不可用');
        return false;
    }
    
    try {
        // 发送测试消息
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
        
        console.log('✅ 消息通信正常:', response);
        return true;
    } catch (error) {
        console.log('❌ 消息通信失败:', error.message);
        return false;
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('开始运行插件测试...\n');
    
    const results = {
        contentScript: testContentScriptLoaded(),
        pageType: testPageType(),
        extraction: testProductExtraction(),
        chromeAPI: testChromeAPI(),
        communication: await testMessageCommunication()
    };
    
    console.log('\n=== 测试结果汇总 ===');
    console.log('Content Script加载:', results.contentScript ? '✅' : '❌');
    console.log('页面类型检查:', results.pageType ? '✅' : '❌');
    console.log('产品信息提取:', results.extraction ? '✅' : '❌');
    console.log('Chrome API:', results.chromeAPI ? '✅' : '❌');
    console.log('消息通信:', results.communication ? '✅' : '❌');
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n总体结果: ${passedTests}/${totalTests} 项测试通过`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！插件应该可以正常工作。');
    } else {
        console.log('⚠️ 部分测试失败，插件可能无法正常工作。');
        
        // 提供修复建议
        console.log('\n修复建议:');
        if (!results.contentScript) {
            console.log('- 刷新页面重新加载Content Script');
        }
        if (!results.pageType) {
            console.log('- 确保在Amazon产品详情页面使用插件');
        }
        if (!results.extraction) {
            console.log('- 检查页面是否完全加载，尝试滚动页面');
        }
        if (!results.chromeAPI) {
            console.log('- 检查插件是否正确安装和启用');
        }
        if (!results.communication) {
            console.log('- 重新加载插件或重启浏览器');
        }
    }
    
    return results;
}

// 自动运行测试
runAllTests().catch(error => {
    console.error('测试运行失败:', error);
});

// 导出测试函数供手动调用
window.amazonPluginTest = {
    runAllTests,
    testContentScriptLoaded,
    testPageType,
    testProductExtraction,
    testChromeAPI,
    testMessageCommunication
};