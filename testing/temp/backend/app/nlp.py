from transformers import pipeline

fake_review_detector = pipeline("text-classification", model="your-model-name")

def analyze_review(review: str) -> bool:
    result = fake_review_detector(review)
    return result[0]["label"] == "FAKE"
