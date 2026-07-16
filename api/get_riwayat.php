<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once '../config/database.php';

try {
    $bulan = isset($_GET['bulan']) ? intval($_GET['bulan']) : intval(date('n'));
    $tahun = isset($_GET['tahun']) ? intval($_GET['tahun']) : intval(date('Y'));

    // Data riwayat
    $stmt = $pdo->prepare("SELECT * FROM operasional_harian 
        WHERE MONTH(tanggal) = ? AND YEAR(tanggal) = ?
        ORDER BY tanggal DESC");
    $stmt->execute([$bulan, $tahun]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Summary
    $stmtSum = $pdo->prepare("SELECT 
        COUNT(*) as total_hari,
        COALESCE(SUM(pendapatan_kotor), 0) as total_pendapatan,
        COALESCE(SUM(pengeluaran_bensin + pengeluaran_lain), 0) as total_pengeluaran
        FROM operasional_harian 
        WHERE MONTH(tanggal) = ? AND YEAR(tanggal) = ?");
    $stmtSum->execute([$bulan, $tahun]);
    $sum = $stmtSum->fetch(PDO::FETCH_ASSOC);

    $bersih = ($sum['total_pendapatan'] ?? 0) - ($sum['total_pengeluaran'] ?? 0);

    echo json_encode([
        "status"  => "success",
        "data"    => $rows,
        "summary" => [
            "total_hari"  => intval($sum['total_hari'] ?? 0),
            "pendapatan"  => "Rp " . number_format($sum['total_pendapatan'] ?? 0, 0, ',', '.'),
            "pengeluaran" => "Rp " . number_format($sum['total_pengeluaran'] ?? 0, 0, ',', '.'),
            "bersih"      => "Rp " . number_format($bersih, 0, ',', '.')
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
