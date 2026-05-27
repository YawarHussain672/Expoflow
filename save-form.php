<?php
// Enable error reporting for debugging, but catch exceptions gracefully
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');

require_once 'db_config.php';

// Check if request is AJAX/JSON or typical form post
$is_ajax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') 
    || (strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false)
    || (strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false);

function send_response($success, $message, $is_ajax) {
    if ($is_ajax) {
        echo json_encode([
            'success' => $success,
            'message' => $message
        ]);
        exit;
    } else {
        // Render a beautiful HTML fallback response
        ?>
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title><?php echo $success ? 'Success - ExpoFlow' : 'Error - ExpoFlow'; ?></title>
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'IBM+Plex+Sans', 'IBM Plex Sans', sans-serif;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    color: #f8fafc;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }
                .card {
                    background: rgba(30, 41, 59, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 40px;
                    max-width: 480px;
                    width: 100%;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .icon {
                    width: 64px;
                    height: 64px;
                    margin: 0 auto 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    font-size: 28px;
                    font-weight: bold;
                }
                .icon.success {
                    background-color: rgba(16, 185, 129, 0.15);
                    color: #34d399;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }
                .icon.error {
                    background-color: rgba(239, 68, 68, 0.15);
                    color: #f87171;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }
                h1 {
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 12px;
                    background: linear-gradient(to right, #38bdf8, #818cf8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                p {
                    color: #94a3b8;
                    line-height: 1.6;
                    margin-bottom: 30px;
                }
                .btn {
                    display: inline-block;
                    background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
                    color: white;
                    text-decoration: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 500;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon <?php echo $success ? 'success' : 'error'; ?>">
                    <?php echo $success ? '✓' : '✗'; ?>
                </div>
                <h1><?php echo $success ? 'Application Submitted!' : 'Submission Failed'; ?></h1>
                <p><?php echo htmlspecialchars($message); ?></p>
                <a href="index.html" class="btn">Back to Home</a>
            </div>
        </body>
        </html>
        <?php
        exit;
    }
}

// Parse request body if JSON
if (strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
    $raw_input = file_get_contents('php://input');
    $_POST = json_decode($raw_input, true) ?? [];
}

// Validate inputs
$first_name = trim($_POST['first_name'] ?? '');
$last_name = trim($_POST['last_name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$organisation_name = trim($_POST['organisation_name'] ?? '');
$program_name = trim($_POST['program_name'] ?? '');
$program_website = trim($_POST['program_website'] ?? '');
$message = trim($_POST['message'] ?? '');
$privacy_policy = trim($_POST['privacy_policy'] ?? '');

if (empty($first_name) || empty($email) || empty($phone) || empty($organisation_name) || empty($program_name) || empty($privacy_policy)) {
    send_response(false, 'Please fill in all required fields and accept the privacy policy.', $is_ajax);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_response(false, 'Please provide a valid email address.', $is_ajax);
}

try {
    // Connect to MySQL and auto-initialize database
    $conn = get_db_connection();

    // Create table if it doesn't exist
    $table_sql = "CREATE TABLE IF NOT EXISTS `free_trials` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `first_name` VARCHAR(100) NOT NULL,
        `last_name` VARCHAR(100) NULL,
        `email` VARCHAR(150) NOT NULL,
        `phone` VARCHAR(30) NOT NULL,
        `organisation_name` VARCHAR(150) NOT NULL,
        `program_name` VARCHAR(150) NOT NULL,
        `program_website` VARCHAR(255) NULL,
        `message` TEXT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";

    if (!$conn->query($table_sql)) {
        throw new Exception("Error creating table: " . $conn->error);
    }

    // Insert record
    $insert_sql = "INSERT INTO `free_trials` 
        (`first_name`, `last_name`, `email`, `phone`, `organisation_name`, `program_name`, `program_website`, `message`) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($insert_sql);
    if (!$stmt) {
        throw new Exception("Prepare statement failed: " . $conn->error);
    }

    $stmt->bind_param(
        "ssssssss", 
        $first_name, 
        $last_name, 
        $email, 
        $phone, 
        $organisation_name, 
        $program_name, 
        $program_website, 
        $message
    );

    if ($stmt->execute()) {
        send_response(true, 'Your trial application has been successfully saved. We will contact you shortly!', $is_ajax);
    } else {
        throw new Exception("Execute statement failed: " . $stmt->error);
    }

} catch (Exception $e) {
    // Graceful error logging/response
    send_response(false, 'Database Error: ' . $e->getMessage(), $is_ajax);
}
