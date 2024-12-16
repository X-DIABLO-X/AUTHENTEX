chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'fetch') {
        fetch(request.url, {
            method: request.method || 'GET',
            headers: request.headers || {},
            body: request.body ? JSON.stringify(request.body) : null,
            credentials: 'omit'
        })
            .then(async (response) => {
                if (!response.ok) {
                    // Detailed error logging
                    const errorText = await response.text();
                    throw new Error(`Network response was not ok: ${response.status} ${response.statusText}. ${errorText}`);
                }
                return response.json();
            })
            .then(data => {
                sendResponse({
                    success: true,
                    data: data
                });
            })
            .catch(error => {
                console.error('Fetch error in background script:', error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            });

        return true; // Indicates an asynchronous response
    }

    // Handle review stats updates
    if (request.action === 'updateCounts' || request.action === 'newReviewAnalyzed') {
        // Optional: You can add additional logging or processing here
        return true;
    }
});