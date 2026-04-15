// ======= STATE =======
let scanHistory = [];
let chatHistory = [];

// ======= TABS =======
window.switchTab = function(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
  if(name === 'dashboard') updateDashboard();
  if(name === 'history') renderHistory();
  if(name === 'chatbot' && chatHistory.length === 0) initChat();
};

// ======= CLOCK =======
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toTimeString().slice(0,8);
  document.getElementById('datedisp').textContent = now.toDateString();
}
setInterval(updateClock, 1000); updateClock();

// ======= TOAST =======
window.toast = function(msg, type='info', duration=4000) {
  const icons = {info:'ℹ️', success:'✅', warning:'⚠️', danger:'🚨'};
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  el.onclick = () => el.remove();
  setTimeout(() => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 300);
  }, duration);
};

// ======= UTILS =======
function showLoading(id) { document.getElementById(id).classList.add('show'); }
function hideLoading(id) { document.getElementById(id).classList.remove('show'); }
function showResult(id) { document.getElementById(id).classList.add('show'); }
window.hideResult = function(id) { document.getElementById(id).classList.remove('show'); }

function saveHistory(entry) {
  entry.time = new Date().toLocaleString();
  scanHistory.unshift(entry);
  if(scanHistory.length > 100) scanHistory.pop();
  localStorage.setItem('cyberHistory', JSON.stringify(scanHistory));
}

// ======= PASSWORD ANALYZER =======
let pwVisible = false;
window.togglePwVisibility = function() {
  const inp = document.getElementById('pw-input');
  pwVisible = !pwVisible;
  inp.type = pwVisible ? 'text' : 'password';
};

// Auto update check rules simply on input
document.getElementById('pw-input').addEventListener('input', (e) => {
    const pw = e.target.value;
    const checks = {
      len: pw.length >= 8,
      upper: /[A-Z]/.test(pw),
      lower: /[a-z]/.test(pw),
      num: /[0-9]/.test(pw),
      special: /[^a-zA-Z0-9]/.test(pw),
      long: pw.length >= 12
    };
    const map = { 'cr-len': checks.len, 'cr-upper': checks.upper, 'cr-lower': checks.lower, 'cr-num': checks.num, 'cr-special': checks.special, 'cr-long': checks.long };
    Object.entries(map).forEach(([id, pass]) => {
      const el = document.getElementById(id);
      el.classList.toggle('pass', pass);
      el.classList.toggle('fail', !pass);
    });
});

// Call Flask API when button is clicked
document.getElementById('btn-check-pass').addEventListener('click', async () => {
  const pw = document.getElementById('pw-input').value;
  if (!pw) return toast('Please enter a password', 'warning');
  
  showLoading('pw-loading');
  try {
      const data = await checkPassword(pw);  // From api.js calling backend
      const { score, strength, feedback, crack_time } = data;
      
      const bar = document.getElementById('pw-bar');
      const badge = document.getElementById('pw-badge');
      const scoreText = document.getElementById('pw-score-text');

      bar.style.width = score + '%';
      scoreText.textContent = `Score: ${score}/100`;

      const crackWrap = document.getElementById('pw-crack-wrap');
      const crackText = document.getElementById('pw-crack-time');
      crackWrap.style.display = 'block';
      crackText.textContent = crack_time;

      if(strength === 'Weak') {
        bar.style.background = 'linear-gradient(90deg, #cc1144, #ff3e6c)';
        badge.style.cssText = 'background:rgba(255,62,108,0.15);color:#ff3e6c;border:1px solid rgba(255,62,108,0.4)';
        badge.textContent = '⚠ WEAK';
        toast('Weak password detected! See suggestions.', 'danger', 3000);
      } else if(strength === 'Medium') {
        bar.style.background = 'linear-gradient(90deg, #aa7700, #ffb400)';
        badge.style.cssText = 'background:rgba(255,180,0,0.15);color:#ffb400;border:1px solid rgba(255,180,0,0.4)';
        badge.textContent = '◑ MEDIUM';
      } else {
        bar.style.background = 'linear-gradient(90deg, #007744, #00ff9d)';
        badge.style.cssText = 'background:rgba(0,255,157,0.15);color:#00ff9d;border:1px solid rgba(0,255,157,0.4)';
        badge.textContent = '✓ STRONG';
        toast('Excellent! Your password is very strong.', 'success', 2500);
      }
      
      // Feedback from API
      const el = document.getElementById('pw-suggestions');
      el.innerHTML = `
        <div style="font-family:'Share Tech Mono';font-size:10px;color:var(--text3);letter-spacing:2px;margin-bottom:12px">RECOMMENDATIONS</div>
        <ul class="suggestions-list">${feedback.map(s=>`<li>${s}</li>`).join('')}</ul>
      `;

      await reloadHistoryData(); // Resync from DB
      
  } catch(e) {
      toast('Error analyzing password globally', 'danger');
  } finally {
      hideLoading('pw-loading');
  }
});

window.generatePassword = function() {
  const len = parseInt(document.getElementById('gen-len').value) || 16;
  const useUpper = document.getElementById('gen-upper').checked;
  const useLower = document.getElementById('gen-lower').checked;
  const useNum = document.getElementById('gen-num').checked;
  const useSym = document.getElementById('gen-sym').checked;

  if (!useUpper && !useLower && !useNum && !useSym) {
      toast('Please select at least one character type!', 'warning');
      return;
  }

  let chars = '';
  if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (useNum) chars += '0123456789';
  if (useSym) chars += '!@#$%^&*()-_=+';

  let pw = '';
  // Ensure at least one of each selected type
  if (useUpper) pw += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random()*26)];
  if (useLower) pw += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random()*26)];
  if (useNum) pw += '0123456789'[Math.floor(Math.random()*10)];
  if (useSym) pw += '!@#$%^&*()-_=+'[Math.floor(Math.random()*14)];
  
  while (pw.length < len) {
      pw += chars[Math.floor(Math.random()*chars.length)];
  }
  
  pw = pw.split('').sort(()=>Math.random()-0.5).join('');
  document.getElementById('gen-pw-output').textContent = pw;
  toast('Strong password generated!', 'success', 2000);
};

window.copyGenerated = function() {
  const pw = document.getElementById('gen-pw-output').textContent;
  if(pw === 'Click Generate →') return;
  navigator.clipboard.writeText(pw).then(() => toast('Password copied to clipboard!', 'success', 2000));
};

// ======= URL SCANNER =======
document.getElementById('btn-check-url').addEventListener('click', async () => {
    const raw = document.getElementById('url-input').value.trim();
    if(!raw) { toast('Please enter a URL to scan', 'warning'); return; }

    showLoading('url-loading');
    try {
        const data = await checkUrl(raw); // From api.js
        renderURLResult(raw, data.riskScore, data.level, data.reasons);
        await reloadHistoryData(); 
        
        if(data.level === 'Dangerous') toast('⚠️ Dangerous URL detected! Do not visit.', 'danger');
        else if(data.level === 'Suspicious') toast('Suspicious URL — proceed with caution.', 'warning');
        else toast('URL appears to be safe.', 'success');
    } catch (e) {
        toast('Error interacting with URL API.', 'danger');
    } finally {
        hideLoading('url-loading');
    }
});

function renderURLResult(url, score, verdict, reasonsList) {
  const ringEl = document.getElementById('risk-ring');
  const circum = 440;
  const offset = circum - (score / 100) * circum;
  ringEl.style.strokeDashoffset = offset;
  
  // Safe=green, Suspicious=yellow, Dangerous=red
  const color = verdict === "Safe" ? '#00ff9d' : verdict === "Suspicious" ? '#ffb400' : '#ff3e6c';
  ringEl.style.stroke = color;
  document.getElementById('risk-num').style.color = color;
  document.getElementById('risk-num').textContent = score;

  const badge = document.getElementById('url-verdict');
  const badgeClass = verdict === "Safe" ? 'badge-safe' : verdict === "Suspicious" ? 'badge-warn' : 'badge-danger';
  badge.className = `strength-badge ${badgeClass}`;
  badge.textContent = verdict.toUpperCase();

  // Checks list from Backend reasons
  document.getElementById('url-checks').innerHTML = reasonsList.map(r => `
    <div class="check-item">
      <span class="check-icon">${r.includes('obvious signs') ? '✅' : '❌'}</span>
      <span style="color:${r.includes('obvious signs')?'var(--neon2)':'var(--neon3)'}">${r}</span>
    </div>
  `).join('');

  // Breakdown simply showing URL (with highlighted @ if present)
  let highlighted = url.replace(/(@)/g, '<span class="url-part danger">$1</span>');
  document.getElementById('url-breakdown-wrap').innerHTML = `
    <div style="font-family:'Share Tech Mono';font-size:10px;color:var(--text3);letter-spacing:2px;margin:14px 0 6px">RAW URL</div>
    <div class="url-breakdown">${highlighted}</div>
  `;
  showResult('url-result');
}

// ======= BREACH SCANNER =======
document.getElementById('btn-check-breach').addEventListener('click', async () => {
    const raw = document.getElementById('breach-input').value.trim();
    if(!raw || !raw.includes('@')) { toast('Please enter a valid email address', 'warning'); return; }

    showLoading('breach-loading');
    try {
        const data = await fetchBreach(raw); // From api.js
        renderBreachResult(data);
        await reloadHistoryData(); 
        
        if(data.breached) toast(`⚠️ Critical: Email found in ${data.breach_count} known data breaches!`, 'danger', 5000);
        else toast('Clean! No known breaches found for this email.', 'success', 3000);
    } catch (e) {
        toast('Error interacting with Breach Database.', 'danger');
    } finally {
        hideLoading('breach-loading');
    }
});

function renderBreachResult(data) {
  const badge = document.getElementById('breach-verdict');
  const countText = document.getElementById('breach-count-text');
  const wrap = document.getElementById('breach-hits-wrap');
  
  if (data.breached) {
      badge.className = 'strength-badge badge-danger';
      badge.textContent = '🚨 COMPROMISED';
      countText.textContent = `${data.breach_count} Leaks Detected`;
      countText.style.color = 'var(--neon3)';
      
      let html = '';
      data.breaches.forEach(b => {
          html += `
          <div style="background: rgba(255, 62, 108, 0.05); border: 1px solid rgba(255, 62, 108, 0.2); border-radius: 6px; padding: 12px; margin-bottom: 12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
                  <span style="font-family:'Rajdhani', sans-serif; font-size:15px; font-weight:700; color:var(--text);">${b.name}</span>
                  <span style="font-family:'Share Tech Mono'; font-size:10px; color:var(--neon3);">${b.date}</span>
              </div>
              <div style="font-size:12px; font-family:'Share Tech Mono'; color:var(--text2); margin-bottom:8px; line-height:1.4;">
                  ${b.description}
              </div>
              <div style="font-size:11px; font-family:'Share Tech Mono'; color:var(--text3);">
                  <span style="color:var(--text);">Lost Data:</span> ${b.compromised_data.join(', ')}
              </div>
          </div>
          `;
      });
      wrap.innerHTML = html;
      
  } else {
      badge.className = 'strength-badge badge-safe';
      badge.textContent = '✅ SECURE';
      countText.textContent = '0 Leaks Detected';
      countText.style.color = 'var(--neon2)';
      wrap.innerHTML = `
        <div style="text-align:center; padding: 30px; border: 1px solid var(--border2); border-radius: 6px; background: var(--bg);">
            <div style="font-size: 30px; margin-bottom: 10px;">🛡️</div>
            <div style="font-family:'Share Tech Mono'; font-size: 14px; color:var(--neon2);">NO PUBLIC BREACHES FOUND</div>
            <div style="font-size: 11px; color:var(--text3); margin-top: 6px;">This email hasn't appeared in our database of deep web credential dumps.</div>
        </div>
      `;
  }
  showResult('breach-result');
}

// ======= EMAIL ANALYZER =======
document.getElementById('btn-check-email').addEventListener('click', async () => {
  const text = document.getElementById('email-input').value.trim();
  if(text.length < 1) { toast('Please paste an email text', 'warning'); return; }

  showLoading('email-loading');
  try {
      const data = await checkEmail(text); // Hits Scikit-Learn Model in Backend
      renderEmailResult(text, data.result, data.probability, data.keywords);
      await reloadHistoryData(); 
      
      if(data.result === 'Scam') toast('Scam email detected! Do not respond or click links.', 'danger');
      else if(data.result === 'Suspicious') toast('Suspicious email detected.', 'warning');
      else toast('Email appears to be safe.', 'success');
  } catch (e) {
      toast('Error communicating with ML Server', 'danger');
  } finally {
      hideLoading('email-loading');
  }
});

function renderEmailResult(text, verdict, probability, keywords) {
  const badge = document.getElementById('email-verdict');
  if(verdict === 'Scam') { badge.className='strength-badge badge-danger'; badge.textContent='🚨 SCAM'; }
  else if(verdict === 'Suspicious') { badge.className='strength-badge badge-warn'; badge.textContent='⚠ SUSPICIOUS'; }
  else { badge.className='strength-badge badge-safe'; badge.textContent='✅ SAFE'; }

  // Replace default probs with ML Confidence
  document.getElementById('email-probs').innerHTML = `
    <div class="prob-row">
      <span class="prob-label">ML CONF.</span>
      <div class="prob-bar"><div class="prob-fill" style="width:${probability}%;background:${verdict === 'Scam' ? '#ff3e6c' : '#00ff9d'}"></div></div>
      <span class="prob-pct">${probability.toFixed(1)}%</span>
    </div>
  `;

  const tagsHtml = keywords.map(k=>`<span class="keyword-tag ${verdict==='Scam'?'danger':'warn'}">🔴 ${k}</span>`).join('') 
                   || '<span style="color:var(--text3);font-size:12px;font-family:\'Share Tech Mono\'">No trigger keywords observed</span>';
  document.getElementById('keyword-tags').innerHTML = tagsHtml;

  // Highlight keywords physically in text area preview
  let hl = escapeHtml(text);
  keywords.forEach(k => { hl = hl.replace(new RegExp(escapeHtml(k),'gi'), m => `<span class="hl-danger">${m}</span>`); });
  
  document.getElementById('email-highlighted-wrap').innerHTML = `
    <div style="font-family:'Share Tech Mono';font-size:10px;color:var(--text3);letter-spacing:2px;margin:14px 0 6px">EXCERPT</div>
    <div class="email-highlighted">${hl}</div>
  `;
  showResult('email-result');
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ======= CHATBOT =======
function initChat() {
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = '';
  addBotMessage("🛡 **CyberShield AI online.** I'm your local Flask cybersecurity assistant. Ask me anything about password security, phishing detection, or account safety!");
}

function addBotMessage(text) {
  const chatBox = document.getElementById('chat-box');
  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  div.innerHTML = `
    <div class="chat-avatar">AI</div>
    <div class="chat-bubble">${text.replace(/\*\*(.*?)\*\*/g,'<strong style="color:var(--neon)">$1</strong>').replace(/\n/g,'<br>')}</div>
  `;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addUserMessage(text) {
  const chatBox = document.getElementById('chat-box');
  const div = document.createElement('div');
  div.className = 'chat-msg user';
  div.innerHTML = `
    <div class="chat-avatar">👤</div>
    <div class="chat-bubble">${escapeHtml(text)}</div>
  `;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addTypingIndicator() {
  const chatBox = document.getElementById('chat-box');
  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  div.id = 'typing-indicator';
  div.innerHTML = `
    <div class="chat-avatar">AI</div>
    <div class="chat-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>
  `;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if(el) el.remove();
}

window.sendChat = async function() {
  const inp = document.getElementById('chat-input');
  const msg = inp.value.trim();
  if(!msg) return;
  inp.value = '';

  addUserMessage(msg);
  chatHistory.push({ role:'user', content: msg });
  addTypingIndicator();

  try {
      const data = await sendQuery(msg); // Hits /api/chat
      removeTypingIndicator();
      const reply = data.response || 'I encountered an issue. Please try again.';
      chatHistory.push({ role:'assistant', content:reply });
      addBotMessage(reply);
  } catch(err) {
      removeTypingIndicator();
      addBotMessage('⚠️ Backend API error. Are you running the Flask server?');
  }
};

window.sendChip = function(text) {
  document.getElementById('chat-input').value = text;
  sendChat();
};

// ======= DASHBOARD =======
function updateDashboard() {
  const total = scanHistory.length;
  // Account for both the JS local cases and old backend cases
  const threats = scanHistory.filter(s => ['DANGEROUS','Dangerous','SCAM','Scam','WEAK','Weak'].includes(s.result)).length;
  const safe = scanHistory.filter(s => ['SAFE','Safe','STRONG','Strong'].includes(s.result)).length;
  const pwChecks = scanHistory.filter(s => s.type.toLowerCase() === 'password').length;

  animateCount('stat-total', total);
  animateCount('stat-threats', threats);
  animateCount('stat-safe', safe);
  animateCount('stat-pwchecks', pwChecks);

  // Global Score Logic
  let globalScore = 100;
  if (total > 0) {
      // Base score is safely percentage of scans
      const safeRatio = safe / total;
      globalScore = Math.round(safeRatio * 100);
      
      // Heavily penalize recent absolute threats
      const recentThreats = scanHistory.slice(0, 5).filter(s => ['DANGEROUS','Dangerous','SCAM','Scam'].includes(s.result)).length;
      globalScore = Math.max(0, globalScore - (recentThreats * 15));
  }
  
  const scoreText = document.getElementById('global-score-text');
  const scoreBar = document.getElementById('global-score-bar');
  const scoreMsg = document.getElementById('global-score-msg');
  
  scoreText.textContent = `${globalScore}/100`;
  scoreBar.style.width = `${globalScore}%`;
  
  if (globalScore >= 80) {
      scoreBar.style.background = 'linear-gradient(90deg, #007744, #00ff9d)';
      scoreText.style.color = 'var(--neon2)';
      scoreMsg.textContent = 'Excellent! Your recent scans indicate strong security habits.';
  } else if (globalScore >= 50) {
      scoreBar.style.background = 'linear-gradient(90deg, #aa7700, #ffb400)';
      scoreText.style.color = 'var(--neon4)';
      scoreMsg.textContent = 'Moderate Risk. Consider reviewing some of your flagged items.';
  } else {
      scoreBar.style.background = 'linear-gradient(90deg, #cc1144, #ff3e6c)';
      scoreText.style.color = 'var(--neon3)';
      scoreMsg.textContent = 'High Risk Profile! Multiple critical threats detected recently.';
  }

  renderBarChart();
  renderPieChart();
  renderRecentAlerts();
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  let cur = parseInt(el.textContent) || 0;
  if(cur === target) return;
  const step = Math.max(1, Math.ceil(Math.abs(target - cur) / 10));
  const timer = setInterval(() => {
    if(cur < target) cur = Math.min(cur + step, target);
    else if(cur > target) cur = Math.max(cur - step, target);
    el.textContent = cur;
    if(cur === target) clearInterval(timer);
  }, 30);
}

function renderBarChart() {
  const types = ['url','email','password'];
  const colors = ['var(--neon)', 'var(--neon2)', 'var(--neon4)'];
  const counts = types.map(t => scanHistory.filter(s=>s.type.toLowerCase()===t).length);
  const max = Math.max(...counts, 1);
  const svg = document.getElementById('bar-chart');
  const w = 400, h = 160, pad = 40, barW = 60;
  const bars = types.map((t,i) => {
    const bh = Math.round((counts[i]/max) * (h - pad - 20));
    const x = 50 + i * 120;
    const y = h - pad - bh;
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${bh}" fill="${colors[i]}" opacity="0.7" rx="4"/>
      <text x="${x+barW/2}" y="${y-6}" fill="${colors[i]}" font-size="12" text-anchor="middle" font-family="Orbitron" font-weight="bold">${counts[i]}</text>
      <text x="${x+barW/2}" y="${h-8}" fill="rgba(100,160,200,0.6)" font-size="10" text-anchor="middle" font-family="Share Tech Mono">${t.toUpperCase()}</text>
    `;
  }).join('');
  svg.innerHTML = `<line x1="30" y1="${h-pad}" x2="${w-10}" y2="${h-pad}" stroke="var(--border)" stroke-width="1"/>${bars}`;
}

function renderPieChart() {
  const safe = scanHistory.filter(s=>['SAFE','Safe','STRONG','Strong'].includes(s.result)).length;
  const threats = scanHistory.filter(s=>['DANGEROUS','Dangerous','SCAM','Scam','WEAK','Weak'].includes(s.result)).length;
  const warn = scanHistory.filter(s=>['SUSPICIOUS','Suspicious','SPAM','Spam','MEDIUM','Medium'].includes(s.result)).length;
  const total = safe + threats + warn;
  const svg = document.getElementById('pie-chart');
  const legend = document.getElementById('pie-legend');

  if(total === 0) {
    svg.innerHTML = `<circle cx="70" cy="70" r="55" fill="none" stroke="var(--bg3)" stroke-width="20"/><text x="70" y="75" fill="rgba(0,212,255,0.2)" font-family="Share Tech Mono" font-size="10" text-anchor="middle">NO DATA</text>`;
    legend.innerHTML = '';
    return;
  }

  const slices = [
    { val:safe, color:'#00ff9d', label:'Safe' },
    { val:threats, color:'#ff3e6c', label:'Threat' },
    { val:warn, color:'#ffb400', label:'Warn' }
  ].filter(s=>s.val>0);

  let startAngle = 0;
  const r = 55, cx=70, cy=70;
  let paths = '';
  slices.forEach(s => {
    const angle = (s.val/total)*360;
    const rad1 = (startAngle-90)*Math.PI/180;
    const rad2 = (startAngle+angle-90)*Math.PI/180;
    const x1=cx+r*Math.cos(rad1), y1=cy+r*Math.sin(rad1);
    const x2=cx+r*Math.cos(rad2), y2=cy+r*Math.sin(rad2);
    const large = angle > 180 ? 1 : 0;
    if(angle===360) {
      paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${s.color}" opacity="0.8"/>`;
    } else {
      paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r},0,${large},1,${x2},${y2} Z" fill="${s.color}" opacity="0.8"/>`;
    }
    startAngle += angle;
  });
  paths += `<circle cx="${cx}" cy="${cy}" r="28" fill="var(--bg2)"/>`;
  paths += `<text x="${cx}" y="${cy+4}" fill="var(--text)" font-family="Orbitron" font-size="13" font-weight="bold" text-anchor="middle">${total}</text>`;
  svg.innerHTML = paths;
  legend.innerHTML = slices.map(s=>`<span style="color:${s.color}">${s.label}: ${s.val}</span>`).join('');
}

function renderRecentAlerts() {
  const el = document.getElementById('recent-alerts');
  const threats = scanHistory.filter(s=>['DANGEROUS','Dangerous','SCAM','Scam','WEAK','Weak'].includes(s.result)).slice(0,5);
  if(threats.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div>NO THREATS DETECTED YET</div>';
    return;
  }
  el.innerHTML = threats.map(t=>`
    <div class="check-item">
      <span class="check-icon">🚨</span>
      <div>
        <div style="font-size:13px;color:var(--neon3)">${t.type.toUpperCase()} — ${t.result.toUpperCase()}</div>
        <div style="font-size:11px;font-family:'Share Tech Mono';color:var(--text3);margin-top:2px">${t.input.slice(0,60)} | ${t.time}</div>
      </div>
    </div>
  `).join('');
}

// ======= HISTORY =======
window.renderHistory = function() {
  const el = document.getElementById('history-content');
  if(scanHistory.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div>NO SCAN HISTORY YET</div>';
    return;
  }
  el.innerHTML = `
    <div style="overflow-x:auto">
    <table class="history-table">
      <thead>
        <tr>
          <th>#</th><th>Type</th><th>Input</th><th>Result</th><th>Time</th>
        </tr>
      </thead>
      <tbody>
        ${scanHistory.map((s,i)=>`
          <tr>
            <td style="color:var(--text3);font-family:'Share Tech Mono'">${i+1}</td>
            <td><span style="font-family:'Share Tech Mono';font-size:11px;color:var(--neon)">${s.type.toUpperCase()}</span></td>
            <td style="font-family:'Share Tech Mono';font-size:11px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.input}</td>
            <td><span class="badge ${
              ['SAFE','Safe','STRONG','Strong'].includes(s.result)?'badge-safe':
              ['DANGEROUS','Dangerous','SCAM','Scam','WEAK','Weak'].includes(s.result)?'badge-danger':'badge-warn'
            }">${s.result.toUpperCase()}</span></td>
            <td style="font-family:'Share Tech Mono';font-size:10px;color:var(--text3)">${s.time}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    </div>
  `;
};

window.clearHistory = async function() {
  if(!confirm('Clear all scan history from the database?')) return;
  try {
      await clearDbHistory();
      scanHistory = [];
      renderHistory();
      updateDashboard();
      toast('Remote database scan history cleared.', 'info');
  } catch (err) {
      toast('Failed to clear remote history.', 'danger');
  }
};

async function reloadHistoryData() {
    try {
        const data = await fetchHistory();
        scanHistory = data.history;
        if(document.getElementById('section-dashboard').classList.contains('active')) {
            updateDashboard();
        }
        if(document.getElementById('section-history').classList.contains('active')) {
            renderHistory();
        }
    } catch(err) {
        console.error("Failed to fetch history API");
    }
}

// ======= EXPORT REPORT =======
window.exportReport = function() {
  const now = new Date().toLocaleString();
  const total = scanHistory.length;
  const threats = scanHistory.filter(s=>['DANGEROUS','Dangerous','SCAM','Scam','WEAK','Weak'].includes(s.result)).length;
  const safe = scanHistory.filter(s=>['SAFE','Safe','STRONG','Strong'].includes(s.result)).length;

  let report = `CYBERSHIELD AI — SECURITY REPORT
Generated: ${now}
${'='.repeat(50)}

SUMMARY
Total Scans: ${total}
Threats Detected: ${threats}
Safe Results: ${safe}

${'='.repeat(50)}
SCAN HISTORY
${'='.repeat(50)}
`;
  scanHistory.forEach((s,i) => {
    report += `\n${i+1}. [${s.type.toUpperCase()}] ${s.result} — ${s.input.slice(0,80)}\n   Time: ${s.time}\n`;
  });
  report += `\n${'='.repeat(50)}\nReport generated by CyberShield AI (Flask Backend)\n`;

  const blob = new Blob([report], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `cybershield-report-${Date.now()}.txt`;
  a.click();
  toast('Report exported successfully!', 'success');
};

// ======= INIT =======
document.addEventListener('DOMContentLoaded', async () => {
    await reloadHistoryData();
    updateDashboard();
    loadNewsFeed();
});

// ======= LIVE NEWS FEED =======
async function loadNewsFeed() {
    const container = document.getElementById('news-feed-content');
    try {
        const data = await fetchNews();
        if (!data.news || data.news.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">📡</div>NO FEED DATA AVAILABLE</div>';
            return;
        }
        
        container.innerHTML = data.news.map(item => `
            <a href="${item.link}" target="_blank" style="text-decoration:none; display:block; padding:10px 0; border-bottom:1px solid var(--border2); transition: background 0.2s;">
                <div style="font-size:12px; color:var(--text); font-weight:600; line-height: 1.4; margin-bottom: 4px; font-family:'Rajdhani', sans-serif;">
                    ${item.title}
                </div>
                <div style="font-size:10px; font-family:'Share Tech Mono'; color:var(--text3);">
                    ${item.date.slice(0, 22)}
                </div>
            </a>
        `).join('');
    } catch (err) {
        container.innerHTML = '<div class="empty-state" style="color:var(--neon3)"><div class="empty-icon">⚠️</div>ERROR LOADING FEED</div>';
    }
}
