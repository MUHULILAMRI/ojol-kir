<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once '../config/database.php';

try {
    // 1. Ringkasan finansial bulan ini
    $stmtFin = $pdo->query("SELECT 
        COALESCE(SUM(pendapatan_kotor), 0) as total_pendapatan,
        COALESCE(SUM(pengeluaran_bensin + pengeluaran_lain), 0) as total_pengeluaran
        FROM operasional_harian 
        WHERE MONTH(tanggal) = MONTH(CURRENT_DATE()) 
          AND YEAR(tanggal) = YEAR(CURRENT_DATE())");
    $fin = $stmtFin->fetch(PDO::FETCH_ASSOC);

    $pendapatan  = $fin['total_pendapatan'] ?? 0;
    $pengeluaran = $fin['total_pengeluaran'] ?? 0;
    $bersih      = $pendapatan - $pengeluaran;

    // 2. Total jarak tempuh keseluruhan (odometer)
    $stmtJ = $pdo->query("SELECT COALESCE(SUM(jarak_tempuh_km), 0) as total FROM operasional_harian");
    $totalJarak = $stmtJ->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // 3. Data chart 7 hari terakhir
    $stmtChart = $pdo->query("
        SELECT tanggal, COALESCE(SUM(pendapatan_kotor), 0) as pendapatan
        FROM operasional_harian
        WHERE tanggal >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY)
        GROUP BY tanggal
        ORDER BY tanggal ASC");
    $chart7hari = $stmtChart->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data"   => [
            "pendapatan"  => "Rp " . number_format($pendapatan,  0, ',', '.'),
            "pengeluaran" => "Rp " . number_format($pengeluaran, 0, ',', '.'),
            "bersih"      => "Rp " . number_format($bersih,      0, ',', '.'),
            "bersih_raw"  => $bersih,
            "total_jarak" => round((float)$totalJarak, 1),
            "chart_7hari" => $chart7hari
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>