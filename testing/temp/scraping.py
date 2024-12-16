from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from concurrent.futures import ThreadPoolExecutor
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(_name_)

# Pydantic Model for Response
class ReviewResponse(BaseModel):
    reviews: List[str]
    total_reviews_found: int

# FastAPI Application
app = FastAPI(
    title="Google Maps Review Scraper",
    description="API to scrape reviews from Google Maps",
    version="1.0.0"
)

def setup_driver():
    """Set up optimized Chrome WebDriver"""
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.page_load_strategy = 'eager'

    driver = webdriver.Chrome(service=Service(), options=chrome_options)
    
    driver.set_page_load_timeout(10)
    driver.implicitly_wait(5)
    
    return driver

def extract_reviews(
    url: str, 
    max_reviews: int = 10
) -> List[str]:
    """
    Extract reviews from Google Maps
    
    Args:
        url (str): Google Maps contributor URL
        max_reviews (int): Maximum number of reviews to extract
    
    Returns:
        List[str]: List of extracted reviews
    """
    driver = setup_driver()
    reviews = []

    try:
        # Navigate to the target page
        driver.get(url)

        # Wait for side panel efficiently
        wait = WebDriverWait(driver, 10)
        side_panel = wait.until(EC.presence_of_element_located((By.XPATH, "//*[@role='tabpanel']")))

        # Find and click expand buttons more efficiently
        expand_buttons = driver.find_elements(By.CLASS_NAME, 'w8nwRe')
        for btn in expand_buttons[:max_reviews]:
            try:
                # Use JavaScript click for faster interaction
                driver.execute_script("arguments[0].click();", btn)
            except Exception as e:
                logger.warning(f"Could not click expand button: {e}")

        # Extract reviews efficiently
        review_elements = driver.find_elements(By.CLASS_NAME, 'wiI7pd')
        
        # Collect reviews quickly
        for element in review_elements[:max_reviews]:
            review_text = element.text.strip()
            if review_text and review_text not in reviews:
                reviews.append(review_text)
                if len(reviews) >= max_reviews:
                    break

    except Exception as e:
        logger.error(f"Scraping error: {e}")
    finally:
        driver.quit()

    return reviews

@app.get("/scrape-reviews", response_model=ReviewResponse)
async def scrape_reviews(
    url: str = Query(
        ..., 
        description="Google Maps contributor URL to scrape reviews from",
        example="https://www.google.com/maps/contrib/118094856765273643292/reviews?hl=en"
    ),
    max_reviews: Optional[int] = Query(
        10, 
        ge=1, 
        le=50, 
        description="Maximum number of reviews to extract (1-50)"
    )
):
    """
    API Endpoint to scrape Google Maps reviews
    
    - *url*: Full Google Maps contributor review URL
    - *max_reviews*: Maximum number of reviews to extract (default 10)
    """
    try:
        # Use ThreadPoolExecutor for potential parallel processing
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(extract_reviews, url, max_reviews)
            scraped_reviews = future.result()

        # Return response with reviews and total count
        return {
            "reviews": scraped_reviews,
            "total_reviews_found": len(scraped_reviews)
        }

    except Exception as e:
        logger.error(f"API Error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error scraping reviews: {str(e)}"
        )

# Swagger UI and ReDoc will be available at:
# http://localhost:8000/docs
# http://localhost:8000/redoc

if _name_ == "_main_":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True
    )

# Requirements (requirements.txt):
# fastapi
# uvicorn
# selenium
# pydantic