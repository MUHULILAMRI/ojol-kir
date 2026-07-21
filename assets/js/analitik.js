// =============================================
// DONEFAST Tracer - Analitik & Charts
// v2.0 — Premium Gradient Charts
// =============================================

let barChartInst = null, donutChartInst = null;

async function loadAnalitik() {
  try {
    const res = await apiFetch('/get_analitik.php');
    if (res && res.status === 'success') {
      renderAnalitik(res.data);
    } else {
      renderAnalitikFallback();
      if (res && res.message) showToast(res.message, 'error');
    }
  } catch (e) {
    renderAnalitikFallback();
    showToast('Gagal memuat analitik', 'error');
  }
}

function renderAnalitikFallback() {
  renderAnalitik({
    total_jarak:    0,
    hari_terbaik:   '-',
    rata_harian:    0,
    proyeksi_bulan: 0,
    chart_7hari:    [],
    breakdown:      { bensin: 0, lain_lain: 0 }
  });
}

function renderAnalitik(data) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set('kpiJarak',    parseFloat(data.total_jarak || 0).toFixed(1) + ' KM');
  set('kpiTerbaik',  data.hari_terbaik || '-');
  set('kpiRata',     formatRp(data.rata_harian    || 0));
  set('kpiProyeksi', formatRp(data.proyeksi_bulan || 0));

  renderBarChart(data.chart_7hari || []);
  renderDonutChart(data.breakdown  || {});
}

// ===== BAR CHART (Analitik Page) =====
function renderBarChart(data) {
  const ctx = document.getElementById('barChart');
  if (!ctx) return;
  if (barChartInst) { barChartInst.destroy(); barChartInst = null; }

  const labels  = data.map(d => new Date(d.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
  const vals    = data.map(d => parseInt(d.pendapatan) || 0);
  const maxV    = Math.max(...vals, 1);

  // Create gradient
  const gradientBar = ctx.getContext('2d').createLinearGradient(0, 0, 0, 210);
  gradientBar.addColorStop(0,   '#EE2737');
  gradientBar.addColorStop(0.7, '#C0392B');
  gradientBar.addColorStop(1,   '#8B0000');

  barChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label:           'Pendapatan',
        data:            vals,
        backgroundColor: vals.map(v => v === maxV && v > 0 ? gradientBar : 'rgba(238,39,55,0.15)'),
        borderRadius:    { topLeft: 8, topRight: 8 },
        borderSkipped:   false,
        barPercentage:   0.62,
        categoryPercentage: 0.85
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing:   'easeOutQuart',
        delay:    context => context.dataIndex * 60
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,15,30,0.92)',
          padding:          12,
          cornerRadius:     12,
          displayColors:    false,
          titleFont:        { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
          bodyFont:         { family: 'Plus Jakarta Sans', size: 13, weight: '800' },
          callbacks: {
            title: c => c[0].label,
            label: c => ' Rp ' + c.raw.toLocaleString('id-ID')
          }
        }
      },
      scales: {
        x: {
          grid:   { display: false },
          border: { display: false },
          ticks:  { font: { size: 10, family: 'Plus Jakarta Sans', weight: '600' }, color: '#64748B', maxRotation: 0 }
        },
        y: {
          grid:   { color: 'rgba(0,0,0,0.04)', drawBorder: false },
          border: { display: false },
          ticks: {
            font:     { size: 9, family: 'Plus Jakarta Sans' },
            color:    '#94A3B8',
            callback: v => v >= 1000000 ? (v/1000000).toFixed(1) + 'jt' : v >= 1000 ? (v/1000).toFixed(0) + 'rb' : v,
            maxTicksLimit: 5
          }
        }
      }
    }
  });
}

// ===== DONUT CHART (Pengeluaran) =====
function renderDonutChart(breakdown) {
  const ctx = document.getElementById('donutChart');
  if (!ctx) return;
  if (donutChartInst) { donutChartInst.destroy(); donutChartInst = null; }

  const bensin = parseInt(breakdown.bensin)    || 0;
  const lain   = parseInt(breakdown.lain_lain) || 0;
  const total  = bensin + lain;

  if (total === 0) {
    const wrapper = ctx.parentElement;
    wrapper.innerHTML = `
      <div class="empty-state" style="padding:40px 0;">
        <i class="ph-bold ph-chart-pie-slice"></i>
        <p>Belum ada data pengeluaran<br>bulan ini</p>
      </div>`;
    return;
  }

  const pctBensin = Math.round((bensin / total) * 100);
  const pctLain   = 100 - pctBensin;

  donutChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [
        `Bensin (${pctBensin}%)`,
        `Parkir/Makan (${pctLain}%)`
      ],
      datasets: [{
        data:            [bensin, lain],
        backgroundColor: ['#EE2737', '#F59E0B'],
        hoverBackgroundColor: ['#C0392B', '#D97706'],
        borderWidth:     0,
        hoverOffset:     12,
        borderRadius:    6
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      cutout:              '70%',
      animation: { animateRotate: true, duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font:            { size: 12, family: 'Plus Jakarta Sans', weight: '600' },
            padding:         20,
            usePointStyle:   true,
            pointStyleWidth: 10,
            color:           '#475569'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(10,15,30,0.92)',
          padding:          12,
          cornerRadius:     12,
          displayColors:    false,
          bodyFont:         { family: 'Plus Jakarta Sans', size: 13, weight: '700' },
          callbacks: {
            label: c => ' Rp ' + c.raw.toLocaleString('id-ID')
          }
        }
      }
    }
  });
}
