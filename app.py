from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os
from backend.ai_models import analyze_password, analyze_url, analyze_email, get_chat_response
from backend.news_feed import get_latest_news
from backend.breach_scanner import check_email_breach
from backend.osint_scanner import analyze_ip_domain
from backend.models import db, User, ScanHistory

app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = 'cyber_shield_ultra_secret_key_change_me_in_production'

# Database Setup
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Login Manager Setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- AUTH ROUTES ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Invalid credentials. Access Denied.')
    return render_template('auth.html')

@app.route('/register', methods=['POST'])
def register():
    username = request.form.get('username')
    password = request.form.get('password')
    
    if User.query.filter_by(username=username).first():
        flash('Username already registered. Please login.')
        return redirect(url_for('login'))
        
    new_user = User(
        username=username,
        password_hash=generate_password_hash(password, method='pbkdf2:sha256')
    )
    db.session.add(new_user)
    db.session.commit()
    login_user(new_user)
    return redirect(url_for('index'))

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# --- CORE PLATFORM ---
@app.route('/')
@login_required
def index():
    return render_template('index.html', username=current_user.username)

# --- API ENDPOINTS ---
@app.route('/api/check-password', methods=['POST'])
@login_required
def check_password_route():
    data = request.json
    pw = data.get('password', '')
    result = analyze_password(pw)
    # Log to DB
    history = ScanHistory(user_id=current_user.id, scan_type='password', scan_input='•'*min(len(pw),16), scan_result=result['strength'], risk_score=result['score'])
    db.session.add(history)
    db.session.commit()
    return jsonify(result)

@app.route('/api/check-url', methods=['POST'])
@login_required
def check_url():
    data = request.json
    url = data.get('url', '')
    result = analyze_url(url)
    # Log to DB
    history = ScanHistory(user_id=current_user.id, scan_type='url', scan_input=url[:255], scan_result=result['level'], risk_score=result['riskScore'])
    db.session.add(history)
    db.session.commit()
    return jsonify(result)

@app.route('/api/check-email', methods=['POST'])
@login_required
def check_email():
    data = request.json
    text = data.get('text', '')
    result = analyze_email(text)
    # Log to DB
    history = ScanHistory(user_id=current_user.id, scan_type='email', scan_input=text[:255], scan_result=result['result'], risk_score=int(result.get('probability', 0)))
    db.session.add(history)
    db.session.commit()
    return jsonify(result)

@app.route('/api/chat', methods=['POST'])
@login_required
def chat():
    data = request.json
    query = data.get('query', '')
    response = get_chat_response(query)
    return jsonify({'response': response})

@app.route('/api/check-breach', methods=['POST'])
@login_required
def check_breach():
    data = request.json
    email = data.get('email', '')
    result = check_email_breach(email)
    
    # Force score mapping for database history logic
    score = 100 if result['breached'] else 0
    scan_result_str = "BREACH FOUND" if result['breached'] else "SAFE"
    
    # Log to DB
    history = ScanHistory(user_id=current_user.id, scan_type='breach', scan_input=email[:255], scan_result=scan_result_str, risk_score=score)
    db.session.add(history)
    db.session.commit()
    
    return jsonify(result)

@app.route('/api/osint', methods=['POST'])
@login_required
def perform_osint():
    data = request.json
    query = data.get('query', '')
    result = analyze_ip_domain(query)
    
    score = 0 if result['success'] else 50
    scan_result_str = result.get('countryCode', 'ERR') if result['success'] else "FAILED"
    
    # Log to DB
    history = ScanHistory(user_id=current_user.id, scan_type='osint', scan_input=query[:255], scan_result=scan_result_str, risk_score=score)
    db.session.add(history)
    db.session.commit()
    
    return jsonify(result)

@app.route('/api/news', methods=['GET'])
@login_required
def get_news():
    news = get_latest_news()
    return jsonify({'news': news})

@app.route('/api/history', methods=['GET'])
@login_required
def get_user_history():
    scans = ScanHistory.query.filter_by(user_id=current_user.id).order_by(ScanHistory.timestamp.desc()).limit(50).all()
    history_list = []
    for s in scans:
        history_list.append({
            'type': s.scan_type,
            'input': s.scan_input,
            'result': s.scan_result,
            'score': s.risk_score,
            'time': s.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        })
    return jsonify({'history': history_list})

@app.route('/api/history/clear', methods=['POST'])
@login_required
def clear_history():
    ScanHistory.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
