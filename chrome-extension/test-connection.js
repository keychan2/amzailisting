// 快速测试脚本 - 验证插件连接状态
// 在Amazon产品页面的控制台中运行此脚本来测试插件功能

console.log('=== Amazon产品信息提取器 v2.0 连接测试 ===');

// 测试1: 检查content script是否加载
function testContentScriptLoaded() {
    console.log('\n1. 检查content script是否加载...');
    
    if (typeof AmazonProductExtractor !== 'undefined') {
        console.log('✅ Content script已正确加载');
        return true;
    } else {
        console.log('❌ Content script未加载，请刷新页面');
        return false;
    }
}

// 测试2: 测试产品信息提取
function testProductExtraction() {
    console.log('\n2. 测试产品信息提取...');
    
    try {
        const extractor = new AmazonProductExtractor();
        const data = extractor.extractProductInfo();
        
        console.log('提取结果:', data);
        
        if (data.title) {
            console.log('✅ 标题提取成功:', data.title.substring(0, 50) + '...');
        } else {
            console.log('⚠️ 未找到标题');
        }
        
        if (data.bulletPoints && data.bulletPoints.length > 0) {
            console.log('✅ 五点描述提取成功，共', data.bulletPoints.length, '条');
            data.bulletPoints.forEach((point, index) => {
                console.log(`   ${index + 1}. ${point.substring(0, 50)}...`);
            });
        } else {
            console.log('⚠️ 未找到五点描述');
        }
        
        if (data.weight) {
            console.log('✅ 重量信息:', data.weight);
        }
        
        if (data.dimensions) {
            console.log('✅ 尺寸信息:', data.dimensions);
        }
        
        if (data.asin) {
            console.log('✅ ASIN:', data.asin);
        }
        
        return data;
    } catch (error) {
        console.log('❌ 提取失败:', error.message);
        return null;
    }
}

// 测试3: 测试复制功能
async function testCopyFunctions() {
    console.log('\n3. 测试复制功能...');
    
    try {
        const extractor = new AmazonProductExtractor();
        extractor.extractProductInfo();
        
        // 测试标题复制
        const titleResult = await extractor.copyTitle();
        if (titleResult.success) {
            console.log('✅ 标题复制功能正常');
        } else {
            console.log('❌ 标题复制失败:', titleResult.message);
        }
        
        // 测试五点描述复制
        const bulletResult = await extractor.copyBulletPoints();
        if (bulletResult.success) {
            console.log('✅ 五点描述复制功能正常');
        } else {
            console.log('❌ 五点描述复制失败:', bulletResult.message);
        }
        
    } catch (error) {
        console.log('❌ 复制功能测试失败:', error.message);
    }
}

// 测试4: 检查页面类型
function testPageType() {
    console.log('\n4. 检查页面类型...');
    
    const url = window.location.href;
    console.log('当前URL:', url);
    
    if (url.includes('/dp/') || url.includes('/gp/product/')) {
        console.log('✅ 这是Amazon产品页面');
        
        // 检查ASIN
        const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
        if (asinMatch) {
            console.log('✅ 检测到ASIN:', asinMatch[1]);
        }
        
        return true;
    } else {
        console.log('❌ 这不是Amazon产品页面，请访问产品详情页');
        return false;
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('开始运行所有测试...\n');
    
    const results = {
        contentScript: testContentScriptLoaded(),
        pageType: testPageType(),
        extraction: null,
        copyFunctions: null
    };
    
    if (results.contentScript && results.pageType) {
        results.extraction = testProductExtraction();
        await testCopyFunctions();
    }
    
    console.log('\n=== 测试完成 ===');
    
    if (results.contentScript && results.pageType && results.extraction) {
        console.log('🎉 插件工作正常！可以正常使用所有功能。');
    } else {
        console.log('⚠️ 插件可能存在问题，请检查上述测试结果。');
    }
    
    return results;
}

// 自动运行测试
runAllTests();

// 导出测试函数供手动调用
window.amazonExtensionTest = {
    runAllTests,
    testContentScriptLoaded,
    testProductExtraction,
    testCopyFunctions,
    testPageType
};