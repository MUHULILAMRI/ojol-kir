// =============================================
// OjolKIR - Dashboard
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
    pendapatan: 'Rp 0',
    pengeluaran: 'Rp 0',
    bersih: 'Rp 0',
    bersih_raw: 0,
    total_jarak: 0,
    chart_7hari: []
  });
}

function setDashboardSkeleton() {
  ['totalPendapatan', 'totalPengeluaran', 'totalBersih'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<span class="skel" style="display:inline-block;width:60px;height:16px;vertical-align:middle"></span>';
  });
  const ks = document.getElementById('kirStatus');
  if (ks) ks.textContent = 'Memuat...';
}

function renderDashboard(data) {
  // Summary bulan
  document.getElementById('totalPendapatan').textContent = data.pendapatan;
  document.getElementById('totalPengeluaran').textContent = data.pengeluaran;
  document.getElementById('totalBersih').textContent = data.bersih;
  document.getElementById('totalBersih').className = 's-val ' + (parseInt(data.bersih_raw) >= 0 ? 'text-success' : 'text-danger');

  // Greeting
  const h = new Date().getHours();
  const sapa = h < 11 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 19 ? 'Selamat Sore' : 'Selamat Malam';
  const grEl = document.getElementById('greeting');
  if (grEl) grEl.textContent = sapa + ' 👋';

  const now = new Date();
  const dateEl = document.getElementById('currentDate');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // KPI mini
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const today = now.getDate();
  const bersihRaw = parseInt(data.bersih_raw) || 0;
  const avg = today > 0 ? Math.round(bersihRaw / today) : 0;
  const proyeksi = avg * daysInMonth;
  const aveEl = document.getElementById('avgHarian');
  const projEl = document.getElementById('proyeksi');
  if (aveEl) aveEl.textContent = formatRp(avg);
  if (projEl) projEl.textContent = formatRp(proyeksi);

  // Mini chart
  renderMiniChart(data.chart_7hari || []);

  // UPDATE MAINTENANCE UI
  updateMaintenanceUI();
}

function renderMiniChart(data) {
  const ctx = document.getElementById('miniChart');
  if (!ctx) return;
  if (miniChartInst) { miniChartInst.destroy(); miniChartInst = null; }

  const labels = data.map(d => new Date(d.tanggal).toLocaleDateString('id-ID', { weekday: 'short' }));
  const vals = data.map(d => parseInt(d.pendapatan) || 0);
  const maxV = Math.max(...vals, 1);

  miniChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: vals,
        backgroundColor: vals.map(v => v === maxV && v > 0 ? 'rgba(238,39,55,0.9)' : 'rgba(238,39,55,0.25)'),
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => 'Rp ' + c.raw.toLocaleString('id-ID') } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9, family: 'Plus Jakarta Sans' }, color: '#94a3b8' } },
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
  document.getElementById('modalOdoCurrent').textContent = currentOdo.toFixed(1) + ' KM';

  const limits = {
    'oli_mesin': 2000,
    'oli_gardan': 8000,
    'servis_cvt': 4000
  };

  let minSisa = 999999;
  let statusText = "Kondisi Prima (Aman)";
  let statusWarna = "success";

  for (const [key, limit] of Object.entries(limits)) {
    const lastServiceOdo = parseFloat(localStorage.getItem('ojolkir_last_' + key) || 0);
    // Jika belum pernah diset, set ke 0 (atau odo awal)
    
    let sisa = (lastServiceOdo + limit) - currentOdo;
    if (sisa < 0) sisa = 0;

    // Update modal progress
    const pct = Math.max(0, Math.min(100, ( (limit - sisa) / limit ) * 100));
    
    const bar = document.getElementById('bar' + key.replace(/_(.)/g, (m, c) => c.toUpperCase()).replace(/^[a-z]/, c => c.toUpperCase())); // e.g. barOliMesin
    const txt = document.getElementById('sisa' + key.replace(/_(.)/g, (m, c) => c.toUpperCase()).replace(/^[a-z]/, c => c.toUpperCase()));
    
    if (bar && txt) {
      txt.textContent = sisa.toFixed(0) + ' KM lagi';
      bar.style.width = pct + '%';
      
      // Reset classes
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

    if (sisa < minSisa) {
      minSisa = sisa;
    }
  }

  // Update KIR Panel in Dashboard
  if (minSisa < 200) {
    statusText = "⚠️ Waktunya Servis! Sisa " + minSisa.toFixed(0) + " KM";
    statusWarna = "danger";
  } else if (minSisa < 500) {
    statusText = "🔧 Jadwalkan Servis. Sisa " + minSisa.toFixed(0) + " KM";
    statusWarna = "warning";
  }

  const panel = document.getElementById('kirPanel');
  if (panel) {
    panel.className = 'kir-panel ' + statusWarna;
    document.getElementById('kirStatus').textContent = statusText;
    document.getElementById('kirSub').textContent = 'Odometer: ' + currentOdo.toFixed(1) + ' KM';
  }

  const sisaEl = document.getElementById('sisaServis');
  if (sisaEl) {
    sisaEl.textContent = minSisa.toFixed(0) + ' KM lagi';
  }
}

function resetService(type) {
  const currentOdo = getCurrentOdo();
  localStorage.setItem('ojolkir_last_' + type, currentOdo);
  showToast('Tercatat! Menghitung ulang dari ' + currentOdo.toFixed(1) + ' KM', 'success');
  updateMaintenanceUI();
}

// ===== MODALS & PROFILE =====
function openProfileModal() {
  document.getElementById('inputProfileName').value = localStorage.getItem('ojolkir_name') || 'Muh. Ulil Amri';
  document.getElementById('inputProfileMotor').value = localStorage.getItem('ojolkir_motor') || 'Honda Vario 150';
  document.getElementById('inputProfileOdo').value = localStorage.getItem('ojolkir_odo_awal') || '0';
  document.getElementById('profileModal').classList.add('active');
}

function openServiceModal() {
  updateMaintenanceUI();
  document.getElementById('serviceModal').classList.add('active');
}

function closeModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

function saveProfile() {
  const name = document.getElementById('inputProfileName').value.trim();
  const motor = document.getElementById('inputProfileMotor').value.trim();
  const odo = document.getElementById('inputProfileOdo').value.trim() || 0;

  if (name) localStorage.setItem('ojolkir_name', name);
  if (motor) localStorage.setItem('ojolkir_motor', motor);
  localStorage.setItem('ojolkir_odo_awal', odo);

  initProfileUI();
  closeModals();
  updateMaintenanceUI();
  showToast('Profil dan Odometer berhasil disimpan!', 'success');
}

function initProfileUI() {
  const nameEl = document.getElementById('userName');
  const motorEl = document.getElementById('userMotor');
  if (nameEl) nameEl.textContent = localStorage.getItem('ojolkir_name') || 'Muh. Ulil Amri';
  if (motorEl) motorEl.textContent = localStorage.getItem('ojolkir_motor') || 'Honda Vario 150';
}

document.addEventListener('DOMContentLoaded', initProfileUI);
