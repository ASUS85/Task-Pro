<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EmailService
{
    private $config;

    public function __construct($config)
    {
        $this->config = $config;
    }

    public function send(string $to, string $name, string $subject, string $html): bool
    {
        $mail = new PHPMailer(true);

        try {
            $mail->SMTPDebug = 2; 
            $mail->Debugoutput = 'error_log';

            $mail->isSMTP();
            $mail->Host = $this->config['host'];
            $mail->SMTPAuth = true;
            $mail->Username = $this->config['username'];
            $mail->Password = $this->config['password'];
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $this->config['port'];

            $mail->setFrom($this->config['from'], 'Task-Pro');
            $mail->addAddress($to, $name);

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $html;

            return $mail->send();
        } catch (Exception $e) {
            error_log("EMAIL ERROR: " . $e->getMessage());
            return false;
        }
    }
}