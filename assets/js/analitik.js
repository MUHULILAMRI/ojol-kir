// =============================================
// OjolKIR - Analitik & Charts
// =============================================

let barChartInst = null, donutChartInst = null;

async function loadAnalitik() {
  try {
    const res = await apiFetch('/get_analitik.php');
    if (res.status === 'success') renderAnalitik(res.data);
  } catch (e) {
    showToast('Gagal memuat analitik', 'error');
  }
}

function renderAnalitik(data) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('kpiJarak', parseFloat(data.total_jarak || 0).toFixed(1) + ' KM');
  set('kpiTerbaik', data.hari_terbaik || '-');
  set('kpiRata', formatRp(data.rata_harian || 0));
  set('kpiProyeksi', formatRp(data.proyeksi_bulan || 0));

  renderBarChart(data.chart_7hari || []);
  renderDonutChart(data.breakdown || {});
}

function renderBarChart(data) {
  const ctx = document.getElementById('barChart');
  if (!ctx) return;
  if (barChartInst) { barChartInst.destroy(); barChartInst = null; }

  const labels = data.map(d => new Date(d.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
  const vals = data.map(d => parseInt(d.pendapatan) || 0);
  const maxV = Math.max(...vals, 1);

  barChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Pendapatan',
        data: vals,
        backgroundColor: vals.map(v => v === maxV && v > 0 ? '#10b981' : 'rgba(16,185,129,0.28)'),
        borderRadius: 8,
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
        x: { grid: { display: false }, ticks: { font: { size: 10, family: 'Plus Jakarta Sans' }, color: '#64748b' } },
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: {
            font: { size: 9 }, color: '#94a3b8',
            callback: v => v >= 1000000 ? (v/1000000).toFixed(1)+'jt' : v >= 1000 ? (v/1000).toFixed(0)+'rb' : v
          }
        }
      }
    }
  });
}

function renderDonutChart(breakdown) {
  const ctx = document.getElementById('donutChart');
  if (!ctx) return;
  if (donutChartInst) { donutChartInst.destroy(); donutChartInst = null; }

  const bensin = parseInt(breakdown.bensin) || 0;
  const lain = parseInt(breakdown.lain_lain) || 0;
  const total = bensin + lain;

  if (total === 0) {
    ctx.parentElement.innerHTML = '<div class="empty-state" style="padding:30px 0"><i class="fas fa-chart-pie"></i><p>Belum ada data pengeluaran</p></div>';
    return;
  }

  donutChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Bensin', 'Parkir / Makan'],
      datasets: [{
        data: [bensin, lain],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11, family: 'Plus Jakarta Sans' }, padding: 18, usePointStyle: true, pointStyleWidth: 10 }
        },
        tooltip: { callbacks: { label: c => c.label + ': Rp ' + c.raw.toLocaleString('id-ID') } }
      }
    }
  });
}
