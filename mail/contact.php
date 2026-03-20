<?php

// Contact form handler for WebWhizTech
// Sends messages to info@webwhiztech.com using Spaceship SMTP (mail.spacemail.com)

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Try to load PHPMailer via Composer autoload
$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require $autoloadPath;
} else {
    // If PHPMailer is not installed, fall back to plain mail() below
}

/**
 * Very small .env loader for this script only.
 * Looks for ../.env and populates $_ENV/$_SERVER if not already set.
 */
function wwt_load_env_if_needed(): void
{
    // If the variable is already set, don't bother reading a file
    if (getenv('WEBWHIZ_SMTP_PASSWORD') !== false) {
        return;
    }

    $envPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
    if (!is_readable($envPath)) {
        return;
    }

    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);

        // Skip comments
        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }

        // Very simple KEY=VALUE parser
        $parts = explode('=', $trimmed, 2);
        if (count($parts) !== 2) {
            continue;
        }

        [$key, $value] = $parts;
        $key   = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");

        if ($key === '') {
            continue;
        }

        if (getenv($key) === false) {
            // Populate superglobals; getenv() will see these in most SAPIs
            $_ENV[$key]    = $value;
            $_SERVER[$key] = $value;
            putenv($key . '=' . $value);
        }
    }
}

if (
    empty($_POST['name']) ||
    empty($_POST['subject']) ||
    empty($_POST['message']) ||
    !filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)
) {
    http_response_code(400);
    exit('Invalid form data');
}

$name     = strip_tags(htmlspecialchars($_POST['name']));
$email    = strip_tags(htmlspecialchars($_POST['email']));
$mSubject = strip_tags(htmlspecialchars($_POST['subject']));
$message  = strip_tags(htmlspecialchars($_POST['message']));

$toAddress = 'info@webwhiztech.com';

// On localhost: always return success so you can test the form (no real email sent)
$isLocalhost = in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1'], true)
    || (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') !== false);
if ($isLocalhost) {
    http_response_code(200);
    exit('Message sent');
}

// If PHPMailer is available, use SMTP (recommended)
if (class_exists(PHPMailer::class)) {
    // Ensure .env (if present) is loaded before we read the password
    wwt_load_env_if_needed();
    try {
        $mail = new PHPMailer(true);

        // SMTP settings (Spaceship)
        $mail->isSMTP();
        $mail->Host       = 'mail.spacemail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'info@webwhiztech.com';
        $mail->Password   = getenv('WEBWHIZ_SMTP_PASSWORD') ?: ''; // Set in .env or hosting env
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL
        $mail->Port       = 465;                         // or 587 with ENCRYPTION_STARTTLS

        // From / To
        $mail->setFrom('info@webwhiztech.com', 'WebWhizTech');
        $mail->addAddress($toAddress);
        $mail->addReplyTo($email, $name);

        // Content
        $mail->isHTML(false);
        $mail->Subject = $mSubject . ': ' . $name;
        $mail->Body    =
            "You have received a new message from your website contact form.\n\n" .
            "Here are the details:\n\n" .
            "Name: $name\n\n" .
            "Email: $email\n\n" .
            "Subject: $mSubject\n\n" .
            "Message:\n$message\n";

        $mail->send();
        http_response_code(200);
        exit('Message sent');
    } catch (Exception $e) {
        http_response_code(500);
        exit('Mailer Error: ' . $mail->ErrorInfo);
    }
}

// Fallback: plain PHP mail() if PHPMailer is not available
$subject = $mSubject . ': ' . $name;
$body    =
    "You have received a new message from your website contact form.\n\n" .
    "Here are the details:\n\n" .
    "Name: $name\n\n" .
    "Email: $email\n\n" .
    "Subject: $mSubject\n\n" .
    "Message:\n$message\n";

$headers  = "From: $email\r\n";
$headers .= "Reply-To: $email\r\n";

if (!mail($toAddress, $subject, $body, $headers)) {
    http_response_code(500);
    exit('Mail function failed');
}

http_response_code(200);
exit('Message sent');
