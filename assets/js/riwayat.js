// =============================================
// OjolKIR - Riwayat
// =============================================

let rBulan = new Date().getMonth() + 1;
let rTahun = new Date().getFullYear();

async function loadRiwayat() {
  const list = document.getElementById('riwayatList');
  if (!list) return;
  list.innerHTML = `
    <div class="skel" style="height:72px;border-radius:16px;margin-bottom:9px"></div>
    <div class="skel" style="height:72px;border-radius:16px;margin-bottom:9px"></div>
    <div class="skel" style="height:72px;border-radius:16px"></div>`;

  try {
    const res = await apiFetch(`/get_riwayat.php?bulan=${rBulan}&tahun=${rTahun}`);
    if (res.status === 'success') {
      renderRiwayatSummary(res.summary);
      renderRiwayatList(res.data);
    } else {
      list.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>Tidak ada data bulan ini</p></div>';
    }
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-wifi-slash"></i><p>Koneksi gagal</p></div>';
    showToast('Gagal memuat riwayat', 'error');
  }
}

function renderRiwayatSummary(s) {
  if (!s) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('rsPend', s.pendapatan || 'Rp 0');
  set('rsBersih', s.bersih || 'Rp 0');
  set('rsHari', (s.total_hari || 0) + ' hari');
}

function renderRiwayatList(data) {
  const list = document.getElementById('riwayatList');
  if (!data || !data.length) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Belum ada data bulan ini</p></div>';
    return;
  }
  list.innerHTML = data.map(r => {
    const pend = parseInt(r.pendapatan_kotor) || 0;
    const out = (parseInt(r.pengeluaran_bensin) || 0) + (parseInt(r.pengeluaran_lain) || 0);
    const net = pend - out;
    const tgl = new Date(r.tanggal);
    const hari = tgl.toLocaleDateString('id-ID', { weekday: 'long' });
    const tglStr = tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const jarak = parseFloat(r.jarak_tempuh_km || 0).toFixed(1);

    return `<div class="hist-card">
      <div class="hist-head">
        <div class="hist-date">${hari}<small>${tglStr}</small></div>
        <button class="btn-icon-del" onclick="hapusData(${r.id})" title="Hapus">
          <i class="fas fa-trash"></i>
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
          <span class="met-val ${net >= 0 ? 'met-net' : 'met-out'}">${formatRp(net)}</span>
        </div>
      </div>
      <div class="hist-foot">
        <span class="hist-jarak"><i class="fas fa-road"></i> ${jarak} KM</span>
        ${out > 0 ? `<span class="badge-servis">⛽ Operasional</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function hapusData(id) {
  if (!confirm('Yakin hapus data ini?')) return;
  try {
    const res = await apiFetch('/hapus_data.php', { method: 'POST', body: JSON.stringify({ id }) });
    if (res.status === 'success') {
      showToast('Data berhasil dihapus', 'success');
      loadRiwayat();
    } else {
      showToast('Gagal menghapus', 'error');
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
      const o = document.createElement('option');
      o.value = i + 1; o.textContent = m;
      if (i + 1 === rBulan) o.selected = true;
      fBulan.appendChild(o);
    });
    fBulan.addEventListener('change', () => { rBulan = +fBulan.value; if (currentPage === 'riwayat') loadRiwayat(); });
  }

  // Isi filter tahun
  const fTahun = document.getElementById('filterTahun');
  if (fTahun) {
    const yr = new Date().getFullYear();
    for (let y = yr; y >= yr - 3; y--) {
      const o = document.createElement('option');
      o.value = y; o.textContent = y;
      if (y === rTahun) o.selected = true;
      fTahun.appendChild(o);
    }
    fTahun.addEventListener('change', () => { rTahun = +fTahun.value; if (currentPage === 'riwayat') loadRiwayat(); });
  }
});
