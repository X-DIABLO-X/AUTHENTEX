from fastapi import APIRouter
from app.models import ReviewRequest
from app.nlp import analyze_review

api_router = APIRouter()

@api_router.post("/analyze")
async def analyze(request: ReviewRequest):
    result = analyze_review(request.review)
    return {"is_fake": result}
