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
}