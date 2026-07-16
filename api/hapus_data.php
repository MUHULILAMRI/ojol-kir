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

if (!isset($data['id']) || !is_numeric($data['id'])) {
    echo json_encode(["status" => "error", "message" => "ID tidak valid."]);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM operasional_harian WHERE id = ?");
    $stmt->execute([intval($data['id'])]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(["status" => "success", "message" => "Data berhasil dihapus."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Data tidak ditemukan."]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
