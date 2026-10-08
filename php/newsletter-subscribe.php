<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../PHPMailer-master/src/Exception.php';
require_once '../PHPMailer-master/src/PHPMailer.php';
require_once '../PHPMailer-master/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['email']) || empty($data['email'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email is required']);
    exit;
}

$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
$name = isset($data['name']) ? htmlspecialchars($data['name']) : 'Valued Customer';
$verificationLink = isset($data['verificationLink']) ? $data['verificationLink'] : '';

// Generate unsubscribe link
$hostname = $_SERVER['HTTP_HOST'] ?? 'realpaintattoo.ink';
$isLocalhost = strpos($hostname, 'localhost') !== false || strpos($hostname, '127.0.0.1') !== false;
$basePath = $isLocalhost ? 'http://' . $hostname . '/capstone_revision' : 'https://' . $hostname;
$unsubscribeLink = $basePath . '/unsubscribe-newsletter.html?email=' . urlencode($email);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit;
}

$mail = new PHPMailer(true);

$fromEmail = getenv('SMTP_USERNAME') ?: 'admin@realpaintattoo.ink';
$smtpHost = getenv('SMTP_HOST') ?: 'mail.privateemail.com';
$smtpPassword = getenv('SMTP_PASSWORD') ?: '';

if (empty($smtpPassword)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Email configuration is missing. Set SMTP_PASSWORD in the environment.'
    ]);
    exit;
}

try {
    $mail->isSMTP();
    $mail->SMTPDebug  = 0;
    $mail->Host       = $smtpHost;
    $mail->SMTPAuth   = true;
    $mail->Username   = $fromEmail;
    $mail->Password   = $smtpPassword;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = (int) (getenv('SMTP_PORT') ?: 587);
    $mail->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );

    $mail->setFrom($fromEmail, 'Real Pain Tattoo Studio');
    $mail->addAddress($email, $name);

    $mail->isHTML(true);
    $mail->Subject = 'Verify Your Newsletter Subscription - Real Pain Tattoo Studio';
    $mail->addReplyTo($fromEmail, 'Real Pain Tattoo Studio');
    
    if (!empty($verificationLink)) {
        $mail->Body = '
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #ffffff;
                }
                .button {
                    display: inline-block;
                    padding: 12px 30px;
                    background: #1a1a1a !important;
                    color: white !important;
                    text-decoration: none !important;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-weight: bold;
                    text-align: center;
                    border: none;
                }
                .button:hover {
                    background: #333 !important;
                }
                .unsubscribe-link {
                    color: #666;
                    font-size: 12px;
                    text-decoration: underline;
                    margin-top: 30px;
                    display: block;
                }
            </style>
        </head>
        <body>
            <p>Hi ' . htmlspecialchars($name) . ',</p>
            
            <p>Thanks for subscribing to our newsletter!</p>
            
            <p>Please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="' . htmlspecialchars($verificationLink) . '" class="button" style="display: inline-block; padding: 12px 30px; background: #1a1a1a !important; color: white !important; text-decoration: none !important; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">' . htmlspecialchars($verificationLink) . '</p>
            
            <p>Best regards,<br>
            Real Pain Tattoo Studio<br>
            19A Pepay St. Wawa 1632 Makati, Philippines</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #666; text-align: center;">
                If you didn\'t subscribe to our newsletter, you can 
                <a href="' . htmlspecialchars($unsubscribeLink) . '" style="color: #666; text-decoration: underline;">unsubscribe here</a>.
            </p>
        </body>
        </html>
        ';

        $mail->AltBody = "Hi $name,\n\nThanks for subscribing to our newsletter!\n\nPlease verify your email address by visiting this link:\n$verificationLink\n\nIf you didn't subscribe to our newsletter, you can unsubscribe here:\n$unsubscribeLink\n\nBest regards,\nReal Pain Tattoo Studio\n19A Pepay St. Wawa 1632 Makati, Philippines";
    } else {
        $mail->Body = '
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #ffffff;
                }
            </style>
        </head>
        <body>
            <p>Hi ' . htmlspecialchars($name) . ',</p>
            
            <p>Thanks for subscribing to our newsletter!</p>
            
            <p>We\'ll keep you updated on new designs, special offers, and studio news.</p>
            
            <p>Visit us anytime at: <a href="https://realpaintattoo.ink">realpaintattoo.ink</a></p>
            
            <p>Best regards,<br>
            Real Pain Tattoo Studio<br>
            19A Pepay St. Wawa 1632 Makati, Philippines</p>
        </body>
        </html>
        ';

        $mail->AltBody = "Hi $name,\n\nThanks for subscribing to our newsletter!\n\nWe'll keep you updated on new designs, special offers, and studio news.\n\nVisit us anytime at: https://realpaintattoo.ink\n\nBest regards,\nReal Pain Tattoo Studio\n19A Pepay St. Wawa 1632 Makati, Philippines";
    }

    $mail->send();
    
    echo json_encode([
        'success' => true, 
        'message' => 'Successfully subscribed to newsletter!'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Failed to send confirmation email: ' . $mail->ErrorInfo
    ]);
}
?>

