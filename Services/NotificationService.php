<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/ConfigManager.php';

class NotificationService {
    private $notificationDAO;
    private $config;

    public function __construct($notificationDAO) {
        $this->notificationDAO = $notificationDAO;
        $this->config = ConfigManager::getInstance();
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
            $mailConfig = $this->config->getMailConfig();

            $mail->isSMTP();
            $mail->Host       = $mailConfig['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $mailConfig['username'];
            $mail->Password   = $mailConfig['password'];
            $mail->SMTPSecure = $mailConfig['encryption'] === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port       = $mailConfig['port'];

            $mail->setFrom($mailConfig['from'], 'Task-Pro Notification');
            $mail->addAddress($to, $prenom);
            $mail->isHTML(true);
            $mail->Subject = "Nouvelle mise à jour sur Task-Pro";
            $mail->Body    = "<h3>Bonjour $prenom,</h3><p>$contenu</p><hr><p><em>Message automatisé - Ne pas répondre</em></p>";

            $mail->send();
        } catch (Exception $e) {
            // Log l'erreur au lieu de la laisser en clair
            error_log("Erreur email: " . $mail->ErrorInfo);
            throw new Exception("Erreur lors de l'envoi de l'email");
        }
    }
}