from playwright.sync_api import sync_playwright
import logging
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List
import numpy as np
from time import perf_counter_ns as pf

# Configure logging with UTF-8 encoding
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    encoding='utf-8'  # Specify UTF-8 encoding for log files
)

def clean_text(text: str) -> str:
    """Clean text by removing emojis and non-printable characters"""
    if not text:
        return ""
    # Remove emojis and special characters
    cleaned = re.sub(r'[^\x00-\x7F]+', '', text)
    # Remove multiple spaces
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()

def extract_reviews(url: str, max_reviews: int = 10) -> List[str]:
    reviews = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--no-sandbox',
                '--disable-gpu',
                '--disable-setuid-sandbox'
            ]
        )

        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )

        page = context.new_page()

        try:
            page.set_default_timeout(15000)
            page.goto(url, wait_until='domcontentloaded')

            panel_selector = '[role="tabpanel"]'
            page.wait_for_selector(panel_selector)

            seen_reviews = set()
            stall_count = 0
            last_count = 0

            while len(reviews) < max_reviews and stall_count < 3:
                # Expand visible reviews
                expand_buttons = page.query_selector_all('.w8nwRe')[:max_reviews - len(reviews)]
                for button in expand_buttons:
                    try:
                        button.click()
                    except Exception:
                        pass

                # Extract reviews from visible elements
                review_elements = page.query_selector_all('.MyEned .wiI7pd')
                for element in review_elements:
                    try:
                        raw_text = element.inner_text().strip()
                        cleaned_text = clean_text(raw_text)

                        if cleaned_text and len(cleaned_text) > 10 and cleaned_text not in seen_reviews:
                            reviews.append(cleaned_text)
                            seen_reviews.add(cleaned_text)

                        if len(reviews) >= max_reviews:
                            break
                    except Exception as e:
                        logging.error(f"Error extracting review: {str(e)}")

                # Check for stalled scrolling
                if len(reviews) == last_count:
                    stall_count += 1
                else:
                    stall_count = 0
                last_count = len(reviews)

                # Scroll to load more reviews
                page.evaluate(f"""
                    const panel = document.querySelector('{panel_selector}');
                    panel.scrollTo(0, panel.scrollHeight);
                """)

        except Exception as e:
            logging.error(f"Scraping error: {str(e)}")
        finally:
            browser.close()

    return reviews[:max_reviews]

def compute_similarity(reviews: List[str]) -> float:
    """
    Compute the cosine similarity for a list of reviews using TF-IDF.
    """
    if len(reviews) < 2:
        logging.warning("Not enough reviews to compute similarity.")
        return 0.0

    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(reviews)
    similarity_matrix = cosine_similarity(tfidf_matrix)

    n = len(reviews)
    upper_tri_indices = np.triu_indices(n, k=1)
    mean_similarity_score = np.mean(similarity_matrix[upper_tri_indices])

    return mean_similarity_score

if __name__ == "__main__":
    # Set console output to UTF-8
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    url = "https://www.google.com/maps/contrib/103452974889895734911/reviews?hl=en"
    max_reviews = 10
    
    start = pf()
    extracted_reviews = extract_reviews(url, max_reviews)
    
    # Safe printing of reviews
    # for review in extracted_reviews:
    #     try:
    #         print(review)
    #     except UnicodeEncodeError:
    #         print(clean_text(review))
            
    end = pf()
    logging.info(f"Extracted {len(extracted_reviews)} reviews in {(end - start) / 1e9:.2f} seconds")

    if extracted_reviews:
        similarity_start = pf()
        mean_similarity = compute_similarity(extracted_reviews)
        similarity_end = pf()
        logging.info(f"Mean similarity: {mean_similarity:.4f} in {(similarity_end - similarity_start) / 1e9:.2f} seconds")
        print(f"\nOverall Similarity Score: {mean_similarity:.2f}")