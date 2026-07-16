<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

// Memanggil koneksi database dari folder config
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Mengambil data mentah JSON yang dikirim oleh Fetch API di Frontend
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    // Validasi dasar: Tanggal dan Pendapatan wajib terisi
    if (!empty($data['tanggal']) && isset($data['pendapatan'])) {
        try {
            // Menyiapkan Query SQL dengan Prepared Statement untuk keamanan
            $stmt = $pdo->prepare("INSERT INTO operasional_harian 
                (tanggal, pendapatan_kotor, pengeluaran_bensin, pengeluaran_lain, jarak_tempuh_km) 
                VALUES (?, ?, ?, ?, ?)");

            $stmt->execute([
                $data['tanggal'],
                $data['pendapatan'],
                $data['bensin'],
                $data['lain_lain'],
                $data['jarak']
            ]);

            // Mengirimkan respon sukses kembali ke PWA
            echo json_encode([
                "status" => "success",
                "message" => "Data operasional hari ini berhasil disimpan!"
            ]);
        } catch (PDOException $e) {
            // Mengirimkan respon eror jika database bermasalah
            echo json_encode([
                "status" => "error",
                "message" => "Gagal menyimpan ke database: " . $e->getMessage()
            ]);
        }
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Data tidak lengkap! Tanggal dan Pendapatan wajib diisi."
        ]);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Metode request tidak diizinkan."
    ]);
}
?>