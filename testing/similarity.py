from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
import uvicorn
from playwright.async_api import async_playwright
import logging
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from time import perf_counter_ns as pf

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    encoding='utf-8'
)

# Initialize FastAPI app
app = FastAPI(
    title="Review Similarity API",
    description="API to analyze similarity between Google Maps reviews",
    version="1.0.0"
)

class URLInput(BaseModel):
    url: Optional[HttpUrl] = "https://www.google.com/maps/contrib/103452974889895734911/reviews"
    max_reviews: Optional[int] = 10

class SimilarityResponse(BaseModel):
    similarity_score: float
    review_count: int
    processing_time: float
    reviews: List[str]

def clean_text(text: str) -> str:
    """Clean text by removing emojis and non-printable characters"""
    if not text:
        return ""
    cleaned = re.sub(r'[^\x00-\x7F]+', '', text)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()

async def extract_reviews(url: str, max_reviews: int = 10) -> List[str]:
    reviews = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--no-sandbox',
                '--disable-gpu',
                '--disable-setuid-sandbox'
            ]
        )

        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )

        page = await context.new_page()

        try:
            page.set_default_timeout(15000)
            await page.goto(url, wait_until='domcontentloaded')

            panel_selector = '[role="tabpanel"]'
            await page.wait_for_selector(panel_selector)

            seen_reviews = set()
            stall_count = 0
            last_count = 0

            while len(reviews) < max_reviews and stall_count < 3:
                expand_buttons = await page.query_selector_all('.w8nwRe')
                for button in expand_buttons[:max_reviews - len(reviews)]:
                    try:
                        await button.click()
                    except Exception:
                        pass

                review_elements = await page.query_selector_all('.MyEned .wiI7pd')
                for element in review_elements:
                    try:
                        raw_text = await element.inner_text()
                        raw_text = raw_text.strip()
                        cleaned_text = clean_text(raw_text)

                        if cleaned_text and len(cleaned_text) > 10 and cleaned_text not in seen_reviews:
                            reviews.append(cleaned_text)
                            seen_reviews.add(cleaned_text)

                        if len(reviews) >= max_reviews:
                            break
                    except Exception as e:
                        logging.error(f"Error extracting review: {str(e)}")

                if len(reviews) == last_count:
                    stall_count += 1
                else:
                    stall_count = 0
                last_count = len(reviews)

                await page.evaluate(f"""
                    const panel = document.querySelector('{panel_selector}');
                    panel.scrollTo(0, panel.scrollHeight);
                """)
                await page.wait_for_timeout(1000)  # Wait for content to load

        except Exception as e:
            logging.error(f"Scraping error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error scraping reviews: {str(e)}")
        finally:
            await browser.close()

    return reviews[:max_reviews]

def compute_similarity(reviews: List[str]) -> float:
    """Compute the cosine similarity for a list of reviews using TF-IDF."""
    if len(reviews) < 2:
        return 0.0

    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(reviews)
    similarity_matrix = cosine_similarity(tfidf_matrix)

    n = len(reviews)
    upper_tri_indices = np.triu_indices(n, k=1)
    mean_similarity_score = np.mean(similarity_matrix[upper_tri_indices])

    return float(mean_similarity_score)

@app.post("/analyze", response_model=SimilarityResponse)
async def analyze_reviews(input_data: URLInput):
    """
    Analyze reviews from a Google Maps URL and return similarity score.
    
    - **url**: URL of the Google Maps review page
    - **max_reviews**: Maximum number of reviews to analyze (default: 10)
    """
    start_time = pf()
    
    try:
        reviews = await extract_reviews(str(input_data.url), input_data.max_reviews)
        
        if not reviews:
            raise HTTPException(status_code=404, detail="No reviews found")
            
        similarity_score = compute_similarity(reviews)
        processing_time = (pf() - start_time) / 1e9
        
        return SimilarityResponse(
            similarity_score=similarity_score,
            review_count=len(reviews),
            processing_time=processing_time,
            reviews=reviews
        )
        
    except Exception as e:
        logging.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
