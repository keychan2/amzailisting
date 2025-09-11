// Background script for Amazon Product Extractor
console.log('Background script loaded');

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed/updated:', details);
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    if (request.action === 'contentScriptLoaded') {
        console.log('Content script loaded in tab:', sender.tab?.id);
        sendResponse({ success: true });
    }
    
    return true;
});

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // 当页面完全加载后，如果是Amazon页面，确保content script已注入
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('amazon.')) {
        console.log('Amazon page loaded:', tab.url);
        
        // 延迟注入content script以确保页面完全加载
        setTimeout(async () => {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                });
                console.log('Content script injected into tab:', tabId);
            } catch (error) {
                console.log('Failed to inject content script:', error);
            }
        }, 1000);
    }
});