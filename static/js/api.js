// Utility functions covering the fetch API interactions with our Flask backend.

const API_BASE = '/api';

/**
 * Sends a password to the backend and returns the analysis.
 * @param {string} password 
 * @returns {Promise<Object>}
 */
async function checkPassword(password) {
    const response = await fetch(`${API_BASE}/check-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    if (!response.ok) throw new Error('API Request Failed');
    return await response.json();
}

/**
 * Sends a URL to the backend and returns the risk analysis.
 * @param {string} url 
 * @returns {Promise<Object>}
 */
async function checkUrl(url) {
    const response = await fetch(`${API_BASE}/check-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    });
    if (!response.ok) throw new Error('API Request Failed');
    return await response.json();
}

/**
 * Sends email text to the backend and returns classification.
 * @param {string} text 
 * @returns {Promise<Object>}
 */
async function checkEmail(text) {
    const response = await fetch(`${API_BASE}/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error('API Request Failed');
    return await response.json();
}

/**
 * Sends chat query to backend.
 * @param {string} query 
 * @returns {Promise<Object>}
 */
async function sendQuery(query) {
    const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    if (!response.ok) throw new Error('API Request Failed');
    return await response.json();
}

async function fetchBreach(email) {
    const response = await fetch(`${API_BASE}/check-breach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    if (!response.ok) throw new Error('API Request Failed');
    return await response.json();
}

async function fetchOsint(query) {
    const response = await fetch(`${API_BASE}/osint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    if (!response.ok) throw new Error('API Request Failed');
    return await response.json();
}

/**
 * Fetches latest security news.
 * @returns {Promise<Object>}
 */
async function fetchNews() {
    const response = await fetch(`${API_BASE}/news`);
    if (!response.ok) throw new Error('API Request Failed');
    return await response.json();
}

async function fetchHistory() {
    const response = await fetch(`${API_BASE}/history`);
    if (!response.ok) throw new Error('API Request Failed');
    return await response.json();
}

async function clearDbHistory() {
    const response = await fetch(`${API_BASE}/history/clear`, { method: 'POST' });
    if (!response.ok) throw new Error('API Request Failed');
    return await response.json();
}
