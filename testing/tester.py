from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os
from time import perf_counter_ns
import uvicorn

# Initialize FastAPI app
app = FastAPI()

# Request model for input data
class CommentsRequest(BaseModel):
    comments: list[str]

# Endpoint to calculate similarity
@app.get("/calculate_similarity")
def calculate_similarity(comments: list[str]):
    # Ensure there are enough comments to calculate similarity
    if len(comments) < 2:
        raise HTTPException(status_code=400, detail="At least two comments are required for similarity calculation.")
    
    # Start performance timer
    time1 = perf_counter_ns()
    
    # Create a TfidfVectorizer object
    vectorizer = TfidfVectorizer(stop_words='english')
    
    # Fit and transform the vectorizer on the comments
    tfidf_matrix = vectorizer.fit_transform(comments)
    
    # Calculate similarity matrix
    similarity_matrix = cosine_similarity(tfidf_matrix)
    
    # Compute the mean similarity (excluding diagonal)
    n = len(comments)
    upper_tri_indices = np.triu_indices(n, k=1)
    mean_similarity_score = np.mean(similarity_matrix[upper_tri_indices])
    
    # Compute full similarity matrix for detailed insights
    detailed_similarity = similarity_matrix.tolist()
    
    # Compute individual similarities for reference
    individual_similarities = []
    for i in range(n):
        for j in range(i+1, n):
            individual_similarities.append({
                "comments": [comments[i], comments[j]],
                "similarity": round(similarity_matrix[i, j], 2)
            })
    
    # Return results
    return {
        "mean_similarity_score": round(mean_similarity_score, 2),
        "detailed_similarity_matrix": detailed_similarity,
        "individual_similarities": individual_similarities
    }

# Get port from environment variable (Render sets this)
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)