<?php
error_reporting(0);
ini_set('display_errors', 0);

try {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit();
    }

    $input = @file_get_contents('php://input');
    if (!$input) {
        echo json_encode(['success' => false, 'error' => 'No input received']);
        exit();
    }

    $data = @json_decode($input, true);
    if (!$data) {
        echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
        exit();
    }

    if (!isset($data['message']) || !isset($data['phoneNumber'])) {
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        exit();
    }

    $message = $data['message'];
    $phoneNumber = $data['phoneNumber'];

    if (!function_exists('curl_init')) {
        echo json_encode(['success' => false, 'error' => 'cURL not available']);
        exit();
    }

    // Try to load config from outside public_html first (production)
    if (file_exists(__DIR__ . '/../../sms/config.php')) {
        require_once __DIR__ . '/../../sms/config.php';
    } 
    // Fallback to local config (development)
    elseif (file_exists(__DIR__ . '/config.php')) {
        require_once __DIR__ . '/config.php';
    } else {
        throw new Exception('Config file not found');
    }
    
    $apiUrl = 'https://api.sms-gate.app/3rdparty/v1/message';
    $username = SMS_GATEWAY_USERNAME;
    $password = SMS_GATEWAY_PASSWORD;

    $payload = json_encode([
        'message' => $message,
        'phoneNumbers' => [$phoneNumber]
    ]);

    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Basic ' . base64_encode($username . ':' . $password)
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        echo json_encode(['success' => false, 'error' => 'SMS API error: ' . $curlError]);
        exit();
    }

    if ($httpCode >= 200 && $httpCode < 300) {
        echo json_encode(['success' => true, 'message' => 'SMS sent successfully']);
    } else {
        $errorResponse = @json_decode($response, true);
        $errorMsg = is_array($errorResponse) ? json_encode($errorResponse) : $response;
        echo json_encode(['success' => false, 'error' => 'SMS API returned error code ' . $httpCode, 'details' => $errorMsg]);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Exception: ' . $e->getMessage()]);
}
?>

