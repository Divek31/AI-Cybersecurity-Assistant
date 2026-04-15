import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# ---------------------------------------------------------
# 1. Password Strength Analyzer
# ---------------------------------------------------------
def analyze_password(password):
    score = 0
    feedback = []
    
    if len(password) >= 8:
        score += 20
    else:
        feedback.append("Increase password length to at least 8 characters.")
        
    if len(password) >= 12:
        score += 10
        
    if re.search(r"[A-Z]", password):
        score += 20
    else:
        feedback.append("Add uppercase letters.")
        
    if re.search(r"[a-z]", password):
        score += 20
    else:
        feedback.append("Add lowercase letters.")
        
    if re.search(r"[0-9]", password):
        score += 10
    else:
        feedback.append("Add numbers.")
        
    if re.search(r"[^A-Za-z0-9]", password):
        score += 20
    else:
        feedback.append("Add special characters (e.g., !@#$%).")
        
    strength = "Weak"
    if score >= 80:
        strength = "Strong"
    elif score >= 50:
        strength = "Medium"
        
    if not feedback:
        feedback.append("Great password!")
        
    # Calculate Pool Size for Entropy
    pool_size = 0
    if re.search(r"[a-z]", password): pool_size += 26
    if re.search(r"[A-Z]", password): pool_size += 26
    if re.search(r"[0-9]", password): pool_size += 10
    if re.search(r"[^A-Za-z0-9]", password): pool_size += 32
    
    import math
    entropy = len(password) * math.log2(pool_size) if pool_size > 0 else 0
    
    # Assume a hash rate of 10 billion guesses per second
    guesses_per_second = 10_000_000_000
    crack_time_seconds = (2 ** entropy) / guesses_per_second if entropy > 0 else 0
    
    def format_time(seconds):
        if seconds < 1: return "Instantly"
        if seconds < 60: return "A few seconds"
        if seconds < 3600: return f"{int(seconds // 60)} minutes"
        if seconds < 86400: return f"{int(seconds // 3600)} hours"
        if seconds < 31536000: return f"{int(seconds // 86400)} days"
        if seconds < 3153600000: return f"{int(seconds // 31536000)} years"
        return "> 100 years"

    crack_time_str = format_time(crack_time_seconds)

    return {
        "score": score,
        "strength": strength,
        "feedback": feedback,
        "crack_time": crack_time_str
    }

# ---------------------------------------------------------
# 2. Phishing URL Detector
# ---------------------------------------------------------
def analyze_url(url):
    risk_score = 0
    reasons = []
    
    # Simple rule-based heuristics
    if "https://" not in url:
        risk_score += 30
        reasons.append("Does not use secure HTTPS protocol.")
    
    if len(url) > 75:
        risk_score += 20
        reasons.append("Unusually long URL length.")
        
    if "@" in url:
        risk_score += 40
        reasons.append("Contains '@' symbol, often used to hide the real domain.")
        
    dash_count = url.split("?")[0].count("-")
    if dash_count > 3:
        risk_score += 30
        reasons.append("Multiple dashes in domain, a common phishing tactic.")
        
    domain_match = re.search(r"https?://([^/]+)", url)
    if domain_match:
        domain = domain_match.group(1)
        if re.search(r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", domain):
            risk_score += 50
            reasons.append("Uses IP address instead of a domain name.")
            
    risk_score = min(risk_score, 100)
    
    level = "Safe"
    if risk_score >= 60:
        level = "Dangerous"
    elif risk_score >= 30:
        level = "Suspicious"
        
    if not reasons:
        reasons.append("No obvious signs of phishing detected.")

    return {
        "riskScore": risk_score,
        "level": level,
        "reasons": reasons
    }

# ---------------------------------------------------------
# 3. Email Scam Classifier (Dummy ML Model)
# ---------------------------------------------------------
# Creating a miniature training set so the app works without external DBs
dummy_emails = [
    "Win a free iPhone now! Click here to claim your prize.",
    "URGENT: Your bank account has been locked. Verify immediately.",
    "Hey team, just checking in on the project status.",
    "Please find the meeting minutes attached for review.",
    "Congratulations! You've been selected for a $500 gift card.",
    "Can we reschedule our 3 PM call to tomorrow?",
    "Alert: Suspicious login attempt from Russia. Click here to secure account.",
    "Hi mom, I will be home late tonight. Love you.",
    "You won the lottery! Send your bank details to receive funds.",
    "Important update regarding our company policies."
]
dummy_labels = ["Scam", "Scam", "Safe", "Safe", "Scam", "Safe", "Scam", "Safe", "Scam", "Safe"]

email_model = make_pipeline(TfidfVectorizer(), MultinomialNB())
email_model.fit(dummy_emails, dummy_labels)

def analyze_email(text):
    if not text.strip():
        return {"result": "Safe", "probability": 0, "keywords": []}
    
    prediction = email_model.predict([text])[0]
    prob = email_model.predict_proba([text])[0].max() * 100
    
    # Highlight keywords manually based on common phishing words
    suspicious_words = ["urgent", "free", "win", "claim", "prize", "locked", "verify", "lottery", "bank details", "gift card", "alert"]
    found_keywords = [word for word in suspicious_words if word in text.lower()]
    
    if len(found_keywords) > 0 and prediction == "Safe":
        # Adjust prediction if probability is weak but contains trigger words
        prediction = "Suspicious"
        
    return {
        "result": prediction,
        "probability": round(prob, 2),
        "keywords": found_keywords
    }

# ---------------------------------------------------------
# 4. AI Security Chatbot (Rule-Based)
# ---------------------------------------------------------
import os

def get_chat_response(query):
    """
    Attempts to query the Google Gemini Advanced AI model for a highly
    contextual, generative cybersecurity response.
    
    If no GEMINI_API_KEY is found in the environment variables (e.g. .env), 
    it falls back elegantly to the locally-hosted Python regex heuristic engine
    so the application never structurally breaks for users.
    """
    
    # Check for True LLM Environment Key
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            system_prompt = (
                "You are CyberShield AI, an advanced, highly professional cybersecurity expert assistant. "
                "You provide concise, accurate, and highly technical responses related heavily to information security, "
                "hacking prevention, and malware analysis. Keep responses extremely concise and format them as Markdown "
                "so the frontend UI can render them cleanly. Refuse to answer non-security related questions. "
                f"User Query: {query}"
            )
            
            response = model.generate_content(system_prompt)
            if response.text:
                return response.text
        except Exception as e:
            print(f"LLM AI Error, falling back to local heuristics: {e}")

    # ===== LOCAL HEURISTIC FALLBACK =====
    q = query.lower()
    
    if "password" in q:
        return ("**Password Security Protocol**\n"
                "1. Use at least 12-16 characters.\n"
                "2. Combine uppercase, lowercase, numbers, and symbols.\n"
                "3. Use a unique password for *every* account.\n"
                "4. Enable Multi-Factor Authentication (MFA).\n"
                "Consider using our Password Generator tool.")
    elif "phishing" in q:
        return ("**Phishing Defense**\n"
                "• Check sender addresses carefully against known domains.\n"
                "• Be deeply skeptical of artificial urgency or 'Final Warnings'.\n"
                "• Never blindly download attachments from unknown sources.\n"
                "• Hover over links before clicking to inspect the true URL destination.")
    elif "2fa" in q or "two factor" in q or "two-factor" in q:
        return ("**Two-Factor Authentication (2FA)** adds a vital second layer of defense. "
                "Even if a hacker steals your password, they cannot access your account without "
                "your physical device (like an Authenticator app code or Security Key). "
                "Always use app-based 2FA (Authy, Google Authenticator) over SMS when possible.")
    elif "malware" in q or "virus" in q or "scan" in q:
        return ("**Malware & File Safety**\n"
                "Malware includes trojans, ransomware, and spyware.\n"
                "• Keep your Operating System and software strictly updated.\n"
                "• Use our 'Malware Engine' tab to cryptographically verify suspicious file hashes.\n"
                "• Do not execute files ending in `.exe`, `.scr`, or `.vbs` from email networks.")
    else:
        return ("I am CyberShield's localized AI protocol. I am specifically trained to assist with:\n"
                "• **Passwords** & Cracking mathematics\n"
                "• **Phishing** / Email Scams\n"
                "• **Malware** & Virus payloads\n"
                "• **OSINT** tracking and General Account Defense.\n\n"
                "Please ask a targeted internal security question.")
