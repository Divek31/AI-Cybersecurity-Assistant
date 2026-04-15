# CyberShield AI — Security Assistant

CyberShield AI is a full-stack cybersecurity web application built with a Flask backend and a premium, animated frontend. It features real-time threat intelligence tools powered by rule-based heuristic analysis and `scikit-learn` machine learning models.

## Features
- **Password Strength Analyzer**: Real-time evaluation against multiple security parameters, with a strong password generator.
- **Phishing URL Detector**: Advanced heuristics measuring the likelihood of a URL being dangerous, displaying a calculated 0-100 risk score.
- **Email Scam Classifier**: Deep-text evaluation using a trained AI model (TF-IDF + Naive Bayes) to pinpoint phishing and urgent scam language.
- **Local AI Chatbot**: A responsive intelligence chat interface providing guided instructions on staying secure online.
- **Dashboard & History Logging**: All scans are automatically preserved natively in your browser's `localStorage` and mapped out using visually driven responsive SVG charts.

## Technologies Used
- Backend: **Python 3**, **Flask**, **scikit-learn**, **Numpy**
- Frontend: **Vanilla HTML5, CSS3, JS** (Fully custom dark/neon layout without heavy CSS frameworks)
- Local Data Cache: **DOM localStorage API**

## Installation
1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd "AI Cybersecurity Assistant"
   ```
2. Install the necessary Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the locally hosted Flask Server:
   ```bash
   python app.py
   ```
4. Open your browser and navigate to `http://127.0.0.1:5000`

## Disclaimer
Note: The scikit-learn models implemented are simple internal demonstrations utilizing TF-IDF. This project is intended for educational purposes and should not be relied upon as absolute definitive security for production or enterprise systems.
