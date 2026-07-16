<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once '../config/database.php';

try {
    // Chart 7 hari terakhir
    $stmtChart = $pdo->query("
        SELECT tanggal, COALESCE(SUM(pendapatan_kotor), 0) as pendapatan
        FROM operasional_harian
        WHERE tanggal >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY)
        GROUP BY tanggal ORDER BY tanggal ASC");
    $chart7hari = $stmtChart->fetchAll(PDO::FETCH_ASSOC);

    // Total jarak
    $totalJarak = $pdo->query("SELECT COALESCE(SUM(jarak_tempuh_km), 0) as total FROM operasional_harian")->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // Rata-rata & hitung hari aktif bulan ini
    $stmtAvg = $pdo->query("
        SELECT 
            COALESCE(AVG(pendapatan_kotor - pengeluaran_bensin - pengeluaran_lain), 0) as rata,
            COUNT(*) as hari_aktif
        FROM operasional_harian 
        WHERE MONTH(tanggal) = MONTH(CURRENT_DATE()) AND YEAR(tanggal) = YEAR(CURRENT_DATE())");
    $avgData = $stmtAvg->fetch(PDO::FETCH_ASSOC);

    // Hari terbaik (pendapatan tertinggi bulan ini)
    $stmtBest = $pdo->query("
        SELECT tanggal FROM operasional_harian 
        WHERE pendapatan_kotor = (
            SELECT MAX(pendapatan_kotor) FROM operasional_harian 
            WHERE MONTH(tanggal) = MONTH(CURRENT_DATE()) AND YEAR(tanggal) = YEAR(CURRENT_DATE())
        ) AND MONTH(tanggal) = MONTH(CURRENT_DATE()) AND YEAR(tanggal) = YEAR(CURRENT_DATE())
        LIMIT 1");
    $bestRow = $stmtBest->fetch(PDO::FETCH_ASSOC);

    $hariBaik = '-';
    if ($bestRow) {
        $ts = strtotime($bestRow['tanggal']);
        $days = ['Sunday'=>'Minggu','Monday'=>'Senin','Tuesday'=>'Selasa','Wednesday'=>'Rabu','Thursday'=>'Kamis','Friday'=>'Jumat','Saturday'=>'Sabtu'];
        $hariEn = date('l', $ts);
        $hariId = $days[$hariEn] ?? $hariEn;
        $hariBaik = $hariId . ', ' . date('d M', $ts);
    }

    // Breakdown pengeluaran bulan ini
    $stmtBreak = $pdo->query("
        SELECT 
            COALESCE(SUM(pengeluaran_bensin), 0) as bensin,
            COALESCE(SUM(pengeluaran_lain), 0) as lain_lain
        FROM operasional_harian 
        WHERE MONTH(tanggal) = MONTH(CURRENT_DATE()) AND YEAR(tanggal) = YEAR(CURRENT_DATE())");
    $breakdown = $stmtBreak->fetch(PDO::FETCH_ASSOC);

    // Proyeksi akhir bulan
    $rataHarian  = floatval($avgData['rata'] ?? 0);
    $daysInMonth = intval(date('t'));
    $proyeksi    = $rataHarian * $daysInMonth;

    echo json_encode([
        "status" => "success",
        "data"   => [
            "chart_7hari"    => $chart7hari,
            "total_jarak"    => round((float)$totalJarak, 1),
            "rata_harian"    => round($rataHarian),
            "hari_terbaik"   => $hariBaik,
            "proyeksi_bulan" => round($proyeksi),
            "hari_aktif"     => intval($avgData['hari_aktif'] ?? 0),
            "breakdown"      => [
                "bensin"   => intval($breakdown['bensin'] ?? 0),
                "lain_lain"=> intval($breakdown['lain_lain'] ?? 0)
            ]
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
