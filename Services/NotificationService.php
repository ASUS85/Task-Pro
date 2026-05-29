<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../Models/Tache.php';
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/ConfigManager.php';

class NotificationService
{
    private $notificationDAO;
    private $config;

    public function __construct($notificationDAO)
    {
        $this->notificationDAO = $notificationDAO;
        $this->config = ConfigManager::getInstance();
    }

    /**
     * Méthode principale pour notifier un utilisateur sur tous les canaux
     */
    public function notifierUtilisateur(int $idDestinataire, string $emailDestinataire, string $prenomDestinataire, string $message, ?int $idTache = null, ?string $subject = null): array
    {
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

    private function isValidEmail(string $email): bool
    {
        return filter_var(trim($email), FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Génère le contenu HTML complet d'une tâche
     */
    public function genererContenuTache(Tache $tache, $createur = null, $responsable = null): string
    {
        $statusColor = match ($tache->getStatus()) {
            'assigné' => '#0d6efd',
            'en cours' => '#fd7e14',
            'terminé' => '#198754',
            'expiré' => '#dc3545',
            default => '#6c757d'
        };

        return "
        <div style='font-family: Arial, sans-serif; padding: 10px;'>

            <h2 style='color:#0d6efd;'>Task-Pro Notification</h2>

            <p>Une mise à jour concernant une tâche vient d'être effectuée.</p>

            <table style='border-collapse: collapse; width:100%;' border='1' cellpadding='8'>

                <tr>
                    <th align='left'>Libellé</th>
                    <td>" . htmlspecialchars($tache->getLibelle()) . "</td>
                </tr>

                <tr>
                    <th align='left'>Description</th>
                    <td>" . htmlspecialchars($tache->getDescription()) . "</td>
                </tr>

                <tr>
                    <th align='left'>Statut</th>
                    <td>
                        <span style='color:white;background:$statusColor;padding:5px 10px;border-radius:5px;'>
                            " . htmlspecialchars($tache->getStatus()) . "
                        </span>
                    </td>
                </tr>

                <tr>
                    <th align='left'>Date création</th>
                    <td>" . htmlspecialchars($tache->getDateCreation()) . "</td>
                </tr>

                <tr>
                    <th align='left'>Début assignation</th>
                    <td>" . (htmlspecialchars($tache->getDateDebutAssignation()) ?? 'Non défini') . "</td>
                </tr>

                <tr>
                    <th align='left'>Période réalisation</th>
                    <td>" . htmlspecialchars($tache->getPeriodeRealisation()) . "</td>
                </tr>

                <tr>
                    <th align='left'>Responsable</th>
                    <td>" . (
            $responsable
            ? $responsable->getPrenom() . ' ' . $responsable->getNom()
            : 'Non assigné'
        ) . "</td>
                </tr>

                <tr>
                    <th align='left'>Créateur</th>
                    <td>" . (
            $createur
            ? $createur->getPrenom() . ' ' . $createur->getNom()
            : 'Inconnu'
        ) . "</td>
                </tr>

                <tr>
                    <th align='left'>Fichier</th>
                    <td>" . ($tache->getCheminFichier() ?? 'Aucun fichier') . "</td>
                </tr>

            </table>

            <br>

            <p>
                Connectez-vous à votre plateforme Task-Pro pour consulter les détails.
            </p>

            <hr>

            <small>
                Message automatique - Task-Pro
            </small>

        </div>
    ";
    }



    private function envoyerEmail(string $to, string $prenom, string $contenu, string $subject)
    {
        $mail = new PHPMailer(true);

        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ];

        try {
            // Désactivation du debug bavard pour la production/développement propre
            $mail->SMTPDebug = 0; 

            $mail->isSMTP();
            // Utilisation des valeurs du .env avec l'alias config()
            $mail->Host       = config('MAIL_HOST', 'smtp.gmail.com');
            $mail->SMTPAuth   = true;
            $mail->SMTPDebug = 2;
            $mail->Debugoutput = 'error_log';
            $mail->Username   = config('MAIL_USERNAME');
            $mail->Password   = config('MAIL_PASSWORD');
            $mail->SMTPSecure = config('MAIL_ENCRYPTION') === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port       = (int)config('MAIL_PORT', 587);

            // L'expéditeur est lu de manière sécurisée depuis le .env
            $fromEmail = config('MAIL_FROM');
            $fromName  = config('MAIL_FROM_NAME', 'TaskPro');
            
            $mail->setFrom($fromEmail, $fromName);
            $mail->addAddress($to, $prenom);
            
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = "
                            <h3>Bonjour $prenom,</h3>
                            $contenu
                            <hr>
                            <p><em>Message automatisé - Ne pas répondre</em></p>
                        ";

            $mail->send();
        } catch (Exception $e) {
            throw new Exception("Échec SMTP", 0, $e);
        }
    }
}