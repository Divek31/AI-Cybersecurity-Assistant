import hashlib
import time

# A simulation of major global data breaches for educational/hackathon purposes
MOCK_BREACH_DB = [
    {
        "name": "LinkedIn (2012)",
        "domain": "linkedin.com",
        "date": "2012-05-05",
        "compromised_data": ["Email addresses", "Passwords"],
        "description": "In 2012, LinkedIn suffered a massive data breach that exposed the passwords of 164 million users."
    },
    {
        "name": "Adobe (2013)",
        "domain": "adobe.com",
        "date": "2013-10-04",
        "compromised_data": ["Email addresses", "Passwords", "Password hints", "Usernames"],
        "description": "Adobe's database was breached, compromising 153 million accounts and exposing encrypted passwords."
    },
    {
        "name": "MyFitnessPal (2018)",
        "domain": "myfitnesspal.com",
        "date": "2018-02-01",
        "compromised_data": ["Email addresses", "IP addresses", "Passwords"],
        "description": "Under Armour disclosed a breach of MyFitnessPal affecting 144 million users."
    },
    {
        "name": "Canva (2019)",
        "domain": "canva.com",
        "date": "2019-05-24",
        "compromised_data": ["Email addresses", "Passwords", "Names", "Geographic locations"],
        "description": "Graphic design tool Canva suffered a breach impacting 137 million users. Passwords were exchanged via bcrypt."
    },
    {
        "name": "Collection #1 (Botnet Drop)",
        "domain": "unknown",
        "date": "2019-01-17",
        "compromised_data": ["Email addresses", "Passwords"],
        "description": "A massive collection of credential stuffing lists found on hacking forums containing 773 million unique email addresses."
    }
]

def check_email_breach(email):
    """
    Simulates checking an email against a Deep Web / OSINT data breach index.
    In a true production environment, this would hit the HaveIBeenPwned API directly.
    """
    
    email = email.lower().strip()
    
    # We use a deterministic hash to ensure the "simulation" returns consistent
    # results for the same email address, making the demonstration feel entirely real.
    hash_obj = hashlib.md5(email.encode())
    hash_val = int(hash_obj.hexdigest(), 16)
    
    found_breaches = []
    
    # "Clean" addresses - we force some standard emails to be clean for demo testing
    if "admin" in email or "secure" in email or hash_val % 3 == 0:
        return {
            "email": email,
            "breached": False,
            "breach_count": 0,
            "breaches": []
        }
    
    # Assign specific breaches based on the deterministic hash modulo
    if hash_val % 2 == 0:
        found_breaches.append(MOCK_BREACH_DB[0]) # LinkedIn
    if hash_val % 4 == 1:
        found_breaches.append(MOCK_BREACH_DB[1]) # Adobe
    if hash_val % 5 == 2:
        found_breaches.append(MOCK_BREACH_DB[2]) # MyFitnessPal
    if hash_val % 7 == 3:
        found_breaches.append(MOCK_BREACH_DB[3]) # Canva
    
    # Rare major botnet hit
    if hash_val % 10 == 0:
        found_breaches.append(MOCK_BREACH_DB[4]) 
        
    # Fallback to at least one breach if the modulo math skipped them but it wasn't flagged clean
    if not found_breaches:
        found_breaches.append(MOCK_BREACH_DB[0])

    return {
        "email": email,
        "breached": True,
        "breach_count": len(found_breaches),
        "breaches": found_breaches
    }
