document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultDiv = document.getElementById('result');
  const summaryDiv = document.getElementById('summary');
  const chartContainer = document.getElementById('chart-container');

  analyzeBtn.addEventListener('click', () => {
    analyzeBtn.textContent = '正在分析...';
    analyzeBtn.disabled = true;
    resultDiv.style.display = 'none';
    chartContainer.innerHTML = ''; // Clear previous results
    summaryDiv.innerHTML = ''; // Clear previous summary

    chrome.runtime.sendMessage({ action: 'analyze' });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'displayResults') {
      analyzeBtn.textContent = '分析当前页面价格';
      analyzeBtn.disabled = false;

      const { averagePrice, priceRanges, totalCount } = message.data;
      
      resultDiv.style.display = 'block';

      if (totalCount === 0) {
        summaryDiv.innerHTML = '<p>未在当前页面找到有效的商品价格。</p>';
        return;
      }

      summaryDiv.innerHTML = `
        <p>分析了 <strong>${totalCount}</strong> 个商品</p>
        <p>平均价格: <strong>${averagePrice.toFixed(2)}</strong></p>
      `;

      renderBarChart(priceRanges);
    }
  });

  function renderBarChart(priceRanges) {
    const colors = ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#c084fc', '#9ca3af'];
    let colorIndex = 0;

    const maxCount = Math.max(...Object.values(priceRanges).map(r => r.count));
    if (maxCount === 0) return;

    for (const range in priceRanges) {
        const { count, percentage } = priceRanges[range];
        const barWidth = (count / maxCount) * 100;
        const color = colors[colorIndex % colors.length];

        const row = document.createElement('div');
        row.className = 'chart-row';
        row.innerHTML = `
            <div class="chart-label">${range}</div>
            <div class="chart-bar-container">
                <div class="chart-bar" style="width: ${barWidth}%; background-color: ${color};"></div>
            </div>
            <div class="chart-value">${count}个 (${percentage.toFixed(1)}%)</div>
        `;
        chartContainer.appendChild(row);
        colorIndex++;
    }
  }
});