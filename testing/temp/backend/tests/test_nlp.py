import pytest
from app.nlp import analyze_review

def test_analyze_review():
    result = analyze_review("This product is amazing!")
    assert result is False  # Adjust based on your model's prediction
