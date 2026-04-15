from flask import Flask, request, jsonify, render_template
import os
from backend.ai_models import analyze_password, analyze_url, analyze_email, get_chat_response
from backend.news_feed import get_latest_news

app = Flask(__name__, static_folder='static', template_folder='templates')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/check-password', methods=['POST'])
def check_password():
    data = request.json
    password = data.get('password', '')
    result = analyze_password(password)
    return jsonify(result)

@app.route('/api/check-url', methods=['POST'])
def check_url():
    data = request.json
    url = data.get('url', '')
    result = analyze_url(url)
    return jsonify(result)

@app.route('/api/check-email', methods=['POST'])
def check_email():
    data = request.json
    text = data.get('text', '')
    result = analyze_email(text)
    return jsonify(result)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    query = data.get('query', '')
    response = get_chat_response(query)
    return jsonify({'response': response})

@app.route('/api/news', methods=['GET'])
def get_news():
    news = get_latest_news()
    return jsonify({'news': news})

if __name__ == '__main__':
    # For local development
    app.run(debug=True, port=5000)
