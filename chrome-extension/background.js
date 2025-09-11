// 监听来自 popup.js 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyze') {
    // 获取当前活动的标签页
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        // 注入 content.js 脚本到页面
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        });
      } else {
        console.error("Could not find active tab to inject script.");
      }
    });
  } else if (request.action === 'priceData') {
    const prices = request.data;
    if (!prices || prices.length === 0) {
      chrome.runtime.sendMessage({
        action: 'displayResults',
        data: { totalCount: 0, priceRanges: {}, averagePrice: 0 }
      });
      return;
    }

    const totalCount = prices.length;
    const sum = prices.reduce((a, b) => a + b, 0);
    const averagePrice = sum / totalCount;
    const interval = 5; // Set interval to 5

    // Dynamically create and populate price ranges
    const tempRanges = {};
    prices.forEach(price => {
      const lowerBound = Math.floor(price / interval) * interval;
      const upperBound = lowerBound + interval;
      const rangeKey = `${lowerBound}-${upperBound}`;
      
      if (!tempRanges[rangeKey]) {
        tempRanges[rangeKey] = { count: 0 };
      }
      tempRanges[rangeKey].count++;
    });

    // Sort the range keys numerically
    const sortedKeys = Object.keys(tempRanges).sort((a, b) => {
      return parseInt(a.split('-')[0]) - parseInt(b.split('-')[0]);
    });

    // Build the final priceRanges object with percentages
    const priceRanges = {};
    for (const key of sortedKeys) {
      const count = tempRanges[key].count;
      priceRanges[key] = {
        count,
        percentage: (count / totalCount) * 100
      };
    }
    
    // Send results back to popup
    chrome.runtime.sendMessage({
      action: 'displayResults',
      data: { averagePrice, priceRanges, totalCount }
    });
  }
});