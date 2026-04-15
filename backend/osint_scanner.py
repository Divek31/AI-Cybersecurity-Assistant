import requests
import socket
import re

def analyze_ip_domain(query):
    query = query.strip().lower()
    
    # Simple check if it's a domain instead of an IP. 
    # If domain, ip-api.com resolves it natively, but sometimes requires cleaning.
    query = query.replace('http://', '').replace('https://', '')
    query = query.split('/')[0] # Remove paths
    
    url = f"http://ip-api.com/json/{query}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query"
    
    try:
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if data.get('status') == 'success':
            return {
                "success": True,
                "ip": data.get('query'),
                "country": data.get('country'),
                "countryCode": data.get('countryCode'),
                "region": data.get('regionName'),
                "city": data.get('city'),
                "lat": data.get('lat'),
                "lon": data.get('lon'),
                "isp": data.get('isp'),
                "org": data.get('org'),
                "asn": data.get('as'),
                "timezone": data.get('timezone')
            }
        else:
            return {
                "success": False,
                "error": data.get('message', 'Invalid IP or Domain')
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": "Failed to connect to OSINT API. Please check your internet connection."
        }
