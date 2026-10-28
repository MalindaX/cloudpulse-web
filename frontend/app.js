// CloudPulse Client Dashboard Script
const API_BASE = window.location.port === '5000' || window.location.port === '80'
  ? ''
  : 'http://localhost:5000';

const systemBadge = document.getElementById('system-badge');
const badgeText = document.getElementById('badge-text');
const pingValue = document.getElementById('ping-value');
const uptimeValue = document.getElementById('uptime-value');
const memoryValue = document.getElementById('memory-value');
const memorySub = document.getElementById('memory-sub');
const nodeVersion = document.getElementById('node-version');
const hostnameValue = document.getElementById('hostname-value');
const logTerminal = document.getElementById('log-terminal');

// Logging helper
function appendLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${timestamp}] ${message}`;
  logTerminal.appendChild(entry);
  logTerminal.scrollTop = logTerminal.scrollHeight;
}

// Format seconds into human readable duration
function formatUptime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

// Fetch Health and Status
async function checkHealth() {
  const startTime = performance.now();
  try {
    const healthRes = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    const latency = Math.round(performance.now() - startTime);

    if (healthRes.ok) {
      const healthData = await healthRes.json();
      systemBadge.className = 'badge badge-up';
      badgeText.textContent = 'ONLINE (200 OK)';
      pingValue.textContent = `${latency} ms`;
      uptimeValue.textContent = formatUptime(healthData.uptime);
    } else {
      throw new Error(`HTTP ${healthRes.status}`);
    }

    // Fetch system detailed status
    const statusRes = await fetch(`${API_BASE}/api/status`, { cache: 'no-store' });
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      memoryValue.textContent = `${statusData.memory.heapUsedMb} MB`;
      memorySub.textContent = `RSS: ${statusData.memory.rssMb} MB`;
      nodeVersion.textContent = statusData.nodeVersion;
      hostnameValue.textContent = `Host: ${statusData.hostname}`;
    }
  } catch (err) {
    systemBadge.className = 'badge badge-down';
    badgeText.textContent = 'OFFLINE / UNREACHABLE';
    pingValue.textContent = 'ERR';
    memoryValue.textContent = '--';
    appendLog(`Health check failed: ${err.message}`, 'error');
  }
}

// Event Listeners for Simulator Buttons
document.getElementById('btn-ping').addEventListener('click', async () => {
  const start = performance.now();
  appendLog('Sending GET /health ping...', 'info');
  try {
    const res = await fetch(`${API_BASE}/health`);
    const duration = Math.round(performance.now() - start);
    if (res.ok) {
      appendLog(`Response 200 OK (${duration}ms) - Recorded in Prometheus metrics`, 'success');
    } else {
      appendLog(`Response ${res.status} (${duration}ms)`, 'warn');
    }
  } catch (e) {
    appendLog(`Request error: ${e.message}`, 'error');
  }
});

document.getElementById('btn-burst').addEventListener('click', async () => {
  appendLog('Generating burst of 10 requests to backend...', 'info');
  let successCount = 0;
  for (let i = 1; i <= 10; i++) {
    try {
      const res = await fetch(`${API_BASE}/api/simulate-traffic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: i }),
      });
      if (res.ok) successCount++;
    } catch (e) {
      appendLog(`Burst request #${i} failed`, 'error');
    }
  }
  appendLog(`Completed burst: ${successCount}/10 requests registered on Prometheus!`, 'success');
});

document.getElementById('btn-error').addEventListener('click', async () => {
  appendLog('Triggering simulated 500 error...', 'warn');
  try {
    const res = await fetch(`${API_BASE}/api/simulate-error`);
    const data = await res.json();
    appendLog(`Received HTTP ${res.status}: "${data.error}"`, 'error');
  } catch (e) {
    appendLog(`Connection failed: ${e.message}`, 'error');
  }
});

document.getElementById('btn-clear-logs').addEventListener('click', () => {
  logTerminal.innerHTML = '';
  appendLog('Console logs cleared.', 'info');
});

// Initial health check + periodic poll every 4s
checkHealth();
setInterval(checkHealth, 4000);
