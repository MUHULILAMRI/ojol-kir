// =============================================
// OjolKIR - Dashboard
// =============================================

let miniChartInst = null;

async function loadDashboard() {
  setDashboardSkeleton();
  try {
    const res = await apiFetch('/get_dashboard.php');
    if (res.status === 'success') renderDashboard(res.data);
  } catch (e) {
    showToast('Gagal memuat dashboard. Cek koneksi!', 'error');
  }
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

  // KIR Panel
  const panel = document.getElementById('kirPanel');
  if (panel) {
    panel.className = 'kir-panel ' + (data.status_warna || 'success');
    document.getElementById('kirStatus').textContent = data.status_motor;
    document.getElementById('kirSub').textContent = 'Odometer: ' + parseFloat(data.total_jarak || 0).toFixed(1) + ' KM total';
  }

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

  // Sisa servis
  const sisaEl = document.getElementById('sisaServis');
  if (sisaEl && data.sisa_servis !== undefined) {
    sisaEl.textContent = parseFloat(data.sisa_servis).toFixed(0) + ' KM lagi';
  }

  // Mini chart
  renderMiniChart(data.chart_7hari || []);
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
        backgroundColor: vals.map(v => v === maxV && v > 0 ? 'rgba(16,185,129,0.9)' : 'rgba(16,185,129,0.25)'),
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
