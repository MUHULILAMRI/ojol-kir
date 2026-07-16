<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Metode tidak diizinkan."]);
    exit;
}

$input = file_get_contents("php://input");
$data  = json_decode($input, true);

if (empty($data['tanggal']) || !isset($data['pendapatan'])) {
    echo json_encode(["status" => "error", "message" => "Tanggal dan Pendapatan wajib diisi!"]);
    exit;
}

// Sanitasi
$tanggal   = $data['tanggal'];
$pendapatan = max(0, intval($data['pendapatan']));
$bensin     = max(0, intval($data['bensin'] ?? 0));
$lain_lain  = max(0, intval($data['lain_lain'] ?? 0));
$jarak      = max(0, floatval($data['jarak'] ?? 0));

try {
    $stmt = $pdo->prepare("INSERT INTO operasional_harian 
        (tanggal, pendapatan_kotor, pengeluaran_bensin, pengeluaran_lain, jarak_tempuh_km) 
        VALUES (?, ?, ?, ?, ?)");

    $stmt->execute([$tanggal, $pendapatan, $bensin, $lain_lain, $jarak]);

    echo json_encode([
        "status"  => "success",
        "message" => "Data berhasil disimpan!",
        "data"    => [
            "tanggal"    => $tanggal,
            "pendapatan" => $pendapatan,
            "pengeluaran"=> $bensin + $lain_lain,
            "bersih"     => $pendapatan - $bensin - $lain_lain,
            "jarak"      => $jarak
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Gagal menyimpan: " . $e->getMessage()]);
}
?>