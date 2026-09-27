<?php
/**
 * AI Virtual Try-On - Server-side Generation Endpoint
 *
 * Receives the person photo and clothing photo, validates files,
 * dispatches server-side HTTPS request to Google Gemini API via cURL,
 * extracts generated try-on image, saves result temporarily, and returns JSON.
 *
 * Runs on standard PHP 8.1+ (XAMPP / Apache / Shared Web Hosting)
 * No Node.js, Express, or Composer required.
 */

// Enable strict type declarations and error suppression for clean JSON output
error_reporting(0);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

// Define access constant for config.php
define('TRYON_ACCESS', true);
require_once __DIR__ . '/config.php';

// Helper function to send JSON response and terminate
function jsonResponse(bool $success, string $message, array $extra = [], int $httpCode = 200): void {
    http_response_code($httpCode);
    $payload = array_merge([
        'success' => $success,
        $success ? 'message' : 'error' => $message,
    ], $extra);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

// Ensure request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Only POST requests are supported.', [], 405);
}

// Verify API Key is configured
if (empty(GOOGLE_API_KEY) || GOOGLE_API_KEY === 'YOUR_API_KEY') {
    jsonResponse(false, 'Google Gemini API key is not configured. Please set GOOGLE_API_KEY in config.php or as an environment variable.', [
        'hint' => 'Edit config.php and replace YOUR_API_KEY with your Google Gemini API key from Google AI Studio.'
    ], 500);
}

// Ensure required upload and result directories exist
if (!is_dir(UPLOAD_DIR)) {
    @mkdir(UPLOAD_DIR, 0755, true);
}
if (!is_dir(RESULTS_DIR)) {
    @mkdir(RESULTS_DIR, 0755, true);
}

// -------------------------------------------------------------
// 1. File Upload Validation
// -------------------------------------------------------------
$fileKeys = ['person_image', 'clothing_image'];
$tempFilesToDelete = [];

foreach ($fileKeys as $key) {
    if (!isset($_FILES[$key]) || !is_array($_FILES[$key])) {
        jsonResponse(false, "Missing required file upload: '{$key}'.", [], 400);
    }

    $file = $_FILES[$key];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        $uploadErrors = [
            UPLOAD_ERR_INI_SIZE   => 'The uploaded file exceeds the upload_max_filesize directive in php.ini.',
            UPLOAD_ERR_FORM_SIZE  => 'The uploaded file exceeds the MAX_FILE_SIZE directive in the HTML form.',
            UPLOAD_ERR_PARTIAL    => 'The uploaded file was only partially uploaded.',
            UPLOAD_ERR_NO_FILE    => "No file was uploaded for '{$key}'.",
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder on the server.',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to server disk.',
            UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the file upload.',
        ];
        $errMsg = $uploadErrors[$file['error']] ?? 'Unknown upload error occurred.';
        jsonResponse(false, "Upload error for {$key}: {$errMsg}", [], 400);
    }

    // Check file size
    if ($file['size'] > MAX_FILE_SIZE_BYTES) {
        $maxMb = round(MAX_FILE_SIZE_BYTES / (1024 * 1024));
        jsonResponse(false, "File '{$key}' exceeds maximum allowed size of {$maxMb}MB.", [], 400);
    }

    if ($file['size'] < 100) {
        jsonResponse(false, "File '{$key}' is too small or empty.", [], 400);
    }
}

try {
    // -------------------------------------------------------------
    // 2. MIME Type Validation (Server-side inspection)
    // -------------------------------------------------------------
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if (!$finfo) {
        jsonResponse(false, 'Server failed to initialize fileinfo extension.', [], 500);
    }

    $validatedData = [];

    foreach ($fileKeys as $key) {
        $tmpPath = $_FILES[$key]['tmp_name'];
        $mimeType = finfo_file($finfo, $tmpPath);

        if (!array_key_exists($mimeType, ALLOWED_MIME_TYPES)) {
            finfo_close($finfo);
            jsonResponse(false, "Invalid file format for '{$key}'. Allowed formats are JPEG, PNG, and WebP. Detected: {$mimeType}", [], 400);
        }

        // Generate safe random temporary filename inside uploads/
        $ext = ALLOWED_MIME_TYPES[$mimeType];
        $safeName = 'input_' . bin2hex(random_bytes(16)) . '.' . $ext;
        $destPath = UPLOAD_DIR . $safeName;

        if (!move_uploaded_file($tmpPath, $destPath)) {
            // Fallback to copy if move fails (e.g. across mount points)
            if (!copy($tmpPath, $destPath)) {
                finfo_close($finfo);
                jsonResponse(false, "Failed to temporarily save '{$key}' on server.", [], 500);
            }
        }

        $tempFilesToDelete[] = $destPath;

        // Read and encode image as base64 for Gemini API payload
        $rawBytes = file_get_contents($destPath);
        if ($rawBytes === false) {
            finfo_close($finfo);
            jsonResponse(false, "Failed to read uploaded image '{$key}'.", [], 500);
        }

        $validatedData[$key] = [
            'mimeType' => $mimeType,
            'base64'   => base64_encode($rawBytes),
        ];
    }
    finfo_close($finfo);

    // Optional user garment category or instructions from request
    $garmentCategory = isset($_POST['garment_type']) ? trim(strip_tags($_POST['garment_type'])) : 'clothing';
    $customInstructions = isset($_POST['instructions']) ? trim(strip_tags($_POST['instructions'])) : '';

    // -------------------------------------------------------------
    // 3. Construct Gemini Prompt & Payload
    // -------------------------------------------------------------
    $prompt = "You are a professional fashion image editing and virtual try-on engine.\n\n"
        . "IMAGE 1 is the PERSON REFERENCE photo (the model/user).\n"
        . "IMAGE 2 is the CLOTHING REFERENCE photo (the {$garmentCategory} item).\n\n"
        . "TASK:\n"
        . "Generate a photorealistic, high-resolution image of the exact same person from Image 1 wearing the clothing item from Image 2.\n\n"
        . "CRITICAL REQUIREMENTS TO PRESERVE:\n"
        . "1. Person Identity: Strictly preserve the person's face, facial features, eyes, hair style/color, skin tone, body shape, proportions, and natural pose.\n"
        . "2. Garment Fidelity: Accurately transfer the clothing from Image 2 onto the person, matching its exact color, patterns, textile material, cut, collar, sleeves, hems, buttons, zipper, textures, and visible graphics/branding.\n"
        . "3. Realistic Physics & Lighting: The clothing must naturally wrap around the person's torso/body with authentic fabric folds, natural tension creases, shadows, ambient lighting consistent with Image 1's scene, and proper occlusion.\n"
        . "4. Context: Preserve the background and ambient atmosphere of Image 1 wherever possible.\n"
        . "5. Do NOT modify the person's identity, age, or features.\n";

    if (!empty($customInstructions)) {
        $prompt .= "\nADDITIONAL USER INSTRUCTION: " . $customInstructions . "\n";
    }

    $aspectRatio = isset($_POST['aspect_ratio']) && in_array($_POST['aspect_ratio'], ['3:4', '1:1', '4:3', '9:16', '16:9'])
        ? $_POST['aspect_ratio']
        : DEFAULT_ASPECT_RATIO;

    // Build Gemini REST API payload
    $payload = [
        'contents' => [
            [
                'role' => 'user',
                'parts' => [
                    [
                        'inlineData' => [
                            'mimeType' => $validatedData['person_image']['mimeType'],
                            'data'     => $validatedData['person_image']['base64'],
                        ],
                    ],
                    [
                        'inlineData' => [
                            'mimeType' => $validatedData['clothing_image']['mimeType'],
                            'data'     => $validatedData['clothing_image']['base64'],
                        ],
                    ],
                    [
                        'text' => $prompt,
                    ],
                ],
            ],
        ],
        'generationConfig' => [
            'imageConfig' => [
                'aspectRatio' => $aspectRatio,
            ],
        ],
    ];

    // -------------------------------------------------------------
    // 4. Send HTTPS Request via PHP cURL
    // -------------------------------------------------------------
    $apiUrl = GEMINI_API_BASE_URL . urlencode(GEMINI_MODEL) . ':generateContent';

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $apiUrl,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'x-goog-api-key: ' . GOOGLE_API_KEY,
            'User-Agent: ai-virtual-try-on/1.0 (PHP ' . PHP_VERSION . ')',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => CURL_TIMEOUT_SECONDS,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);

    $rawResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    $curlErrno = curl_errno($ch);
    curl_close($ch);

    // Handle cURL connection failures
    if ($rawResponse === false || $curlErrno !== 0) {
        jsonResponse(false, 'Failed to connect to Google Gemini API: ' . $curlError, [
            'curl_errno' => $curlErrno,
            'hint'       => 'Verify that your server allows outbound HTTPS connections to generativelanguage.googleapis.com and that cURL has a valid CA bundle.'
        ], 502);
    }

    $responseData = json_decode($rawResponse, true);

    // Handle HTTP error codes from Google API
    if ($httpCode !== 200) {
        $errorMessage = 'Google Gemini API returned error (HTTP ' . $httpCode . ')';
        if (isset($responseData['error']['message'])) {
            $errorMessage = $responseData['error']['message'];
        }
        jsonResponse(false, $errorMessage, [
            'http_code' => $httpCode,
            'status'    => $responseData['error']['status'] ?? 'ERROR'
        ], $httpCode >= 400 && $httpCode < 500 ? 400 : 502);
    }

    // -------------------------------------------------------------
    // 5. Parse Gemini API Response for Generated Image
    // -------------------------------------------------------------
    $generatedImageBytes = null;
    $generatedMimeType = 'image/png';
    $textExplanations = [];

    if (!empty($responseData['candidates']) && is_array($responseData['candidates'])) {
        foreach ($responseData['candidates'] as $candidate) {
            $parts = $candidate['content']['parts'] ?? [];
            foreach ($parts as $part) {
                // Check camelCase inlineData or snake_case inline_data
                $inlineData = $part['inlineData'] ?? $part['inline_data'] ?? null;
                if ($inlineData && !empty($inlineData['data'])) {
                    $generatedImageBytes = base64_decode($inlineData['data']);
                    $generatedMimeType = $inlineData['mimeType'] ?? $inlineData['mime_type'] ?? 'image/png';
                    break 2;
                }

                if (!empty($part['text'])) {
                    $textExplanations[] = trim($part['text']);
                }
            }
        }
    }

    // If an image was returned by the model, save it to results/
    if ($generatedImageBytes !== null && strlen($generatedImageBytes) > 100) {
        $resultExt = ($generatedMimeType === 'image/jpeg' || $generatedMimeType === 'image/jpg') ? 'jpg' : 'png';
        $resultFileName = 'tryon_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $resultExt;
        $resultFilePath = RESULTS_DIR . $resultFileName;

        if (file_put_contents($resultFilePath, $generatedImageBytes) === false) {
            jsonResponse(false, 'Virtual try-on was generated, but the server failed to save it to disk.', [], 500);
        }

        // Relative URL for browser consumption
        $resultUrl = 'results/' . $resultFileName;

        // Perform background maintenance cleanup of older files
        cleanupOldResults();

        jsonResponse(true, 'Virtual try-on generated successfully!', [
            'result_url'   => $resultUrl,
            'aspect_ratio' => $aspectRatio,
            'model'        => GEMINI_MODEL,
            'created_at'   => date('c'),
        ]);
    }

    // If no image was in the response, explain why
    $feedback = !empty($textExplanations)
        ? implode("\n\n", $textExplanations)
        : 'The model did not return image data for this request.';

    jsonResponse(false, 'The AI model responded with a text description rather than a visual try-on image: ' . $feedback, [
        'model'        => GEMINI_MODEL,
        'model_output' => $feedback,
        'hint'         => 'Check that your Google Gemini API key has access to the image generation model (' . GEMINI_MODEL . ').'
    ], 422);

} catch (Throwable $e) {
    jsonResponse(false, 'An unexpected server error occurred: ' . $e->getMessage(), [], 500);
} finally {
    // -------------------------------------------------------------
    // 6. Delete Temporary Upload Files (Privacy & Disk Hygiene)
    // -------------------------------------------------------------
    foreach ($tempFilesToDelete as $filePath) {
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }
}

/**
 * Periodically delete results older than CLEANUP_MAX_AGE_SECONDS to conserve hosting disk space.
 */
function cleanupOldResults(): void {
    if (!is_dir(RESULTS_DIR)) return;
    $now = time();
    $files = @scandir(RESULTS_DIR);
    if (!$files) return;

    foreach ($files as $file) {
        if ($file === '.' || $file === '..' || $file === '.htaccess' || $file === 'index.html') continue;
        $fullPath = RESULTS_DIR . $file;
        if (is_file($fullPath)) {
            $mtime = @filemtime($fullPath);
            if ($mtime && ($now - $mtime) > CLEANUP_MAX_AGE_SECONDS) {
                @unlink($fullPath);
            }
        }
    }
}
