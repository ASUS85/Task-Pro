<?php

class NotificationDAO
{
    private $pdo;

    public function __construct()
    {
        // Utilisation de ton Singleton
        $this->pdo = Database::getInstance();
    }

    public function sauvegarder(int $idUtilisateur, string $type, string $message, ?int $idTache = null): bool
    {
        $sql = "INSERT INTO notifications (id_utilisateur, type, message, id_tache) 
                VALUES (:user, :type, :msg, :tache)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            'user' => $idUtilisateur,
            'type' => $type,
            'msg' => $message,
            'tache' => $idTache
        ]);
    }

    public function obtenirNonLues(int $idUtilisateur): array
    {
        try {
            $sql = "SELECT * FROM notifications WHERE id_utilisateur = :user AND is_read = 0 ORDER BY created_at DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['user' => $idUtilisateur]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Erreur récupération notifications : " . $e->getMessage());
        }
    }


    /**
     * Obtenir toutes les notifications d'un utilisateur (avec tri)
     */
    public function obtenirToutesParUtilisateur(int $idUtilisateur, string $ordre = 'DESC'): array
    {
        $ordre = strtoupper($ordre) === 'ASC' ? 'ASC' : 'DESC';
        $stmt = $this->pdo->prepare(
            "SELECT n.*, t.libelle AS tache_libelle, t.status AS tache_status,
                t.description AS tache_description, t.periode_realisation,
                t.dateCreation AS tache_dateCreation, t.id_responsable, t.id_createur
         FROM notifications n
         LEFT JOIN taches t ON n.id_tache = t.id
         WHERE n.id_utilisateur = :id
         ORDER BY n.created_at $ordre"
        );
        $stmt->execute([':id' => $idUtilisateur]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Compter les notifications non lues
     */
    public function compterNonLues(int $idUtilisateur): int
    {
        $stmt = $this->pdo->prepare(
            "SELECT COUNT(*) FROM notifications WHERE id_utilisateur = :id AND is_read = FALSE"
        );
        $stmt->execute([':id' => $idUtilisateur]);
        return (int) $stmt->fetchColumn();
    }

    /**
     * Marquer une notification comme lue
     */
    public function marquerCommeLue(int $idNotification, int $idUtilisateur): bool
    {
        $stmt = $this->pdo->prepare(
            "UPDATE notifications SET is_read = TRUE 
         WHERE id = :id AND id_utilisateur = :id_user"
        );
        return $stmt->execute([':id' => $idNotification, ':id_user' => $idUtilisateur]);
    }

    /**
     * Marquer toutes comme lues
     */
    public function marquerToutesCommeLues(int $idUtilisateur): bool
    {
        $stmt = $this->pdo->prepare(
            "UPDATE notifications SET is_read = TRUE WHERE id_utilisateur = :id"
        );
        return $stmt->execute([':id' => $idUtilisateur]);
    }

    /**
     * Supprimer une notification (appartenant à l'utilisateur)
     */
    public function supprimer(int $idNotification, int $idUtilisateur): bool
    {
        $stmt = $this->pdo->prepare(
            "DELETE FROM notifications WHERE id = :id AND id_utilisateur = :id_user"
        );
        return $stmt->execute([':id' => $idNotification, ':id_user' => $idUtilisateur]);
    }
}