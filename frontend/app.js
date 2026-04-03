const API = "http://127.0.0.1:8000";
let shapChart = null;
let jwtToken = localStorage.getItem("jwt_token") || null;

async function checkAuth() {
    if (jwtToken) {
        document.getElementById("screen-login").style.display = "none";
        document.getElementById("main-nav").style.display = "flex";
        document.getElementById("controls-bar").style.display = "flex";
        document.getElementById("app-content").style.display = "block";
        return true;
    } else {
        document.getElementById("screen-login").style.display = "flex";
        document.getElementById("main-nav").style.display = "none";
        document.getElementById("controls-bar").style.display = "none";
        document.getElementById("app-content").style.display = "none";
        return false;
    }
}

async function performLogin() {
    const user = document.getElementById("login-user").value;
    const pass = document.getElementById("login-pass").value;
    const errDiv = document.getElementById("login-error");
    const btn = document.getElementById("btn-login");
    errDiv.style.display = "none";
    btn.innerText = "Logging in...";

    try {
        const res = await fetch(`${API}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });
        
        if (res.ok) {
            const data = await res.json();
            jwtToken = data.access_token;
            localStorage.setItem("jwt_token", jwtToken);
            localStorage.setItem("logged_in_user", user);
            
            let sel = document.getElementById("worker-select");
            if(sel.querySelector(`option[value="${user}"]`)) {
                sel.value = user;
            }
            sel.disabled = true;
            
            await checkAuth();
            showScreen('dashboard');
            loadDashboard();
        } else {
            errDiv.style.display = "block";
        }
    } catch (e) {
        errDiv.style.display = "block";
    }
    btn.innerText = "Login";
}

function logout() {
    jwtToken = null;
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("logged_in_user");
    document.getElementById("worker-select").disabled = false;
    checkAuth();
}

// ── Init ──
async function init() {
    const res = await fetch(`${API}/workers`);
    const workers = await res.json();
    const sel = document.getElementById("worker-select");
    workers.forEach(w => {
        const opt = document.createElement("option");
        opt.value = w.id;
        opt.innerText = `${w.id} (${w.category})`;
        sel.appendChild(opt);
    });
    sel.addEventListener("change", () => loadDashboard());
    
    // Auth Check
    if (await checkAuth()) {
        const loggedUser = localStorage.getItem("logged_in_user");
        if (loggedUser && sel.querySelector(`option[value="${loggedUser}"]`)) {
            sel.value = loggedUser;
        }
        sel.disabled = true;
        
        if (workers.length) loadDashboard();
    }
}

// ── Screen Nav ──
function showScreen(name) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(`screen-${name}`).classList.add("active");
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => {
        if (t.textContent.toLowerCase().includes(name.substring(0, 4))) t.classList.add("active");
    });
    if (name === "history") loadHistory();
    if (name === "premium") loadPremium();
    if (name === "audit") loadAudit();
    if (name === "exclusions") loadExclusions();
    if (name === "alerts") { loadStopLoss(); loadDrift(); }
}

// ── Geolocation ──
async function useLiveLocation() {
    if ("geolocation" in navigator) {
        const btn = document.getElementById("btn-live-loc");
        if(btn) btn.innerText = "Locating...";
        
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const wid = document.getElementById("worker-select").value;
            
            let locName = "Your Live Location";
            try {
                const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    locName = geoData.locality || geoData.city || geoData.principalSubdivision || locName;
                }
            } catch (e) {}
            
            try {
                await fetch(`${API}/api/set_user_location/${wid}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ lat, lon, location_name: locName })
                });
                if(btn) btn.innerText = "📍 " + locName.substring(0, 15);
                loadDashboard();
            } catch (e) {
                if(btn) btn.innerText = "📍 Error";
            }
        }, (error) => {
            alert("Geolocation denied or unavailable.");
            if(btn) btn.innerText = "📍 Use My Live Location";
        });
    } else {
        alert("Geolocation not supported.");
    }
}

// ── 1. Dashboard ──
async function loadDashboard() {
    const wid = document.getElementById("worker-select").value;
    const res = await fetch(`${API}/dashboard/${wid}`);
    const d = await res.json();
    const s = d.state;

    // CDI Gauge
    const cdi = s.final_cdi || s.raw_cdi || 0;
    document.getElementById("cdi-val").textContent = cdi.toFixed(1);
    const ring = document.getElementById("cdi-ring");
    const pct = Math.min(cdi, 100);
    const color = cdi < 50 ? "var(--green)" : cdi < 75 ? "var(--yellow)" : "var(--red)";
    ring.style.background = `conic-gradient(${color} ${pct * 3.6}deg, var(--surface2) 0deg)`;

    // Weather Box
    if (d.current_weather) {
        document.getElementById("w-rain").textContent = `${d.current_weather.rainfall.toFixed(1)} mm/hr`;
        document.getElementById("w-wind").textContent = `${d.current_weather.wind_speed.toFixed(1)} km/h`;
        document.getElementById("w-vis").textContent = `${d.current_weather.visibility.toFixed(1)} km`;
        document.getElementById("weather-location").innerHTML = `📍 Location: <b>${d.current_weather.pincode || "400001"}</b><br/>Lat: ${d.current_weather.lat.toFixed(4)}, Lon: ${d.current_weather.lon.toFixed(4)}`;
        document.getElementById("weather-source").innerHTML = `📡 Live Data Source: <b>${d.current_weather.source || "api.open-meteo.com"}</b>`;
    }

    // Trust
    const ts = s.trust_score ?? 1.0;
    const trustDiv = document.getElementById("trust-indicator");
    const trustPct = document.getElementById("trust-pct");
    trustPct.textContent = `${(ts * 100).toFixed(0)}%`;
    if (ts >= 0.7) {
        trustDiv.className = "trust-badge trust-green";
        document.querySelector("#trust-indicator .trust-label").textContent = "Verified";
    } else if (ts >= 0.3) {
        trustDiv.className = "trust-badge trust-yellow";
        document.querySelector("#trust-indicator .trust-label").textContent = "Flagged";
    } else {
        trustDiv.className = "trust-badge trust-red";
        document.querySelector("#trust-indicator .trust-label").textContent = "Failed";
    }

    // Exclusions
    const excDiv = document.getElementById("exclusion-status");
    if (s.state === "REJECTED" && s.exclusion_detail) {
        excDiv.className = "exclusion-fail";
        excDiv.innerHTML = `<span class="status-icon">🚫</span><span>Exclusion Active: ${s.exclusion_detail}</span>`;
    } else {
        excDiv.className = "exclusion-ok";
        excDiv.innerHTML = `<span class="status-icon">✅</span><span>Coverage Active – No exclusions detected</span>`;
    }

    // Financials
    document.getElementById("dash-prem-total").textContent = `₹${d.premium}`;
    document.getElementById("dash-prem-today").textContent = `₹${d.today_premium_paid}`;
    document.getElementById("dash-max-payout").textContent = `₹${d.weekly_max_payout}`;

    // Disruption banner
    const banner = document.getElementById("disruption-banner");
    const layout = document.getElementById("disruption-card");
    const payoutInfo = document.getElementById("payout-info");
    if (["RELEASED", "DISRUPTION_CONFIRMED", "CALCULATING_PAYOUT", "STOP_LOSS_CHECK", "COMPLIANCE_SWEEP"].includes(s.state)) {
        banner.className = "disruption-active";
        banner.innerHTML = `⚠️ ACTIVE DISRUPTION! (${s.state})`;
        payoutInfo.classList.remove("hidden");
        document.getElementById("acc-payout").textContent = (s.accumulated_payout || 0).toFixed(2);
        document.getElementById("hours-active").textContent = (s.hours_active || 0).toFixed(2);
    } else {
        banner.className = "disruption-inactive";
        banner.innerHTML = `<span>No active disruption. Waiting.</span>`;
        payoutInfo.classList.add("hidden");
    }
}

// ── 2. Payout History ──
async function loadHistory() {
    const wid = document.getElementById("worker-select").value;
    const res = await fetch(`${API}/payout_history/${wid}`);
    const events = await res.json();
    
    let html = "";
    events.forEach(e => {
        let break_str = Object.entries(e.breakdown).map(([k,v]) => `${k}:${v}`).join(' | ');
        html += `<div class="history-card">
            <div class="hc-header">
                <span>Event ${e.event_id} (${e.date})</span>
                <span>Payout: ₹${e.payout.toFixed(2)}</span>
            </div>
            <div class="hc-body">
                <div><strong>CDI:</strong> ${e.raw_cdi} → ${e.final_cdi} (Final)</div>
                <div><span class="badge-pass">Exclusion Check: PASS</span></div>
                <div><strong>${e.trust_text}</strong></div>
            </div>
            <div class="hc-breakdown">Trigger variables: ${break_str}</div>
            <button class="btn" style="background:var(--bg); border:1px solid var(--border); color:var(--text2); align-self:flex-start; margin-top:4px;" onclick="showScreen('audit')">View full timeframe audit trail</button>
        </div>`;
    });
    document.getElementById("history-list").innerHTML = html;
}

// ── 3. Premium Explanation ──
async function loadPremium() {
    const wid = document.getElementById("worker-select").value;
    const res = await fetch(`${API}/premium_explanation/${wid}`);
    const d = await res.json();
    
    document.getElementById("fairness-note").textContent = `Fairness Note: ${d.fairness_note}`;
    document.getElementById("premium-text").textContent = d.explanation;
    document.getElementById("fc-prob").textContent = `${d.forecast_7d.disruption_probability}%`;
    document.getElementById("fc-rain").textContent = `${d.forecast_7d.avg_rainfall_pred} mm/hr`;

    const ctx = document.getElementById("shapChart").getContext("2d");
    if (shapChart) shapChart.destroy();
    const labels = Object.keys(d.shap_breakdown);
    const data = Object.values(d.shap_breakdown);
    const colors = data.map(v => v >= 0 ? "rgba(255,107,107,0.7)" : "rgba(0,184,148,0.7)");
    shapChart = new Chart(ctx, {
        type: "bar",
        data: { labels, datasets: [{ label: "SHAP Impact (₹)", data, backgroundColor: colors, borderRadius: 4 }] },
        options: {
            indexAxis: "y", plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#8b90a5" } },
                y: { grid: { display: false }, ticks: { color: "#e1e4ed", font: { size: 10 } } },
            },
        },
    });

    const feats = d.features || {};
    let ht = `<table class="feature-table"><tr><th>Feature</th><th>Actual Value</th><th>Premium Impact</th></tr>`;
    for (const k of labels) ht += `<tr><td>${k}</td><td>${feats[k] !== undefined ? feats[k] : "–"}</td><td style="color:${d.shap_breakdown[k] >= 0 ? "var(--red)" : "var(--green)"}">${d.shap_breakdown[k] >= 0 ? '+' : ''}${d.shap_breakdown[k].toFixed(2)}</td></tr>`;
    ht += `</table>`;
    document.getElementById("feature-details").innerHTML = ht;
}

// ── 4. Audit Trail ──
async function loadAudit() {
    const wid = document.getElementById("worker-select").value;
    const res = await fetch(`${API}/claim_audit/${wid}`);
    const d = await res.json();
    const container = document.getElementById("audit-timeline");
    if (!d.intervals || !d.intervals.length) {
        container.innerHTML = `<p style="color:var(--text2)">No events on record this week. Trigger a simulation and tick intervals to record one.</p>`;
        return;
    }
    let html = `<div class="audit-timeline">`;
    d.intervals.forEach((iv, idx) => {
        const stateClass = iv.state === "RELEASED" ? "state-released" : iv.state === "REJECTED" ? "state-rejected" : iv.state === "FLAGGED" ? "state-flagged" : "state-monitoring";
        html += `<div class="audit-row">
            <div class="timeline-dot"></div>
            <div class="audit-row-header">
                <strong>Int. ${idx+1} (${iv.timestamp?.substring(11, 16) || "–"})</strong>
                <span class="state-base ${stateClass}">${iv.state}</span>
            </div>
            <div class="audit-row-body">
                <div>CDI: ${iv.raw_cdi?.toFixed(1)} → ${iv.final_cdi?.toFixed(1)}</div>
                <div>Peer Data: <span style="color:var(--yellow)">${iv.peer_info}</span> (${(iv.trust_score*100).toFixed(0)}% trust)</div>
                <div>Exclusion Check: <span style="color:var(--green)">${iv.exclusion_log}</span></div>
                <div>Payout earned: ₹${iv.payout_increment?.toFixed(2)}</div>
            </div>
        </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

// ── 5. Exclusions ──
async function loadExclusions() {
    const res = await fetch(`${API}/exclusions`);
    const d = await res.json();
    let html = `<div class="exclusion-group"><h3>Standard Insurance Exclusions</h3>`;
    d.standard.forEach(e => { html += `<div class="exclusion-item"><span class="exclusion-code">${e.code}</span><span>${e.description}</span></div>`; });
    html += `</div><div class="exclusion-group"><h3>Product-Specific Exclusions</h3>`;
    d.product_specific.forEach(e => { html += `<div class="exclusion-item"><span class="exclusion-code">${e.code}</span><span>${e.description}</span></div>`; });
    html += `</div>`;
    document.getElementById("exclusions-content").innerHTML = html;
}

// ── 6. Alerts ──
async function loadStopLoss() {
    const res = await fetch(`${API}/admin/stop_loss_status`);
    const d = await res.json();
    document.getElementById("risk-json").textContent = JSON.stringify(d, null, 2);
}
async function loadDrift() {
    const res = await fetch(`${API}/admin/drift_check`);
    const d = await res.json();
    document.getElementById("drift-json").textContent = JSON.stringify(d, null, 2);
}

// ── Sim ──
async function triggerRain() { 
    await fetch(`${API}/simulate/start_rain`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: "{}" 
    }); 
    loadDashboard(); 
}
async function triggerFlood() { await fetch(`${API}/simulate/flood`, { method: "POST" }); loadDashboard(); }
async function triggerPandemic() { await fetch(`${API}/simulate/pandemic`, { method: "POST" }); await fetch(`${API}/simulate/tick`, { method: "POST" }); loadDashboard(); }
async function triggerSpoof() { const wid = document.getElementById("worker-select").value; const res = await fetch(`${API}/simulate/spoof_gps/${wid}`, { method: "POST" }); const d = await res.json(); alert(`Spoof: ${d.result} — ${d.reason}`); loadDashboard(); }
async function tickInterval() { await fetch(`${API}/simulate/tick`, { method: "POST" }); loadDashboard(); }
async function resetSim() { await fetch(`${API}/simulate/reset`, { method: "POST" }); loadDashboard(); }

init();
