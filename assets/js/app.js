// =============================================
// OjolKIR - Core App (Router, API, Utils)
// =============================================

const API_URL = 'api';
let currentPage = 'dashboard';
let deferredInstall = null;

// ===== ROUTER =====
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  currentPage = page;
  if (page === 'dashboard') loadDashboard();
  if (page === 'riwayat') loadRiwayat();
  if (page === 'analitik') loadAnalitik();
  window.scrollTo(0, 0);
}

// ===== TOAST =====
function showToast(msg, type = 'success', ms = 3200) {
  const wrap = document.getElementById('toastWrap');
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span style="font-size:1rem;flex-shrink:0">${icons[type]}</span><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.style.animation = 'fadeOut .28s forwards'; setTimeout(() => el.remove(), 300); }, ms);
}

// ===== API =====
async function apiFetch(endpoint, opts = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  try {
    const res = await fetch(API_URL + cleanEndpoint, {
      headers: { 'Content-Type': 'application/json' },
      ...opts
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return { status: 'error', message: 'Respon server bukan format JSON: ' + text };
    }
  } catch (err) {
    return { status: 'error', message: 'Tidak dapat terhubung ke server/offline' };
  }
}

// ===== FORMAT =====
function formatRp(n) {
  return 'Rp ' + (parseInt(n) || 0).toLocaleString('id-ID');
}

function formatTanggal(str) {
  const d = new Date(str);
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

// ===== PWA INSTALL =====
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstall = e;
  const banner = document.getElementById('installBanner');
  if (banner) banner.classList.remove('hidden');
});

window.addEventListener('appinstalled', () => {
  showToast('OjolKIR berhasil diinstall! 🎉', 'success', 4000);
  const banner = document.getElementById('installBanner');
  if (banner) banner.classList.add('hidden');
  deferredInstall = null;
});

function installApp() {
  if (!deferredInstall) return showToast('Buka di Chrome Android untuk install', 'info');
  deferredInstall.prompt();
  deferredInstall.userChoice.then(c => {
    if (c.outcome === 'accepted') showToast('Menginstall OjolKIR...', 'info');
    deferredInstall = null;
  });
}

// ===== NETWORK STATUS =====
function updateNet() {
  const dot = document.getElementById('netDot');
  const txt = document.getElementById('netTxt');
  if (dot && txt) {
    if (navigator.onLine) { dot.style.background = 'var(--primary)'; txt.textContent = 'Online'; }
    else { dot.style.background = 'var(--warning)'; txt.textContent = 'Offline'; }
  }
}
window.addEventListener('online', updateNet);
window.addEventListener('offline', () => { updateNet(); showToast('Koneksi terputus', 'warning'); });

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.addEventListener('click', () => navigateTo(t.dataset.page));
  });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  updateNet();
  navigateTo('dashboard');
});
