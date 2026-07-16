<?php
$host = "localhost";
$dbname = "ojol_kir_db";
$username = "root";
$password = ""; // Kosongkan jika Laragon Anda masih standar

try {
    // Menggunakan PDO untuk keamanan dari SQL Injection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Koneksi Database Gagal: " . $e->getMessage());
}
?>