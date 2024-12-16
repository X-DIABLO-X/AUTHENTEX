(function() {
  const colors = ["#FF8D8D", "#29F570", "#FEFFB3"];
  const colorNames = ["red", "green", "yellow"];
  let isColorizing = false;
  let colorCounts = {
    red: 0,
    green: 0,
    yellow: 0,
    total: 0
  };

  function createPlusIcon() {
    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('../assets/plus.png');
    icon.classList.add('dynamic-plus-icon');
    icon.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      width: 24px;
      height: 24px;
      z-index: 10;
      cursor: pointer;
      transition: transform 0.2s;
    `;

    icon.addEventListener('mouseover', () => {
      icon.style.transform = 'scale(1.1)';
    });

    icon.addEventListener('mouseout', () => {
      icon.style.transform = 'scale(1)';
    });

    icon.addEventListener('click', (event) => {
      event.stopPropagation();
      
      const review = event.target.closest('.jftiEf');
      
      if (review) {
        alert('Review clicked!\n\nDetails:\n' + review.innerText.substring(0, review.innerText.length) + '...');
      }
    });

    return icon;
  }

  function colorizeReviews() {
    const reviews = document.querySelectorAll('.jftiEf:not([data-colored])');
    reviews.forEach((review) => {
      review.style.position = 'relative';

      // Select a random color
      const colorIndex = Math.floor(Math.random() * colors.length);
      const backgroundColor = colors[colorIndex];
      const colorName = colorNames[colorIndex];

      review.setAttribute('data-colored', 'true');
      review.setAttribute('data-color', colorName);
      review.style.backgroundColor = backgroundColor;

      const plusIcon = createPlusIcon();
      review.appendChild(plusIcon);

      colorCounts[colorName]++;
      colorCounts.total++;
    });

    chrome.runtime.sendMessage({
      action: "updateReviewCount", 
      counts: colorCounts
    });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "colorReviewsBlue") {
      isColorizing = !isColorizing;
      
      if (isColorizing) {

        colorCounts = {
          red: 0,
          green: 0,
          yellow: 0,
          total: 0
        };
        observer.observe(document.body, config);
        colorizeReviews();
      } else {
        observer.disconnect();
        const coloredReviews = document.querySelectorAll('.jftiEf[data-jftiEfcolored="true"]');
        coloredReviews.forEach((review) => {
          review.style.backgroundColor = '';
          review.removeAttribute('data-colored');
          review.removeAttribute('data-color');
          
          const existingIcon = review.querySelector('.dynamic-plus-icon');
          if (existingIcon) {
            existingIcon.remove();
          }
        });

        colorCounts = {
          red: 0,
          green: 0,
          yellow: 0,
          total: 0
        };
        chrome.runtime.sendMessage({
          action: "updateReviewCount", 
          counts: colorCounts
        });
      }
    }
  });

  const observer = new MutationObserver((mutations) => {
    if (!isColorizing) return;
    
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        setTimeout(colorizeReviews, 100);
      }
    });
  });

  const config = { 
    childList: true, 
    subtree: true 
  };
})();