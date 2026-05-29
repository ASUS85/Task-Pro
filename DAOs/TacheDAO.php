<?php

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../Models/Tache.php';

/**
 * TacheDAO - Gestion des tâches en base de données
 */
class TacheDAO
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getInstance();
    }

    /**
     * Sauvegarder une nouvelle tâche
     */
    public function sauvegarder(array $donnees): bool
    {
        try {
            $sql = "INSERT INTO taches 
                    (libelle, description, status, id_parent, periode_realisation, dateCreation, 
                     dateDebutAssignation, dateFinReelle, cheminFichier, id_responsable, id_createur) 
                    VALUES 
                    (:libelle, :description, :status, :id_parent, :periode_realisation, COALESCE(:dateCreation, NOW()), 
                     :dateDebutAssignation, :dateFinReelle, :cheminFichier, :id_responsable, :id_createur)";

            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                ':libelle' => $donnees['libelle'],
                ':description' => $donnees['description'],
                ':status' => $donnees['status'] ?? 'non assigné',
                ':id_parent' => $donnees['id_parent'] ?? null,
                ':periode_realisation' => $donnees['periode_realisation'],
                ':dateCreation' => $donnees['dateCreation'] ?? null,
                ':dateDebutAssignation' => array_key_exists('dateDebutAssignation', $donnees) ? $donnees['dateDebutAssignation'] : null,
                ':dateFinReelle' => $donnees['dateFinReelle'] ?? null,
                ':cheminFichier' => $donnees['cheminFichier'] ?? null,
                ':id_responsable' => $donnees['id_responsable'],
                ':id_createur' => $donnees['id_createur'],
            ]);
        } catch (PDOException $e) {
            throw new Exception("Erreur sauvegarde tâche : " . $e->getMessage());
        }
    }

    /**
     * Chercher tâche par ID
     */
    public function trouverParId(int $id): ?Tache
    {
        try {
            $sql = "SELECT * FROM taches WHERE id = :id LIMIT 1";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $data = $stmt->fetch();
            if (!$data) {
                return null;
            }

            return $this->hydratiserTache($data);
        } catch (PDOException $e) {
            throw new Exception("Erreur recherche tâche : " . $e->getMessage());
        }
    }

    /**
     * Obtenir toutes les tâches
     */
    public function obtenirTous(): array
    {
        try {
            $sql = "SELECT * FROM taches ORDER BY dateCreation DESC";

            $stmt = $this->pdo->query($sql);

            $resultats = [];
            while ($row = $stmt->fetch()) {
                $resultats[] = $this->hydratiserTache($row);
            }

            return $resultats;
        } catch (PDOException $e) {
            throw new Exception("Erreur récupération : " . $e->getMessage());
        }
    }

    /**
     * Obtenir tâches par responsable (employé assigné)
     */
    public function obtenirParResponsable(int $idResponsable): array
    {
        try {
            $sql = "SELECT * FROM taches WHERE id_responsable = :id_responsable ORDER BY dateCreation DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id_responsable' => $idResponsable]);

            $resultats = [];
            while ($row = $stmt->fetch()) {
                $resultats[] = $this->hydratiserTache($row);
            }

            return $resultats;
        } catch (PDOException $e) {
            throw new Exception("Erreur récupération par responsable : " . $e->getMessage());
        }
    }

    /**
     * Obtenir tâches créées par un administrateur
     */
    public function obtenirParCreateur(int $idCreateur): array
    {
        try {
            $sql = "SELECT * FROM taches WHERE id_createur = :id_createur ORDER BY dateCreation DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id_createur' => $idCreateur]);

            $resultats = [];
            while ($row = $stmt->fetch()) {
                $resultats[] = $this->hydratiserTache($row);
            }

            return $resultats;
        } catch (PDOException $e) {
            throw new Exception("Erreur récupération par créateur : " . $e->getMessage());
        }
    }

    /**
     * Obtenir tâches parentes (pour trouver les enfants)
     */
    public function obtenirParenteDe(int $idParent): array
    {
        try {
            $sql = "SELECT * FROM taches WHERE id_parent = :id_parent ORDER BY dateCreation DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id_parent' => $idParent]);

            $resultats = [];
            while ($row = $stmt->fetch()) {
                $resultats[] = $this->hydratiserTache($row);
            }

            return $resultats;
        } catch (PDOException $e) {
            throw new Exception("Erreur récupération enfants : " . $e->getMessage());
        }
    }

    /**
     * Obtenir tâches non assignées (avec parent en attente)
     */
    public function obtenirNonAssignees(): array
    {
        try {
            $sql = "SELECT * FROM taches WHERE status = 'non assigné' ORDER BY dateCreation ASC";

            $stmt = $this->pdo->query($sql);

            $resultats = [];
            while ($row = $stmt->fetch()) {
                $resultats[] = $this->hydratiserTache($row);
            }

            return $resultats;
        } catch (PDOException $e) {
            throw new Exception("Erreur récupération non assignées : " . $e->getMessage());
        }
    }

    /**
     * Modifier le statut d'une tâche
     */
    public function modifierStatut(int $idTache, string $nouveauStatut): bool
    {
        try {
            // Gérer certains cas particuliers lors du changement de statut
            if ($nouveauStatut === 'terminé') {
                $sql = "UPDATE taches SET status = :status, dateFinReelle = NOW(), updated_at = NOW() WHERE id = :id";
            } elseif ($nouveauStatut === 'assigné') {
                // Lorsqu'on passe à 'assigné', enregistrer la dateDebutAssignation
                $sql = "UPDATE taches SET status = :status, dateDebutAssignation = NOW(), updated_at = NOW() WHERE id = :id";
            } else {
                $sql = "UPDATE taches SET status = :status, updated_at = NOW() WHERE id = :id";
            }

            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                ':status' => $nouveauStatut,
                ':id' => $idTache
            ]);
        } catch (PDOException $e) {
            throw new Exception("Erreur modification statut : " . $e->getMessage());
        }
    }

    /**
     * Modifier le responsable (réassigner tâche)
     */
    public function modifierResponsable(int $idTache, int $newIdResponsable): bool
    {
        try {
            $sql = "UPDATE taches SET id_responsable = :id_responsable, updated_at = NOW() WHERE id = :id";

            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                ':id_responsable' => $newIdResponsable,
                ':id' => $idTache
            ]);
        } catch (PDOException $e) {
            throw new Exception("Erreur modification responsable : " . $e->getMessage());
        }
    }

    /**
     * Modifier les détails d'une tâche
     */
    public function modifierTache(int $idTache, array $donnees): bool
    {
        try {
            $sql = "UPDATE taches SET libelle = :libelle, description = :description, periode_realisation = :periode_realisation, id_parent = :id_parent, updated_at = NOW() WHERE id = :id";

            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                ':libelle' => $donnees['libelle'],
                ':description' => $donnees['description'],
                ':periode_realisation' => $donnees['periode_realisation'],
                ':id_parent' => $donnees['id_parent'] ?? null,
                ':id' => $idTache
            ]);
        } catch (PDOException $e) {
            throw new Exception("Erreur modification tâche : " . $e->getMessage());
        }
    }

    /**
     * Modifier date début assignation (T+1min transition)
     */
    public function modifierDateDebutAssignation(int $idTache, string $date): bool
    {
        try {
            $sql = "UPDATE taches SET dateDebutAssignation = :date, updated_at = NOW() WHERE id = :id";

            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                ':date' => $date,
                ':id' => $idTache
            ]);
        } catch (PDOException $e) {
            throw new Exception("Erreur modification date : " . $e->getMessage());
        }
    }

    /**
     * Mettre à jour le chemin du fichier
     */
    public function modifierFichier(int $idTache, ?string $cheminFichier): bool
    {
        try {
            $sql = "UPDATE taches SET cheminFichier = :chemin, updated_at = NOW() WHERE id = :id";

            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                ':chemin' => $cheminFichier,
                ':id' => $idTache
            ]);
        } catch (PDOException $e) {
            throw new Exception("Erreur modification fichier : " . $e->getMessage());
        }
    }

    /**
     * Supprimer une tâche
     */
    public function supprimer(int $idTache): bool
    {
        try {
            // Récupérer le fichier avant suppression
            $tache = $this->trouverParId($idTache);
            if ($tache && $tache->getCheminFichier()) {
                @unlink($tache->getCheminFichier()); // Supprimer le fichier physique
            }

            $sql = "DELETE FROM taches WHERE id = :id";

            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([':id' => $idTache]);
        } catch (PDOException $e) {
            throw new Exception("Erreur suppression : " . $e->getMessage());
        }
    }

    public function getLastInsertId(): int
    {
        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Hydrater objet Tache à partir données BD
     */
    private function hydratiserTache(array $data): Tache
    {
        // Normaliser le statut pour éviter les valeurs vides/inattendues
        $status = isset($data['status']) ? trim($data['status']) : '';
        if ($status === '') {
            $status = 'non assigné';
        }

        return new Tache(
            (int) $data['id'],
            $data['libelle'],
            $data['description'],
            $status,
            $data['id_parent'] ? (int) $data['id_parent'] : null,
            $data['periode_realisation'],
            $data['dateCreation'],
            $data['dateDebutAssignation'] ?? null,
            $data['dateFinReelle'] ?? null,
            $data['cheminFichier'] ?? null,
            $data['id_responsable'] !== null ? (int) $data['id_responsable'] : null,
            $data['id_createur'] !== null ? (int) $data['id_createur'] : null
        );
    }
}
