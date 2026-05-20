<?php

class NotificationDAO {
    private $pdo;

    public function __construct() {
        // Utilisation de ton Singleton
        $this->pdo = Database::getInstance();
    }

    public function sauvegarder(int $idUtilisateur, string $type, string $message, ?int $idTache = null): bool {
        $sql = "INSERT INTO notifications (id_utilisateur, type, message, id_tache) 
                VALUES (:user, :type, :msg, :tache)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            'user'  => $idUtilisateur,
            'type'  => $type,
            'msg'   => $message,
            'tache' => $idTache
        ]);
    }

    public function obtenirNonLues(int $idUtilisateur): array {
        try {
            $sql = "SELECT * FROM notifications WHERE id_utilisateur = :user AND is_read = 0 ORDER BY created_at DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['user' => $idUtilisateur]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Erreur récupération notifications : " . $e->getMessage());
        }
    }
}