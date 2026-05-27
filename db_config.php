<?php
// Database configuration credentials
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'expoflow');

/**
 * Returns a connection to the database, creating the database if it doesn't exist.
 */
function get_db_connection() {
    // First, connect without a specific database to ensure we can create it if missing
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS);
    
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    // Create database if not exists
    $db_name_sanitized = $conn->real_escape_string(DB_NAME);
    $sql = "CREATE DATABASE IF NOT EXISTS `$db_name_sanitized` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
    if (!$conn->query($sql)) {
        throw new Exception("Error creating database: " . $conn->error);
    }
    
    // Select the database
    $conn->select_db(DB_NAME);
    return $conn;
}
