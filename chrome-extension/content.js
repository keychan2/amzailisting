(() => {
  function parsePrice(priceString) {
    // This function correctly handles different currency formats like $1,234.56 and 1.234,56
    const cleanedString = priceString.replace(/[^\d,.]/g, '');
    const lastComma = cleanedString.lastIndexOf(',');
    const lastPeriod = cleanedString.lastIndexOf('.');

    if (lastComma > lastPeriod) {
      return parseFloat(cleanedString.replace(/\./g, '').replace(',', '.'));
    } else {
      return parseFloat(cleanedString.replace(/,/g, ''));
    }
  }

  const prices = [];
  // This selector is specific to product items within the main search results grid ("Results").
  // It will NOT pick up prices from recommendation carousels or other sections.
  const priceElements = document.querySelectorAll('div[data-component-type="s-search-result"] .a-price > .a-offscreen');

  priceElements.forEach(el => {
    const price = parsePrice(el.innerText);
    if (!isNaN(price) && price > 0) {
      prices.push(price);
    }
  });

  // Send the extracted prices (even if empty) to the background script.
  // If not on a search results page, an empty array will be sent.
  chrome.runtime.sendMessage({ action: 'priceData', data: prices });
})();