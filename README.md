# 🌟 Google Fake Review Analyser - Chrome Extension

The **Google Fake Review Analyser** is a powerful Chrome extension designed to help users identify fake, suspicious, or unreliable reviews on Google. 🚀 Leveraging advanced NLP models and a user-friendly interface, the extension evaluates the credibility of reviews using multiple parameters like grammar, content analysis, content length, and sentiment analysis, providing users with actionable insights to make informed decisions.

---

## ✨ Features

### 1. **User-Friendly Interface** 🖥️
- Intuitive and clean design for easy navigation.
- Real-time analysis results with visual indicators.

### 2. **Detailed Review Scoring** 📊
- Each review is evaluated across key metrics:
  - **Grammar**: 📝 Checks for grammatical accuracy.
  - **Content Analysis**: 📖 Scores the relevance and quality of the review's content based on its message and context.
  - **Content Length**: 🔍 Evaluates if the review is overly brief or suspiciously detailed.
  - **Sentiment Analysis**: 😊/😡 Determines the tone and polarity of the review.
- **Image Detection**: 🖼️ Identifies reviews with attached images and awards a **10% bonus** to their credibility score.
- Reviews are categorized as **Real**, **Suspicious**, or **Fake** based on the aggregated scores.

### 3. **Feedback Mechanism** 🗣️
- Users can provide feedback on the extension's accuracy and functionality, helping improve its performance over time.

### 4. **Cloud-Powered Performance** ☁️
- High-performance backend ensures seamless analysis with minimal latency.

---

## 🛠️ Technologies Used

### Frontend
- **HTML**: Structuring the user interface.
- **CSS**: 🎨 Styling and ensuring responsiveness.
- **JavaScript**: Interactive user interface and Chrome extension logic.

### Backend
- **Python**: Core logic and processing.
- **FastAPI**: ⚡ Backend framework for serving the analysis.

### Machine Learning
- **NLP Models**: Utilized for grammar checking, sentiment analysis, cosinne-similarity and TF-IDF.
- **AI MODEL** : Used LLAMA 3.2 90B LLM to check content analysis 

### Infrastructure
- **Docker**: 🐳 Containerized deployment for consistent performance across environments.
- **Google Cloud**: Scalable hosting and processing power.
- **Render**: Deployment and hosting of the backend services.

---

## 🔍 How It Works
1. Install the Chrome extension from the provided link.
2. Visit any Google review page.
3. Activate the extension to analyze the reviews in real time.
4. View the scores and categorizations for each review directly in the interface.
5. Reviews with images automatically receive a **10% bonus** in credibility scoring.
6. Optionally, submit feedback to improve the extension.

---

## ⚙️ Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/google-fake-review-analyser.git
   ```
2. Build and deploy the backend using Docker:
   ```bash
   docker-compose up --build
   ```
3. Add the extension to Chrome:
   - Open `chrome://extensions/`.
   - Enable "Developer Mode".
   - Click "Load unpacked" and select the `extension` folder.

---

## 🤝 Contributing
We welcome contributions! Please open an issue or submit a pull request with your proposed changes.

---

## 📜 License
This project is licensed under the SST License.

---

## 💬 Feedback
We value your input. Share your thoughts via the feedback option in the extension or contact us directly through this repository.
