<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';

class NotificationServices {
    private $notificationDAO;

    // Configuration SMTP (Tu pourras les mettre dans un fichier config plus tard)
    private const SMTP_HOST = 'smtp.gmail.com';
    private const SMTP_USER = 'uchiwai215@gmail.com';
    private const SMTP_PASS = 'hxgnmdniqfduotou'; // Ton pass d'application
    private const SMTP_PORT = 587;

    public function __construct($notificationDAO) {
        $this->notificationDAO = $notificationDAO;
    }

    /**
     * Méthode principale pour notifier un utilisateur sur tous les canaux
     */
    public function notifierUtilisateur(int $idDestinataire, string $emailDestinataire, string $prenomDestinataire, string $message, ?int $idTache = null) {
        
        // 1. Notification Web (Base de données)
        $this->notificationDAO->sauvegarder($idDestinataire, "INFO", $message, $idTache);

        // 2. Notification Email
        $this->envoyerEmail($emailDestinataire, $prenomDestinataire, $message);
    }

    private function envoyerEmail(string $to, string $prenom, string $contenu) {
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = self::SMTP_HOST;
            $mail->SMTPAuth   = true;
            $mail->Username   = self::SMTP_USER;
            $mail->Password   = self::SMTP_PASS;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = self::SMTP_PORT;

            $mail->setFrom(self::SMTP_USER, 'Task-Pro Notification');
            $mail->addAddress($to, $prenom);
            $mail->isHTML(true);
            $mail->Subject = "Nouvelle mise a jour sur Task-Pro";
            $mail->Body    = "<h3>Bonjour $prenom,</h3><p>$contenu</p>";

            $mail->send();
        } catch (Exception $e) {
            // Optionnel: logger l'erreur
            throw new Exception("Erreur lors de l'envoi de l'email : " . $mail->ErrorInfo);
        }
    }
}