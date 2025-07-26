<?php
header("Content-Type: application/json");

// DB connection (edit credentials)
$host = "localhost:3306";
$db = "bookshop";
$user = "root";
$pass = "Ijse@1234";
$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "DB connection failed"]);
    exit;
}

// Get POST data
$username = trim($_POST["username"]);
$password = trim($_POST["password"]);
$role = trim($_POST["role"]);

if (empty($username) || empty($password) || empty($role)) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit;
}

// Check if username already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Username already taken"]);
    exit;
}

// Save new user
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
$stmt = $conn->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $username, $hashedPassword, $role);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Signup failed"]);
}
?>
