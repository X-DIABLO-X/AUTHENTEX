let reviewCounts = {
    red: 0,
    green: 0,
    yellow: 0,
    total: 0
};

document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startAnalysis');
    const loadingElement = document.getElementById('loading');
    const statsElement = document.getElementById('stats');

    // Reset counts when extension is opened
    resetCounts();

    startButton.addEventListener('click', async () => {
        try {
            startButton.disabled = true;
            loadingElement.style.display = 'block';
            
            // Reset counts before starting new analysis
            resetCounts();
            renderStats(reviewCounts);

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.tabs.sendMessage(tab.id, { action: 'startAnalysis' });

            setTimeout(() => {
                loadingElement.style.display = 'none';
                startButton.disabled = false;
            }, 1000);
        } catch (error) {
            console.error('Error:', error);
            loadingElement.style.display = 'none';
            startButton.disabled = false;
        }
    });

    // Listen for individual review updates
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "newReviewAnalyzed") {
            updateCountsForSingleReview(message.classification);
        }
    });
});

function resetCounts() {
    reviewCounts = {
        red: 0,
        green: 0,
        yellow: 0,
        total: 0
    };
    // Update storage with reset counts
    chrome.storage.local.set({ reviewStats: reviewCounts });
}

function updateCountsForSingleReview(classification) {
    reviewCounts[classification]++;
    reviewCounts.total++;
    renderStats(reviewCounts);
}

function renderStats(stats) {
    const statsContent = document.getElementById('statsContent');
    statsContent.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">
                <span class="emoji"></span> Potentially Fake
            </div>
            <div class="stat-value">${stats.red}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">
                <span class="emoji"></span> Suspicious
            </div>
            <div class="stat-value">${stats.yellow}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">
                <span class="emoji"></span> Genuine
            </div>
            <div class="stat-value">${stats.green}</div>
        </div>
        <div class="stat-item total">
            <div class="stat-label">Total Reviews</div>
            <div class="stat-value">${stats.total}</div>
        </div>
    `;
}