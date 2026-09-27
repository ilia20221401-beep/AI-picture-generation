<?php
/**
 * AI Virtual Try-On - Configuration File
 *
 * This file contains the server-side configuration and Google Gemini API credentials.
 * It is protected from direct browser access.
 *
 * For XAMPP: C:\xampp\htdocs\ai-virtual-try-on\config.php
 * For Web Hosting: upload to your site root directory.
 */

// Block direct access via browser URL
if (!defined('TRYON_ACCESS') && realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    http_response_code(403);
    header('Content-Type: application/json; charset=UTF-8');
    exit(json_encode([
        'success' => false,
        'error' => 'Direct access to configuration file is prohibited.'
    ]));
}

// -------------------------------------------------------------
// 1. Google Gemini API Key Configuration
// -------------------------------------------------------------
// We first check system environment variables, then .env file if available.
$detectedApiKey = getenv('GEMINI_API_KEY') ?: getenv('GOOGLE_API_KEY');

// If no environment variable is present, attempt to read from a local .env file
if (!$detectedApiKey && file_exists(__DIR__ . '/.env')) {
    $envLines = @file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($envLines) {
        foreach ($envLines as $line) {
            $line = trim($line);
            if (empty($line) || strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val, " \t\n\r\0\x0B\"'");
                if ($key === 'GEMINI_API_KEY' || $key === 'GOOGLE_API_KEY') {
                    $detectedApiKey = $val;
                    break;
                }
            }
        }
    }
}

// Define the API key. Replace 'YOUR_API_KEY' if not using an environment variable.
define('GOOGLE_API_KEY', $detectedApiKey ?: 'YOUR_API_KEY');

// -------------------------------------------------------------
// 2. Gemini Model Selection
// -------------------------------------------------------------
// Currently supported Google Gemini image-capable models:
// - 'gemini-3.1-flash-lite-image' (Recommended: fast, high efficiency, general image editing)
// - 'gemini-3.1-flash-image' (High quality image generation & editing, supports 1K/2K resolution)
define('GEMINI_MODEL', getenv('GEMINI_MODEL') ?: 'gemini-3.1-flash-lite-image');

// Gemini REST API Endpoint URL
define('GEMINI_API_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta/models/');

// -------------------------------------------------------------
// 3. Upload & File Security Settings
// -------------------------------------------------------------
// Maximum allowed file upload size per image in bytes (10 Megabytes)
define('MAX_FILE_SIZE_BYTES', 10 * 1024 * 1024);

// Allowed MIME types and their validated file extensions
define('ALLOWED_MIME_TYPES', [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
]);

// Project directories (with trailing slash)
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('RESULTS_DIR', __DIR__ . '/results/');

// Aspect ratio for generated try-on ("3:4", "1:1", "4:3", "9:16", "16:9")
define('DEFAULT_ASPECT_RATIO', '3:4');

// Automatically clean up generated results older than this time (in seconds)
// 7200 seconds = 2 hours. Keeps free hosting disk usage low.
define('CLEANUP_MAX_AGE_SECONDS', 7200);

// Request timeout for Gemini API cURL call in seconds
define('CURL_TIMEOUT_SECONDS', 120);
