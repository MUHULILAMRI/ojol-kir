// =============================================
// DONEFAST Tracer - Dashboard
// v2.0 — Premium Charts & Animations
// =============================================

let miniChartInst = null;
let currentTotalJarakServer = 0;

async function loadDashboard() {
  setDashboardSkeleton();
  try {
    const res = await apiFetch('/get_dashboard.php');
    if (res && res.status === 'success') {
      currentTotalJarakServer = parseFloat(res.data.total_jarak || 0);
      renderDashboard(res.data);
    } else {
      showToast((res && res.message) || 'Gagal memuat data dashboard', 'error');
      renderDashboardFallback();
    }
  } catch (e) {
    showToast('Gagal memuat dashboard. Cek koneksi!', 'error');
    renderDashboardFallback();
  }
}

function renderDashboardFallback() {
  renderDashboard({
    pendapatan:  'Rp 0',
    pengeluaran: 'Rp 0',
    bersih:      'Rp 0',
    bersih_raw:  0,
    total_jarak: 0,
    chart_7hari: []
  });
}

function setDashboardSkeleton() {
  ['totalPendapatan','totalPengeluaran','totalBersih'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<span class="skel" style="display:inline-block;width:68px;height:16px;vertical-align:middle;border-radius:6px;"></span>';
  });
  const ks = document.getElementById('kirStatus');
  if (ks) ks.textContent = 'Memuat...';
}

function renderDashboard(data) {
  // Summary numbers dengan animasi fade-in
  const setVal = (id, val, cls) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = val;
    if (cls) el.className = 's-val ' + cls;
  };

  setVal('totalPendapatan', data.pendapatan);
  setVal('totalPengeluaran', data.pengeluaran);

  const bersihRaw = parseInt(data.bersih_raw) || 0;
  setVal('totalBersih', data.bersih, bersihRaw >= 0 ? 'text-blue' : 'text-danger');

  // Tanggal
  const now    = new Date();
  const dateEl = document.getElementById('currentDate');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // KPI mini — rata-rata & proyeksi (berdasarkan hari aktif, bukan hari kalender)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const today       = now.getDate();
  const avg         = today > 0 ? Math.round(bersihRaw / today) : 0;
  const proyeksi    = avg * daysInMonth;

  const aveEl  = document.getElementById('avgHarian');
  const projEl = document.getElementById('proyeksi');
  if (aveEl)  animateNumber(aveEl, avg, v => formatRp(v));
  if (projEl) animateNumber(projEl, proyeksi, v => formatRp(v));

  // Chart
  renderMiniChart(data.chart_7hari || []);

  // Maintenance
  updateMaintenanceUI();
}

// ===== ANIMATED NUMBER COUNT UP =====
function animateNumber(el, target, formatter, duration = 600) {
  const start    = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = Math.round(start + (target - start) * eased);
    el.textContent = formatter(current);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// ===== MINI CHART (Dashboard) =====
function renderMiniChart(data) {
  const ctx = document.getElementById('miniChart');
  if (!ctx) return;
  if (miniChartInst) { miniChartInst.destroy(); miniChartInst = null; }

  const labels = data.map(d => new Date(d.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short' }));
  const vals   = data.map(d => parseInt(d.pendapatan) || 0);
  const maxV   = Math.max(...vals, 1);

  // Gradient fill
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 140);
  gradient.addColorStop(0,   'rgba(238, 39, 55, 0.35)');
  gradient.addColorStop(1,   'rgba(238, 39, 55, 0.02)');

  miniChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data:            vals,
        backgroundColor: vals.map(v => v === maxV && v > 0 ? '#EE2737' : 'rgba(238,39,55,0.18)'),
        borderRadius:    8,
        borderSkipped:   false,
        barPercentage:   0.65,
        categoryPercentage: 0.8
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutQuart' },
      plugins: {
        legend:  { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,15,30,0.9)',
          padding:          10,
          cornerRadius:     10,
          titleFont:        { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
          bodyFont:         { family: 'Plus Jakarta Sans', size: 12, weight: '700' },
          callbacks:        { label: c => ' Rp ' + c.raw.toLocaleString('id-ID') }
        }
      },
      scales: {
        x: {
          grid:  { display: false },
          border: { display: false },
          ticks: { font: { size: 9, family: 'Plus Jakarta Sans', weight: '600' }, color: '#94A3B8', maxRotation: 0 }
        },
        y: { display: false, beginAtZero: true }
      }
    }
  });
}

// ===== MAINTENANCE LOGIC =====
function getCurrentOdo() {
  const odoAwal = parseFloat(localStorage.getItem('ojolkir_odo_awal') || 0);
  return odoAwal + currentTotalJarakServer;
}

function updateMaintenanceUI() {
  const currentOdo = getCurrentOdo();
  const odoEl      = document.getElementById('modalOdoCurrent');
  if (odoEl) odoEl.textContent = currentOdo.toFixed(1) + ' KM';

  const limits = {
    'oli_mesin':  2000,
    'oli_gardan': 8000,
    'servis_cvt': 4000
  };

  let minSisa     = 999999;
  let statusText  = 'Kondisi Prima — Aman';
  let statusWarna = 'success';
  let statusIcon  = 'ph-check-circle';

  for (const [key, limit] of Object.entries(limits)) {
    const lastServiceOdo = parseFloat(localStorage.getItem('ojolkir_last_' + key) || 0);
    let sisa = (lastServiceOdo + limit) - currentOdo;
    if (sisa < 0) sisa = 0;

    const pct    = Math.max(0, Math.min(100, ((limit - sisa) / limit) * 100));
    const barKey = key.replace(/_(.)/g, (m, c) => c.toUpperCase()).replace(/^[a-z]/, c => c.toUpperCase());
    const bar    = document.getElementById('bar'  + barKey);
    const txt    = document.getElementById('sisa' + barKey);

    if (bar && txt) {
      txt.textContent = sisa.toFixed(0) + ' KM lagi';
      // Animasi width bar
      requestAnimationFrame(() => { bar.style.width = pct + '%'; });

      txt.className = 'si-sisa';
      bar.className = 'si-bar';

      if (sisa < 200) {
        txt.classList.add('danger');
        bar.classList.add('danger');
      } else if (sisa < 500) {
        txt.classList.add('warning');
        bar.classList.add('warning');
      }
    }

    if (sisa < minSisa) minSisa = sisa;
  }

  // Update KIR Panel
  if (minSisa < 200) {
    statusText  = '⚠️ Waktunya Servis! Sisa ' + minSisa.toFixed(0) + ' KM';
    statusWarna = 'danger';
    statusIcon  = 'ph-warning-circle';
  } else if (minSisa < 500) {
    statusText  = '🔧 Jadwalkan Servis. Sisa ' + minSisa.toFixed(0) + ' KM';
    statusWarna = 'warning';
    statusIcon  = 'ph-clock-countdown';
  }

  const panel = document.getElementById('kirPanel');
  if (panel) {
    panel.className = 'kir-panel ' + statusWarna;
    const iconEl = panel.querySelector('.kir-icon i');
    if (iconEl) iconEl.className = 'ph-fill ' + statusIcon;
  }

  const statusEl = document.getElementById('kirStatus');
  const subEl    = document.getElementById('kirSub');
  if (statusEl) statusEl.textContent = statusText;
  if (subEl)    subEl.textContent    = 'Odometer: ' + currentOdo.toFixed(1) + ' KM';

  const sisaEl = document.getElementById('sisaServis');
  if (sisaEl) sisaEl.textContent = minSisa.toFixed(0) + ' KM lagi';
}

function resetService(type) {
  const currentOdo = getCurrentOdo();
  localStorage.setItem('ojolkir_last_' + type, currentOdo);
  showToast('✅ Tercatat dari ' + currentOdo.toFixed(1) + ' KM', 'success');
  updateMaintenanceUI();
}

// ===== MODALS & PROFILE =====
function openProfileModal() {
  document.getElementById('inputProfileName').value  = localStorage.getItem('ojolkir_name')    || 'Muh. Ulil Amri';
  document.getElementById('inputProfileMotor').value = localStorage.getItem('ojolkir_motor')   || 'Honda Vario 150';
  document.getElementById('inputProfileOdo').value   = localStorage.getItem('ojolkir_odo_awal') || '0';
  document.getElementById('profileModal').classList.add('active');
}

function openServiceModal() {
  updateMaintenanceUI();
  document.getElementById('serviceModal').classList.add('active');
}

function openInfoModal() {
  document.getElementById('infoModal').classList.add('active');
}

function closeModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

function saveProfile() {
  const name  = document.getElementById('inputProfileName').value.trim();
  const motor = document.getElementById('inputProfileMotor').value.trim();
  const odo   = document.getElementById('inputProfileOdo').value.trim() || '0';

  if (name)  localStorage.setItem('ojolkir_name',    name);
  if (motor) localStorage.setItem('ojolkir_motor',   motor);
  localStorage.setItem('ojolkir_odo_awal', odo);

  initProfileUI();
  closeModals();
  updateMaintenanceUI();
  showToast('Profil & Odometer berhasil disimpan! ✓', 'success');
}

function initProfileUI() {
  const nameEl  = document.getElementById('userName');
  const motorEl = document.getElementById('userMotor');
  if (nameEl)  nameEl.textContent  = localStorage.getItem('ojolkir_name')  || 'Muh. Ulil Amri';
  if (motorEl) motorEl.textContent = localStorage.getItem('ojolkir_motor') || 'Honda Vario 150';
}

document.addEventListener('DOMContentLoaded', initProfileUI);
