// =============================================
// DONEFAST Tracer - Riwayat
// v2.0 — Premium Card Design
// =============================================

let rBulan = new Date().getMonth() + 1;
let rTahun = new Date().getFullYear();

async function loadRiwayat() {
  const list = document.getElementById('riwayatList');
  if (!list) return;

  list.innerHTML = `
    <div class="skel" style="height:80px;border-radius:16px;margin-bottom:10px;"></div>
    <div class="skel" style="height:80px;border-radius:16px;margin-bottom:10px;"></div>
    <div class="skel" style="height:80px;border-radius:16px;"></div>`;

  try {
    const res = await apiFetch(`/get_riwayat.php?bulan=${rBulan}&tahun=${rTahun}`);
    if (res && res.status === 'success') {
      renderRiwayatSummary(res.summary);
      renderRiwayatList(res.data);
    } else {
      renderRiwayatSummary({ total_hari: 0, pendapatan: 'Rp 0', pengeluaran: 'Rp 0', bersih: 'Rp 0' });
      list.innerHTML = `
        <div class="empty-state">
          <i class="ph-bold ph-warning-circle"></i>
          <p>${(res && res.message) || 'Tidak ada data bulan ini'}</p>
        </div>`;
    }
  } catch (e) {
    renderRiwayatSummary({ total_hari: 0, pendapatan: 'Rp 0', pengeluaran: 'Rp 0', bersih: 'Rp 0' });
    list.innerHTML = `
      <div class="empty-state">
        <i class="ph-bold ph-wifi-slash"></i>
        <p>Koneksi gagal</p>
      </div>`;
    showToast('Gagal memuat riwayat', 'error');
  }
}

function renderRiwayatSummary(s) {
  if (!s) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('rsPend',   s.pendapatan || 'Rp 0');
  set('rsBersih', s.bersih     || 'Rp 0');
  set('rsHari',   (s.total_hari || 0) + ' hari');
}

function renderRiwayatList(data) {
  const list = document.getElementById('riwayatList');
  if (!data || !data.length) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="ph-bold ph-inbox"></i>
        <p>Belum ada data bulan ini.<br>Mulai input dari tab <b>Input</b>!</p>
      </div>`;
    return;
  }

  list.innerHTML = data.map((r, idx) => {
    const pend  = parseInt(r.pendapatan_kotor)   || 0;
    const bensin = parseInt(r.pengeluaran_bensin) || 0;
    const lain  = parseInt(r.pengeluaran_lain)   || 0;
    const out   = bensin + lain;
    const net   = pend - out;
    const tgl   = new Date(r.tanggal + 'T00:00:00');
    const hari  = tgl.toLocaleDateString('id-ID', { weekday: 'long' });
    const tglStr = tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const jarak = parseFloat(r.jarak_tempuh_km || 0).toFixed(1);
    const netColor = net >= 0 ? 'met-net' : 'met-out';

    // border-left color based on net income
    const borderColor = net >= 0 ? 'var(--success)' : 'var(--danger)';

    return `<div class="hist-card" style="border-left-color:${borderColor};animation-delay:${idx * 0.04}s;">
      <div class="hist-head">
        <div class="hist-date">
          ${hari}
          <small>${tglStr}</small>
        </div>
        <button class="btn-icon-del" onclick="hapusData(${r.id})" title="Hapus data ini" aria-label="Hapus">
          <i class="ph-bold ph-trash"></i>
        </button>
      </div>
      <div class="hist-metrics">
        <div class="met-item">
          <span class="met-label">Pendapatan</span>
          <span class="met-val met-in">${formatRp(pend)}</span>
        </div>
        <div class="met-item">
          <span class="met-label">Pengeluaran</span>
          <span class="met-val met-out">${formatRp(out)}</span>
        </div>
        <div class="met-item">
          <span class="met-label">Bersih</span>
          <span class="met-val ${netColor}">${formatRp(net)}</span>
        </div>
      </div>
      <div class="hist-foot">
        <span class="hist-jarak">
          <i class="ph-bold ph-map-pin"></i> ${jarak} KM
        </span>
        ${out > 0 ? `<span class="badge-servis"><i class="ph-bold ph-gas-pump"></i> Operasional</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function hapusData(id) {
  if (!confirm('Yakin ingin menghapus data ini?')) return;
  try {
    const res = await apiFetch('/hapus_data.php', { method: 'POST', body: JSON.stringify({ id }) });
    if (res.status === 'success') {
      showToast('Data berhasil dihapus 🗑️', 'success');
      loadRiwayat();
    } else {
      showToast('Gagal menghapus data', 'error');
    }
  } catch (e) {
    showToast('Koneksi gagal', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Isi filter bulan
  const fBulan = document.getElementById('filterBulan');
  if (fBulan) {
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    months.forEach((m, i) => {
      const o        = document.createElement('option');
      o.value        = i + 1;
      o.textContent  = m;
      if (i + 1 === rBulan) o.selected = true;
      fBulan.appendChild(o);
    });
    fBulan.addEventListener('change', () => {
      rBulan = +fBulan.value;
      if (currentPage === 'riwayat') loadRiwayat();
    });
  }

  // Isi filter tahun
  const fTahun = document.getElementById('filterTahun');
  if (fTahun) {
    const yr = new Date().getFullYear();
    for (let y = yr; y >= yr - 4; y--) {
      const o       = document.createElement('option');
      o.value       = y;
      o.textContent = y;
      if (y === rTahun) o.selected = true;
      fTahun.appendChild(o);
    }
    fTahun.addEventListener('change', () => {
      rTahun = +fTahun.value;
      if (currentPage === 'riwayat') loadRiwayat();
    });
  }
});
