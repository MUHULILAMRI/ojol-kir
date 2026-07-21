// =============================================
// OjolKIR - Input Form + GPS
// =============================================

let lat1 = null, lon1 = null, submitting = false;

function initInput() {
  const tgl = document.getElementById('tanggal');
  if (tgl) tgl.valueAsDate = new Date();
  ['pendapatan', 'bensin', 'lain_lain', 'servis'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updatePreview);
  });
  updatePreview();
}

function updatePreview() {
  const pend = parseInt(document.getElementById('pendapatan')?.value) || 0;
  const bensin = parseInt(document.getElementById('bensin')?.value) || 0;
  const lain = parseInt(document.getElementById('lain_lain')?.value) || 0;
  const servis = parseInt(document.getElementById('servis')?.value) || 0;
  const totalOut = bensin + lain + servis;
  const bersih = pend - totalOut;

  const setPrev = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setPrev('prevPend', formatRp(pend));
  setPrev('prevOut', formatRp(totalOut));
  const bEl = document.getElementById('prevBersih');
  if (bEl) {
    bEl.textContent = formatRp(bersih);
    bEl.className = 'pr-val pr-bersih ' + (bersih >= 0 ? 'text-success' : 'text-danger');
  }
}

function catatLokasiAwal() {
  const btn = document.getElementById('btnStart');
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  if (!navigator.geolocation) {
    showToast('GPS tidak tersedia di perangkat ini', 'error');
    btn.disabled = false; btn.innerHTML = '<i class="ph-fill ph-play"></i> START';
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    lat1 = pos.coords.latitude;
    lon1 = pos.coords.longitude;
    btn.innerHTML = '<i class="ph-bold ph-check"></i> Terkunci!';
    btn.style.background = '#047857';
    showToast('📍 Lokasi awal berhasil dikunci!', 'success');
  }, err => {
    showToast('Gagal ambil GPS. Aktifkan lokasi!', 'error');
    btn.disabled = false; btn.innerHTML = '<i class="ph-fill ph-play"></i> START';
    btn.style.background = '';
  }, { timeout: 12000, enableHighAccuracy: true });
}

function catatLokasiAkhir() {
  if (lat1 === null) { showToast('Tap START SHIFT dulu!', 'warning'); return; }
  const btn = document.getElementById('btnEnd');
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  navigator.geolocation.getCurrentPosition(pos => {
    const lat2 = pos.coords.latitude, lon2 = pos.coords.longitude;
    const jarak = haversine(lat1, lon1, lat2, lon2);
    const jEl = document.getElementById('jarak_tempuh');
    if (jEl) jEl.value = jarak.toFixed(2);
    updatePreview();
    btn.innerHTML = '<i class="ph-bold ph-flag"></i> Selesai';
    btn.style.background = '#991b1b';
    showToast(`✅ Selesai! Jarak: ${jarak.toFixed(2)} KM`, 'success');
  }, () => {
    showToast('Gagal ambil GPS akhir', 'error');
    btn.disabled = false; btn.innerHTML = '<i class="ph-fill ph-stop"></i> END';
    btn.style.background = '';
  }, { timeout: 12000, enableHighAccuracy: true });
}

function haversine(la1, lo1, la2, lo2) {
  const R = 6371, dLa = (la2-la1)*Math.PI/180, dLo = (lo2-lo1)*Math.PI/180;
  const a = Math.sin(dLa/2)**2 + Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLo/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function resetForm() {
  document.getElementById('formOperasional')?.reset();
  const tgl = document.getElementById('tanggal');
  if (tgl) tgl.valueAsDate = new Date();
  lat1 = null; lon1 = null;
  ['btnStart','btnEnd'].forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.disabled = false; b.style.background = ''; }
  });
  document.getElementById('btnStart').innerHTML = '<i class="ph-fill ph-play"></i> START';
  document.getElementById('btnEnd').innerHTML = '<i class="ph-fill ph-stop"></i> END';
  updatePreview();
}

document.addEventListener('DOMContentLoaded', () => {
  initInput();

  document.getElementById('formOperasional')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (submitting) return;
    const pend = parseInt(document.getElementById('pendapatan')?.value);
    if (!pend || pend <= 0) { showToast('Pendapatan wajib diisi!', 'warning'); return; }

    submitting = true;
    const btn = document.getElementById('btnSubmit');
    if (btn) { btn.innerHTML = '<span class="spinner"></span> Menyimpan...'; btn.disabled = true; }

    const payload = {
      tanggal: document.getElementById('tanggal')?.value,
      pendapatan: parseInt(document.getElementById('pendapatan')?.value) || 0,
      bensin: parseInt(document.getElementById('bensin')?.value) || 0,
      lain_lain: (parseInt(document.getElementById('lain_lain')?.value) || 0) + (parseInt(document.getElementById('servis')?.value) || 0),
      jarak: parseFloat(document.getElementById('jarak_tempuh')?.value) || 0
    };

    try {
      const res = await apiFetch('/proses_data.php', { method: 'POST', body: JSON.stringify(payload) });
      if (res.status === 'success') {
        showToast('Data berhasil disimpan! 🎉', 'success');
        resetForm();
      } else {
        showToast(res.message || 'Gagal menyimpan', 'error');
      }
    } catch (err) {
      showToast('Koneksi gagal. Coba lagi.', 'error');
    } finally {
      submitting = false;
      if (btn) { btn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i> SIMPAN DATA HARIAN'; btn.disabled = false; }
    }
  });
});
