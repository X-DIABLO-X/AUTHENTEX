let redValue = localStorage.getItem('redValue');
let greenValue = localStorage.getItem('greenValue');
let yellowValue = localStorage.getItem('yellowValue');
let totalValue = localStorage.getItem('totalValue');

document.getElementById("analyze-reviews").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "colorReviewsBlue" });
    });
  });
  const resultElement = document.querySelector(".result")
  let countsHTML = `
      <div style="color: red;">Fake Reviews: ${redValue}</div>
      <div style="color: green;">Genuine Reviews: ${greenValue}</div>
      <div style="color: #DAA520;">Suspicious Reviews: ${yellowValue}</div>
      <div style="color: black;">Total Reviews: ${totalValue}</div>
  `;
  
  resultElement.innerHTML = countsHTML;
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateReviewCount") {

        countsHTML = `
            <div style="color: red;">Fake Reviews: ${message.counts.red}</div>
            <div style="color: green;">Genuine Reviews: ${message.counts.green}</div>
            <div style="color: #DAA520;">Suspicious Reviews: ${message.counts.yellow}</div>
            <div style="color: black;">Total Reviews: ${message.counts.total}</div>
        `;
        resultElement.innerHTML = countsHTML;
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateReviewCount") {
      redValue = message.counts.red;
      greenValue = message.counts.green;
      yellowValue = message.counts.yellow;
      totalValue = message.counts.total;

      localStorage.setItem('redValue', redValue);
      localStorage.setItem('greenValue', greenValue);
      localStorage.setItem('yellowValue', yellowValue);
      localStorage.setItem('totalValue', totalValue);
  }
});

window.addEventListener('load', function () {
      localStorage.setItem('redValue', 0);
      localStorage.setItem('greenValue', 0);
      localStorage.setItem('yellowValue', 0);
      localStorage.setItem('totalValue', 0);
});

