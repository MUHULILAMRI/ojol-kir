<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once '../config/database.php';

try {
    // 1. Menghitung akumulasi finansial khusus bulan berjalan saat ini
    $stmtFin = $pdo->query("SELECT 
        SUM(pendapatan_kotor) as total_pendapatan,
        SUM(pengeluaran_bensin + pengeluaran_lain) as total_pengeluaran
        FROM operasional_harian 
        WHERE MONTH(tanggal) = MONTH(CURRENT_DATE()) AND YEAR(tanggal) = YEAR(CURRENT_DATE())");
    $fin = $stmtFin->fetch(PDO::FETCH_ASSOC);

    $pendapatan = $fin['total_pendapatan'] ?? 0;
    $pengeluaran = $fin['total_pengeluaran'] ?? 0;
    $bersih = $pendapatan - $pengeluaran;

    // 2. Menghitung akumulasi jarak tempuh untuk indikator servis (KIR Mandiri)
    $stmtJarak = $pdo->query("SELECT SUM(jarak_tempuh_km) as total_jarak FROM operasional_harian");
    $jarakRow = $stmtJarak->fetch(PDO::FETCH_ASSOC);
    $totalJarak = $jarakRow['total_jarak'] ?? 0;

    // Logika Manajemen Aset: Batas toleransi oli/servis diset per 2.000 KM
    $batasServis = 2000;
    $sisaJarak = $batasServis - fmod($totalJarak, $batasServis);

    $statusMotor = "Kondisi Prima (Aman)";
    $statusWarna = "success"; // Warna Hijau

    if ($sisaJarak < 200) {
        $statusMotor = "Waktunya Servis! (Sisa Jarak " . round($sisaJarak, 1) . " KM)";
        $statusWarna = "danger"; // Warna Merah (Bahaya)
    } else if ($sisaJarak < 500) {
        $statusMotor = "Jadwalkan Servis Rutin (Sisa Jarak " . round($sisaJarak, 1) . " KM)";
        $statusWarna = "warning"; // Warna Kuning (Peringatan)
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "pendapatan" => "Rp " . number_format($pendapatan, 0, ',', '.'),
            "pengeluaran" => "Rp " . number_format($pengeluaran, 0, ',', '.'),
            "bersih" => "Rp " . number_format($bersih, 0, ',', '.'),
            "status_motor" => $statusMotor,
            "status_warna" => $statusWarna
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>