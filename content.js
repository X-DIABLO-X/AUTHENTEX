(function() {
    console.log("Review Analyzer Extension Started");

    let processedReviews = new Set();
    let isAnalyzing = false;

    // New API functions for review scoring and similarity
    //last code here remove the below if not works
    async function fetchReviewScore(reviewText, placeType) {
        const url = `https://nlp-parameter-907415986378.asia-south2.run.app/analyze_review?review_text="${reviewText}"&place_type="${placeType}"`;
        console.log(url);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json(); // This is the JSON object
            console.log('Data received:', data);
            return data; // Return the JSON object to the caller
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
            throw error; // Optionally rethrow the error for the caller to handle
        }
    }

    async function fetchReviewSimilarity(profileUrl, numberOfReviews = 10) {
        const SCRAPING_API_URL = "https://scraping-5am5.onrender.com/scrape-reviews"; // API for scraping
        const ML_URL = "https://ml-integration.onrender.com/calculate_similarity"; // ML cosine similarity endpoint
    
        try {
            // Step 1: Scrape the reviews from the profile using GET
            const scrapeResponse = await fetch(`${SCRAPING_API_URL}?url=${encodeURIComponent(profileUrl)}&max_reviews=${numberOfReviews}`, {
                method: "GET",
                headers: {
                    "accept": "application/json",
                },
            });
    
            // Check if scraping was successful
            if (!scrapeResponse.ok) {
                throw new Error(`Scraping Failed: ${scrapeResponse.status} ${scrapeResponse.statusText}`);
            }
    
            // Extract scraped reviews
            const scrapeData = await scrapeResponse.json();
            if (!scrapeData.reviews || scrapeData.reviews.length === 0) {
                throw new Error("No reviews found in the scraped data.");
            }
    
            console.log("Scraped Reviews:", scrapeData.reviews);
    
            // Step 2: Prepare reviews for the ML similarity API
            const reviewsPayload = {
                comments: scrapeData.reviews, // Use the reviews from the scraped data
            };
    
            // Step 3: Send reviews to ML cosine similarity endpoint
            const similarityResponse = await fetch(ML_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reviewsPayload),
            });
    
            // Check if similarity calculation was successful
            if (!similarityResponse.ok) {
                throw new Error(`ML Similarity Failed: ${similarityResponse.status} ${similarityResponse.statusText}`);
            }
    
            // Extract the similarity result
            const similarityData = await similarityResponse.json();
    
            console.log("Cosine Similarity Result:", similarityData);
    
            // Return the similarity score (assuming it's part of the response)
            return similarityData.score || null;
        } catch (error) {
            console.error("Error occurred:", error.message);
            throw error; // Re-throw the error for the caller to handle
        }
    }
    

    function determineClassification(scoreData, pic) {
        let score;
        let confidence;
        console.log(scoreData);
        if (pic) {
            score = (10 * scoreData['final_score']) + 1;
            confidence = Math.min(((scoreData['final_score'] * 100) + 10).toFixed(0), 100); 
        } else {
            score = scoreData['final_score'] * 10;
            confidence = Math.min((scoreData['final_score'] * 100).toFixed(0), 100); 
        }
        console.log("score",score);
        console.log("confidence",confidence);

        if (score <= 4.5) {
            return {
                ispic: pic,
                type: 'red',
                text: 'Fake',
                confidence: confidence
            };
        } else if (score <= 6) {
            return {
                ispic: pic,
                type: 'yellow',
                text: 'Suspicious',
                confidence: confidence
            };
        } else {
            return {
                ispic: pic,
                type: 'green',
                text: 'Genuine',
                confidence: confidence
            };
        }
    }

    function createScoreModal(result, scores) {
        console.log("result",scores.length, scores.grammar, scores.sentiment, scores.content);
        let finalScore = scores.finalScore;
        console.log("finalScore",finalScore);

        const overlay = document.createElement('div');
        overlay.className = 'feedback-overlay';
        
        const scoreCard = document.createElement('div');
        scoreCard.className = 'score-card';
        scoreCard.innerHTML = `
            <h3>Review Analysis Scores</h3>
            
            <div class="score-item">
                <div class="score-label">Grammar Score</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${scores.grammar * 10}%">
                        <span>${scores.grammar}/10</span>
                    </div>
                </div>
            </div>

            <div class="score-item">
                <div class="score-label">Length Score</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${scores.length * 10}%">
                        <span>${scores.length}/10</span>
                    </div>
                </div>
            </div>

            <div class="score-item">
                <div class="score-label">Sentiment Score</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${scores.sentiment * 10}%">
                        <span>${scores.sentiment}/10</span>
                    </div>
                </div>
            </div>

            <div class="score-item">
                <div class="score-label">Content Score</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${scores.content * 10}%">
                        <span>${scores.content}/10</span>
                    </div>
                </div>
            </div>


            <div class="score-item final-score">
                <div class="score-label">Final Score</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${finalScore * 10}%">
                        <span>${finalScore}/10</span>
                    </div>
                </div>
            </div>

            
            <div class="score-item">
                <div class="score-label">Image Verification</div>
                    
                        <span>
    ${result.ispic 
        ? `<div class="isimage"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" id="verified">
  <g clip-path="url(#clip0_1084_3803)">
    <path fill="#4DC4FF" d="M13.3546 1.46995C12.6544 0.614752 11.3466 0.614755 10.6465 1.46995L9.65463 2.6814C9.58665 2.76443 9.47325 2.79482 9.37286 2.7569L7.90817 2.20367C6.87422 1.81314 5.74163 2.46703 5.56286 3.55774L5.30963 5.10281C5.29227 5.20871 5.20926 5.29172 5.10335 5.30908L3.55829 5.56231C2.46759 5.74108 1.81368 6.87366 2.20422 7.90762L2.75745 9.37231C2.79537 9.4727 2.76498 9.5861 2.68195 9.65408L1.4705 10.6459C0.615302 11.3461 0.615304 12.6539 1.4705 13.3541L2.68195 14.3459C2.76498 14.4139 2.79537 14.5273 2.75745 14.6277L2.20422 16.0924C1.81369 17.1263 2.46758 18.2589 3.55829 18.4377L5.10335 18.6909C5.20926 18.7083 5.29227 18.7913 5.30963 18.8972L5.56286 20.4422C5.74163 21.5329 6.87421 22.1868 7.90817 21.7963L9.37286 21.2431C9.47325 21.2052 9.58665 21.2355 9.65463 21.3186L10.6465 22.53C11.3466 23.3852 12.6544 23.3852 13.3546 22.53L14.3464 21.3186C14.4144 21.2355 14.5278 21.2052 14.6282 21.2431L16.0929 21.7963C17.1269 22.1868 18.2595 21.5329 18.4382 20.4422L18.6915 18.8972C18.7088 18.7913 18.7918 18.7083 18.8977 18.6909L20.4428 18.4377C21.5335 18.2589 22.1874 17.1263 21.7969 16.0924L21.2436 14.6277C21.2057 14.5273 21.2361 14.4139 21.3191 14.3459L22.5306 13.3541C23.3858 12.6539 23.3858 11.3461 22.5306 10.6459L21.3191 9.65408C21.2361 9.5861 21.2057 9.4727 21.2436 9.37231L21.7969 7.90762C22.1874 6.87366 21.5335 5.74108 20.4428 5.56231L18.8977 5.30908C18.7918 5.29172 18.7088 5.20871 18.6915 5.10281L18.4382 3.55774C18.2595 2.46704 17.1269 1.81313 16.0929 2.20367L14.6282 2.7569C14.5278 2.79482 14.4144 2.76443 14.3464 2.6814L13.3546 1.46995Z"></path>
    <path fill="#ECEFF1" fill-rule="evenodd" d="M18.0303 7.96967C18.3232 8.26256 18.3232 8.73744 18.0303 9.03033L11.0303 16.0303C10.8897 16.171 10.6989 16.25 10.5 16.25C10.3011 16.25 10.1103 16.171 9.96967 16.0303L5.96967 12.0303C5.67678 11.7374 5.67678 11.2626 5.96967 10.9697C6.26256 10.6768 6.73744 10.6768 7.03033 10.9697L10.5 14.4393L16.9697 7.96967C17.2626 7.67678 17.7374 7.67678 18.0303 7.96967Z" clip-rule="evenodd"></path>
  </g>
  <defs>
    <clipPath id="clip0_1084_3803">
      <rect width="24" height="24" fill="#fff"></rect>
    </clipPath>
  </defs>
</svg> Verified +10%</div>` 
        : `<div class="isimage"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" id="X">
  <path fill="#d85b53" d="M16 0C7.164 0 0 7.164 0 16s7.164 16 16 16 16-7.164 16-16S24.836 0 16 0zm7.914 21.086-2.828 2.828L16 18.828l-5.086 5.086-2.828-2.828L13.172 16l-5.086-5.086 2.828-2.828L16 13.172l5.086-5.086 2.828 2.828L18.828 16l5.086 5.086z" class="color4e4e50 svgShape"></path>
  <defs>
    <clipPath id="clip0_1084_3803">
      <rect width="24" height="24" fill="#fff"></rect>
    </clipPath>
  </defs>
</svg> Not Verified</div>`
    }
</span>
                </div>
            </div>
            
            <button class="close-btn">Close</button>

        `;

        overlay.appendChild(scoreCard);
        document.body.appendChild(overlay);

        const closeBtn = scoreCard.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => overlay.remove());
    }

    function createFeedbackForm(review) {
        const overlay = document.createElement('div');
        overlay.className = 'feedback-overlay';
        
        const form = document.createElement('div');
        form.className = 'feedback-form';
        form.innerHTML = `
            <h3>Review Analysis Feedback</h3>

            <div class="feedback-options">
                <p>What are your thoughts on this review?</p>
                <label>
                    <input type="radio" name="feedback-reason" value="wrong classification">
                    Wrong classification
                </label>
                <label>
                    <input type="radio" name="feedback-reason" value="Incorrect confidence score">
                    Incorrect confidence score
                </label>
                <label>
                    <input type="radio" name="feedback-reason" value="Review seems fake to me!">
                    Review seems fake to me!
                </label>
                <label>
                    <input type="radio" name="feedback-reason" value="Review seems Real to me!">
                    Review seems Real to me!
                </label>
            </div>

            <div class="feedback-text">
                <p>Additional Comments:</p>
                <textarea id="feedback-comments" placeholder="Please provide more details..." rows="4"></textarea>
            </div>

            <div class="feedback-buttons">
                <button class="submit-btn" >Submit</button>
                <button class="cancel-btn" onclick="resetForm()">Cancel</button>
            </div>

        `; 
        overlay.appendChild(form);
        document.body.appendChild(overlay);
        const reviewID = review;
        const submitBtn = form.querySelector('.submit-btn');
        const cancelBtn = form.querySelector('.cancel-btn');

        submitBtn.addEventListener('click', async () => {
            const selectedFeedback = form.querySelector('input[name="feedback-reason"]:checked')?.value;
            const msg = form.querySelector('textarea').value;
            const reviewID = document.querySelector('.jftiEf .data-review-id')
            const originalReview = "real"
            console.log(selectedFeedback);
            console.log(msg);
            console.log(originalReview);
            console.log(reviewID);  
            if (!selectedFeedback) {
                alert('Please select a reason for your feedback');
                return;
            }

            // Optional: Send feedback to backend
            try {
                await fetch('https://database-4pzy.onrender.com/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        "ID": reviewID,
                        "FEEDBACK": selectedFeedback,
                        "MESSAGE": msg,
                        "REVIEW": originalReview
                    })
                });
            } catch (error) {
                console.error('Failed to submit feedback:', error);
            }
            
            overlay.remove();
        });

        cancelBtn.addEventListener('click', () => overlay.remove());
    }
//   // Function to gather input values and call API
// async function submitFeedback() {
//     const FEED_URL = `https://database-4pzy.onrender.com/`;

//     // Gather user inputs
//     const selectedFeedback = document.querySelector('input[name="feedback-reason"]:checked')?.value;
//     const feedbackComments = document.getElementById('feedback-comments').value;

//     if (!selectedFeedback) {
//         alert("Please select a feedback reason.");
//         return;
//     }

//     const reviewID = "23452"; // Replace with actual review ID (e.g., dynamic value)
//     const originalReview = "The review text goes here."; // Replace dynamically if required
//     const msg = feedbackComments || "No additional comments provided.";
//     let 

//     try {
//         // Send data to the API
//         const response = await fetch(FEED_URL, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 "ID": reviewID,
//                 "FEEDBACK": selectedFeedback,
//                 "MESSAGE": msg,
//                 "REVIEW": originalReview
//             }),
//         });

//         if (!response.ok) {
//             throw new Error(`Error: ${response.statusText}`);
//         }

//         const data = await response.json();
//         console.log('Data received:', data);
//         alert("Feedback submitted successfully!");

//     } catch (error) {
//         console.error('There was a problem with the fetch operation:', error);
//         alert("Failed to submit feedback. Please try again.");
//     }
// }

// // Function to reset the form inputs
// function resetForm() {
//     document.querySelectorAll('input[name="feedback-reason"]').forEach(input => input.checked = false);
//     document.getElementById('feedback-comments').value = '';
// }

    async function processReview(reviewElement, reviewEl, title, pic) {
        if (processedReviews.has(reviewElement)) return;
        
        try {
            // Extract review text (adjust selector as needed)
            const reviewText = reviewElement.textContent;
            console.log("processing reviews!");
            // Fetch review score from API
            let scoreData = await fetchReviewScore(reviewText, title);
            //let similar = await fetchReviewSimilarity()
            console.log("review processed!");
            // Determine classification based on score
            console.log(pic);
            const result = determineClassification(scoreData, pic);
            console.log("classification determined!");
            const flag = document.createElement('div');
            flag.className = `review-flag ${result.type}`;
            flag.textContent = `${result.text} (${result.confidence}%)`;
            flag.style.cssText = `
                position: absolute;
                top: 8px;
                right: 100px;
                z-index: 1000;
            `;
            flag.addEventListener('click', () => createScoreModal(result, {
                finalScore: Math.min((pic) ? ((scoreData['final_score'] * 10) + 1).toFixed(1) : (scoreData['final_score'] * 10).toFixed(1), 10),
                grammar: (scoreData['scores'].grammar * 10).toFixed(1),
                length: (scoreData['scores'].length * 10).toFixed(1),
                sentiment: (scoreData['scores'].sentiment * 10).toFixed(1),
                content: (scoreData['scores'].relevance * 10).toFixed(1),
            }));
            
            const feedbackBtn = document.createElement('button');
            feedbackBtn.className = 'feedback-button';
            feedbackBtn.textContent = 'Feedback';
            feedbackBtn.style.cssText = `
                position: absolute;
                top: 8px;
                right: 10px;
                z-index: 1000;
            `;
            feedbackBtn.addEventListener('click', createFeedbackForm(reviewEl));
            
            reviewEl.style.position = 'relative';
            reviewEl.appendChild(flag);
            reviewEl.appendChild(feedbackBtn);

            chrome.runtime.sendMessage({
                action: "newReviewAnalyzed",
                classification: result.type
            });
            
            processedReviews.add(reviewElement);
            updateReviewCounts(result.type);
        } catch (error) {
            console.error('Error processing review:', error);
        }
    }
    
    // Add function to update counts
    function updateReviewCounts(type) {
        chrome.storage.local.get(['reviewStats'], function(result) {
            let stats = result.reviewStats || { red: 0, yellow: 0, green: 0, total: 0 };
            stats[type]++;
            stats.total++;
            chrome.storage.local.set({ reviewStats: stats }, function() {
                // Send message to popup to update counts
                chrome.runtime.sendMessage({
                    action: "updateCounts",
                    stats: stats
                });
            });
        });
    }

    async function findAndProcessReviews() {
        // Only process if analysis has started
        if (!isAnalyzing) return;

        try {
            const title = document.querySelector('.iD2gKb').textContent;
            const reviews = document.querySelectorAll('.MyEned .wiI7pd:not([data-processed])');
            const reviewEl = document.querySelectorAll('.jftiEf:not([data-processed])');
            const buttons = document.querySelectorAll('.w8nwRe:not([data-processed])');
            console.log(`Found ${reviews.length} new reviews to process`);
            for (let i = 0; i < length; i++) {  
                const review = reviews[i];
                const reviewElement = reviewEl[i];
                let pic = false;
                //buttons[i].click();
                // buttons[i].addEventListener('click', async function(){
                //     await processReview(review, reviewEl[i], title, pic);
                // });
                const is_image = reviewEl[i].querySelector('.jftiEf .KtCyie'); 
                if (is_image) {
                    console.log("Image found");
                    pic = true;
                } else {
                    console.log("Image not found");
                    pic = false;
                }

                if (!review.hasAttribute('data-processed') && !reviewElement.hasAttribute('data-processed')) {
                    review.setAttribute('data-processed', 'true');
                    reviewElement.setAttribute('data-processed', 'true');
                    await processReview(review, reviewElement, title, pic); // Process both reviews together
                }
            }
        } catch (error) {
            console.error('Error processing reviews:', error);
        }
    }

    // Message listeners for starting analysis
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
            if (message.action === 'startAnalysis') {
                console.log('Starting analysis...');
                isAnalyzing = true;
                findAndProcessReviews();
                sendResponse({ status: 'Analysis started' });
            } else if (message.action === 'stopAnalysis') {
                console.log('Stopping analysis...');
                isAnalyzing = false;
                sendResponse({ status: 'Analysis stopped' });
            }
            return true;
        } catch (error) {
            console.error('Error:', error);
            sendResponse({ status: 'error', message: error.message });
            return true;
        }
    });

    // Scroll handler
    window.addEventListener('scroll', () => {
        if (isAnalyzing) {
            findAndProcessReviews();
        }
    });

    // Initial load handlers
    window.addEventListener('load', findAndProcessReviews);
    document.addEventListener('DOMContentLoaded', findAndProcessReviews);

    // Monitor for dynamically added reviews
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                findAndProcessReviews();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('Review analyzer ready');
})();