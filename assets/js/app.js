// =============================================
// DONEFAST Tracer - Core App (Router, API, Utils)
// v2.0 — Premium UI
// =============================================

const API_URL = 'api';
let currentPage = 'dashboard';
let deferredInstall = null;

// ===== ROUTER =====
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.remove('active');
    const i = t.querySelector('i');
    if (i) i.className = i.className.replace('ph-fill', 'ph');
  });

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  const activeTab = document.querySelector(`[data-page="${page}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
    const activeIcon = activeTab.querySelector('i');
    if (activeIcon) activeIcon.className = activeIcon.className.replace(/\bph\b/, 'ph-fill');
  }

  currentPage = page;
  if (page === 'dashboard') loadDashboard();
  if (page === 'riwayat')   loadRiwayat();
  if (page === 'analitik')  loadAnalitik();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== TOAST =====
function showToast(msg, type = 'success', ms = 3200) {
  const wrap = document.getElementById('toastWrap');
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span style="font-size:1.05rem;flex-shrink:0">${icons[type]}</span><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'fadeOut 0.28s var(--ease-out) forwards';
    setTimeout(() => el.remove(), 300);
  }, ms);
}

// ===== RIPPLE EFFECT =====
function addRipple(btn) {
  btn.addEventListener('click', function(e) {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

function initRipples() {
  document.querySelectorAll('.btn').forEach(addRipple);
}

// ===== OFFLINE DATABASE (VIRTUAL BACKEND) =====
const DB_KEY = 'ojolkir_data';
function getDb()        { return JSON.parse(localStorage.getItem(DB_KEY) || '[]'); }
function saveDb(data)   { localStorage.setItem(DB_KEY, JSON.stringify(data)); }

async function apiFetch(endpoint, opts = {}) {
  const cleanEndpoint = endpoint.split('?')[0].replace(/^\/|\.php/g, '');
  const searchParams  = new URLSearchParams(endpoint.split('?')[1] || '');
  const body          = opts.body ? JSON.parse(opts.body) : null;

  let db = getDb();
  const now = new Date();

  const isSameMonth = (d1, m, y) => {
    const d = new Date(d1 + 'T00:00:00');
    return d.getMonth() + 1 === parseInt(m) && d.getFullYear() === parseInt(y);
  };
  const getSum = (arr, key) => arr.reduce((s, item) => s + (Number(item[key]) || 0), 0);

  return new Promise(resolve => {
    setTimeout(() => {
      try {
        // ---- GET DASHBOARD ----
        if (cleanEndpoint.includes('get_dashboard')) {
          const currMonth   = db.filter(d => isSameMonth(d.tanggal, now.getMonth() + 1, now.getFullYear()));
          const pendapatan  = getSum(currMonth, 'pendapatan_kotor');
          const pengeluaran = getSum(currMonth, 'pengeluaran_bensin') + getSum(currMonth, 'pengeluaran_lain');
          const bersih      = pendapatan - pengeluaran;
          const totalJarak  = getSum(db, 'jarak_tempuh_km');

          const chart7hari = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const tglStr = d.toISOString().split('T')[0];
            const p = getSum(db.filter(x => x.tanggal === tglStr), 'pendapatan_kotor');
            chart7hari.push({ tanggal: tglStr, pendapatan: p });
          }

          resolve({
            status: 'success',
            data: {
              pendapatan:  'Rp ' + pendapatan.toLocaleString('id-ID'),
              pengeluaran: 'Rp ' + pengeluaran.toLocaleString('id-ID'),
              bersih:      'Rp ' + bersih.toLocaleString('id-ID'),
              bersih_raw:  bersih,
              total_jarak: Math.round(totalJarak * 10) / 10,
              chart_7hari: chart7hari
            }
          });
        }

        // ---- GET RIWAYAT ----
        else if (cleanEndpoint.includes('get_riwayat')) {
          const bulan    = searchParams.get('bulan')  || (now.getMonth() + 1);
          const tahun    = searchParams.get('tahun')  || now.getFullYear();
          const filtered = db.filter(d => isSameMonth(d.tanggal, bulan, tahun))
                             .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

          const p = getSum(filtered, 'pendapatan_kotor');
          const b = getSum(filtered, 'pengeluaran_bensin');
          const l = getSum(filtered, 'pengeluaran_lain');

          resolve({
            status: 'success',
            data: filtered,
            summary: {
              total_hari:  filtered.length,
              pendapatan:  'Rp ' + p.toLocaleString('id-ID'),
              pengeluaran: 'Rp ' + (b + l).toLocaleString('id-ID'),
              bersih:      'Rp ' + (p - b - l).toLocaleString('id-ID')
            }
          });
        }

        // ---- GET ANALITIK ----
        else if (cleanEndpoint.includes('get_analitik')) {
          const currMonth = db.filter(d => isSameMonth(d.tanggal, now.getMonth() + 1, now.getFullYear()));
          const chart7hari = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const tglStr = d.toISOString().split('T')[0];
            const p = getSum(db.filter(x => x.tanggal === tglStr), 'pendapatan_kotor');
            chart7hari.push({ tanggal: tglStr, pendapatan: p });
          }

          const totalJarak = getSum(db, 'jarak_tempuh_km');
          const p          = getSum(currMonth, 'pendapatan_kotor');
          const b          = getSum(currMonth, 'pengeluaran_bensin');
          const l          = getSum(currMonth, 'pengeluaran_lain');
          const hariAktif  = currMonth.length;
          const rata       = hariAktif > 0 ? (p - b - l) / hariAktif : 0;

          let hariBaik = '-';
          if (hariAktif > 0) {
            const best = [...currMonth].sort((a, bx) => bx.pendapatan_kotor - a.pendapatan_kotor)[0];
            const d    = new Date(best.tanggal + 'T00:00:00');
            const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
            hariBaik   = `${days[d.getDay()]}, ${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`;
          }

          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const proyeksi    = rata * daysInMonth;

          resolve({
            status: 'success',
            data: {
              chart_7hari:    chart7hari,
              total_jarak:    Math.round(totalJarak * 10) / 10,
              rata_harian:    Math.round(rata),
              hari_terbaik:   hariBaik,
              proyeksi_bulan: Math.round(proyeksi),
              hari_aktif:     hariAktif,
              breakdown:      { bensin: b, lain_lain: l }
            }
          });
        }

        // ---- PROSES DATA (INSERT/UPDATE) ----
        else if (cleanEndpoint.includes('proses_data')) {
          let existingIdx       = db.findIndex(x => x.tanggal === body.tanggal);
          const pendapatanKotor = Number(body.pendapatan) || 0;
          const bensin          = Number(body.bensin)     || 0;
          const lain            = Number(body.lain_lain)  || 0;

          if (existingIdx !== -1) {
            db[existingIdx].pendapatan_kotor  = pendapatanKotor;
            db[existingIdx].pengeluaran_bensin = bensin;
            db[existingIdx].pengeluaran_lain  = lain;
            db[existingIdx].jarak_tempuh_km   = Number(body.jarak) || 0;
          } else {
            db.push({
              id:                Date.now(),
              tanggal:           body.tanggal,
              pendapatan_kotor:  pendapatanKotor,
              pengeluaran_bensin: bensin,
              pengeluaran_lain:  lain,
              jarak_tempuh_km:   Number(body.jarak) || 0
            });
          }

          saveDb(db);
          resolve({
            status: 'success',
            message: 'Data berhasil disimpan!',
            data: {
              tanggal:    body.tanggal,
              pendapatan: pendapatanKotor,
              pengeluaran: bensin + lain,
              bersih:     pendapatanKotor - (bensin + lain),
              jarak:      Number(body.jarak) || 0
            }
          });
        }

        // ---- HAPUS DATA ----
        else if (cleanEndpoint.includes('hapus_data')) {
          const id         = Number(body.id);
          const initialLen = db.length;
          db = db.filter(x => x.id !== id);
          if (db.length < initialLen) {
            saveDb(db);
            resolve({ status: 'success', message: 'Data berhasil dihapus.' });
          } else {
            resolve({ status: 'error', message: 'Data tidak ditemukan.' });
          }
        }

        else {
          resolve({ status: 'error', message: 'Endpoint tidak dikenal: ' + cleanEndpoint });
        }

      } catch (err) {
        console.error(err);
        resolve({ status: 'error', message: 'Error DB offline: ' + err.message });
      }
    }, 120);
  });
}

// ===== FORMAT HELPERS =====
function formatRp(n) {
  return 'Rp ' + (parseInt(n) || 0).toLocaleString('id-ID');
}

function formatTanggal(str) {
  const d = new Date(str + 'T00:00:00');
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
  showToast('DONEFAST Tracer berhasil diinstall! 🎉', 'success', 4000);
  const banner = document.getElementById('installBanner');
  if (banner) banner.classList.add('hidden');
  deferredInstall = null;
});

function installApp() {
  if (!deferredInstall) return showToast('Buka di Chrome Android untuk install', 'info');
  deferredInstall.prompt();
  deferredInstall.userChoice.then(c => {
    if (c.outcome === 'accepted') showToast('Menginstall DONEFAST Tracer...', 'info');
    deferredInstall = null;
  });
}

// ===== NETWORK STATUS (bug fix: gunakan id="netDot") =====
function updateNet() {
  const dot = document.getElementById('netDot');   // fix: pakai id bukan class
  const txt = document.getElementById('netTxt');
  if (dot && txt) {
    if (navigator.onLine) {
      dot.style.background = '#4ADE80';
      txt.textContent = 'Online';
    } else {
      dot.style.background = '#F59E0B';
      txt.textContent = 'Offline';
    }
  }
}
window.addEventListener('online',  updateNet);
window.addEventListener('offline', () => { updateNet(); showToast('Koneksi terputus', 'warning'); });

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Nav tabs
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.addEventListener('click', () => navigateTo(t.dataset.page));
  });

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // Header buttons haptic feedback (subtle scale)
  document.querySelectorAll('#btnInfo, #btnSettings').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.style.transform = 'scale(0.92)';
      setTimeout(() => btn.style.transform = '', 150);
    });
  });

  updateNet();
  initRipples();
  navigateTo('dashboard');
});
