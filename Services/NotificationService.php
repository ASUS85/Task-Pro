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
    public function notifierUtilisateur(int $idDestinataire, string $emailDestinataire, string $prenomDestinataire, string $message, ?int $idTache = null, ?string $subject = null): array {
        // 1. Notification Web (Base de données)
        $this->notificationDAO->sauvegarder($idDestinataire, "INFO", $message, $idTache);

        if (!$this->isValidEmail($emailDestinataire)) {
            return [
                'success' => false,
                'reason' => 'missing_email',
                'message' => "L'adresse e-mail du destinataire n'est pas disponible. Le message n'a pas pu être envoyé par email.",
            ];
        }

        try {
            $mailSubject = $subject ?? 'Notification Task-Pro';
            $this->envoyerEmail($emailDestinataire, $prenomDestinataire, $message, $mailSubject);
            return ['success' => true];
        } catch (Exception $e) {
            error_log("Erreur email: " . $e->getMessage());
            return [
                'success' => false,
                'reason' => 'send_error',
                'message' => "Impossible d'envoyer l'email : " . $e->getMessage(),
            ];
        }
    }

    private function isValidEmail(string $email): bool {
        return filter_var(trim($email), FILTER_VALIDATE_EMAIL) !== false;
    }

    private function envoyerEmail(string $to, string $prenom, string $contenu, string $subject) {
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
            $mail->Subject = $subject;
            $mail->Body    = "<h3>Bonjour $prenom,</h3><p>$contenu</p><hr><p><em>Message automatisé - Ne pas répondre</em></p>";

            $mail->send();
        } catch (Exception $e) {
            throw new Exception($e->getMessage());
        }
    }
}