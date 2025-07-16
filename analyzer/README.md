# 📈 NVIDIA Earnings Call Analyzer

**NVIDIA Earnings Call Analyzer** is a web application that performs sentiment analysis and theme extraction on NVIDIA’s quarterly earnings call transcripts. It provides insights into management sentiment, strategic focus areas, and quarter-over-quarter trends through an interactive dashboard.

---

## 🔍 Overview

This application enables users to:

- Fetch and analyze the latest NVIDIA earnings call transcripts.
- Paste custom transcripts for analysis.
- Toggle between keyword-based and AI-powered sentiment analysis (Google Gemini).
- Visualize historical sentiment trends and key strategic themes.

---

## ✨ Features

- **Transcript Analysis**: Automatically fetch or manually input transcripts for analysis.
- **Dual Analysis Modes**: Choose between keyword-based or Gemini AI-powered analysis.
- **Sentiment Visualization**: View sentiment scores and tone labels.
- **Theme Extraction**: Identify strategic focus areas discussed in calls.
- **Historical Comparison**: Compare sentiment across multiple quarters.
- **Interactive Charts**: Visualize trends and quarter-over-quarter changes.
- **Automatic Fetching**: Fetch recent earnings call transcripts using the Seeking Alpha API.

---

## 🛠️ Technologies Used

- **Frontend**: React.js, Next.js, Tailwind CSS  
- **Data Visualization**: Recharts  
- **AI/NLP**:  
  - Google Gemini API (for AI-driven analysis)  
  - Keyword-based analysis (fallback)

---

## 🔗 APIs Used

- [Seeking Alpha API](https://rapidapi.com/apidojo/api/seeking-alpha) via RapidAPI (for transcript fetching)  
- [Google Gemini API](https://ai.google.dev/) (for advanced NLP analysis)

---

## ⚙️ Installation & Setup

### Prerequisites

- Node.js v18+
- npm or yarn

### Local Setup

```bash
# Clone the repository
git clone https://github.com/healthyxhl23/Analyzer.git
cd analyzer

# Install dependencies
npm install
# or
yarn install
```

### Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
GEMINI_API_KEY=your_gemini_api_key_here
RAPID_API_KEY=your_rapid_api_key_here
```

### Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Then open your browser and navigate to:

```
http://localhost:3000
```

---

## 🚀 Usage

### Analyzing Transcripts

1. Go to the dashboard.
2. Click **"Fetch Recent Transcripts"** or paste your own transcript.
3. Select a quarter (e.g., `Q1 2025`) or enter a custom one.
4. Choose analysis mode: **Keyword** or **AI (Gemini)**.
5. Click **"Analyze Transcript"**.

### Viewing Results

- **Sentiment Cards**: Display sentiment scores, labels, and summaries.
- **Strategic Focus Areas**: Tags extracted from the transcript.
- **Charts** (requires multiple quarters analyzed):
  - **Sentiment Trend** (line chart)
  - **Quarter-over-Quarter Change** (bar chart)

## ⚠️ Assumptions & Limitations

- **AI Analysis** requires a valid Gemini API key; otherwise, keyword mode is used.
- **Transcript Format**: Works best with standard earnings call transcripts.
- **Mock Data**: Used when API keys are missing or requests fail.
- **LocalStorage**: Historical data is stored in browser localStorage.
- **Rate Limits**: Seeking Alpha API is rate-limited.
- **Theme Accuracy**: Keyword-based extraction is less accurate than AI.
- **Browser Support**: Optimized for modern browsers only.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

> **Disclaimer**: This project is not affiliated with NVIDIA Corporation. It is intended for educational and analytical use based on publicly available information.
