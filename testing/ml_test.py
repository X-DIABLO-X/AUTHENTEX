from playwright.sync_api import sync_playwright
import logging
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List
import numpy as np
from time import perf_counter_ns as pf

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def extract_reviews(url: str, max_reviews: int = 10) -> List[str]:
    """
    Extract reviews from Google Maps using headless Playwright with optimized performance

    Args:
        url (str): URL of the Google Maps reviews page
        max_reviews (int): Maximum number of reviews to extract

    Returns:
        List[str]: List of extracted review texts
    """
    reviews = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,  # Run headless for better performance
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
            page.set_default_timeout(15000)  # Set a shorter timeout
            page.goto(url, wait_until='domcontentloaded')

            # Wait for the review panel
            panel_selector = '[role="tabpanel"]'
            page.wait_for_selector(panel_selector)

            while len(reviews) < max_reviews:
                # Expand visible reviews
                expand_buttons = page.query_selector_all('.w8nwRe')[:max_reviews - len(reviews)]
                for button in expand_buttons:
                    try:
                        button.click()
                    except Exception:
                        pass  # Ignore click errors for already expanded reviews

                # Extract reviews from visible elements
                review_elements = page.query_selector_all('.wiI7pd')
                for element in review_elements:
                    try:
                        review_text = element.inner_text().strip()

                        if review_text and len(review_text) > 10 and review_text not in reviews:
                            reviews.append(review_text)

                        if len(reviews) >= max_reviews:
                            break
                    except Exception as e:
                        logging.error(f"Error extracting review: {str(e)}")

                # Scroll to load more reviews if necessary
                page.evaluate(f"""
                    const panel = document.querySelector('{panel_selector}');
                    panel.scrollTo(0, panel.scrollHeight);
                """)

        except Exception as e:
            logging.error(f"Scraping error: {str(e)}")
        finally:
            browser.close()

    return reviews

def compute_similarity(reviews: List[str]) -> float:
    """
    Compute the cosine similarity for a list of reviews using TF-IDF.

    Args:
        reviews (List[str]): List of review texts

    Returns:
        float: Mean cosine similarity score
    """
    if len(reviews) < 2:
        logging.warning("Not enough reviews to compute similarity.")
        return 0.0

    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(reviews)
    similarity_matrix = cosine_similarity(tfidf_matrix)

    # Compute the mean similarity (excluding diagonal)
    n = len(reviews)
    upper_tri_indices = np.triu_indices(n, k=1)
    mean_similarity_score = np.mean(similarity_matrix[upper_tri_indices])

    return mean_similarity_score

if _name_ == "_main_":
    url = "https://www.google.com/maps/contrib/106329545689795003131/reviews"  # Replace with the actual URL
    max_reviews = 10  # Set the desired number of reviews to extract

    start = pf()
    extracted_reviews = extract_reviews(url, max_reviews)
    end = pf()
    logging.info(f"Extracted {len(extracted_reviews)} reviews in {(end - start) / 1e9:.2f} seconds")

    if extracted_reviews:
        similarity_start = pf()
        mean_similarity = compute_similarity(extracted_reviews)
        similarity_end = pf()
        logging.info(f"Mean similarity score: {mean_similarity:.2f}")
        logging.info(f"Similarity computation took {(similarity_end - similarity_start) / 1e9:.2f} seconds")

        # Optionally print the reviews and their similarity score
        print("Extracted Reviews:")
        for i, review in enumerate(extracted_reviews, 1):
            print(f"{i}: {review}")

        print(f"\nOverall Similarity Score: {mean_similarity:.2f}")