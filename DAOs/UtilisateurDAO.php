<?php

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../Models/Personne.php';
require_once __DIR__ . '/../Models/Administrateur.php';
require_once __DIR__ . '/../Models/Employe.php';

/**
 * UtilisateurDAO - Gestion des utilisateurs (Admin, Employé)
 */
class UtilisateurDAO {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance();
    }

    /**
     * Sauvegarder un nouvel utilisateur
     */
    public function sauvegarder(string $nom, string $prenom, string $sexe, string $email, string $password, string $role): bool {
        try {
            $sql = "INSERT INTO utilisateurs (nom, prenom, sexe, email, password, role, created_at) 
                    VALUES (:nom, :prenom, :sexe, :email, :password, :role, NOW())";
            
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                ':nom' => $nom,
                ':prenom' => $prenom,
                ':sexe' => $sexe,
                ':email' => $email,
                ':password' => $password,
                ':role' => $role,
            ]);
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la sauvegarde : " . $e->getMessage());
        }
    }

    /**
     * Chercher utilisateur par email
     */
    public function trouverParEmail(string $email): ?object {
        try {
            $sql = "SELECT id, nom, prenom, sexe, email, password, role FROM utilisateurs WHERE email = :email LIMIT 1";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':email' => $email]);
            
            $data = $stmt->fetch();
            if (!$data) {
                return null;
            }

            return $this->hydratiserUtilisateur($data);
        } catch (PDOException $e) {
            throw new Exception("Erreur recherche email : " . $e->getMessage());
        }
    }

    /**
     * Chercher utilisateur par ID
     */
    public function trouverParId(int $id): ?object {
        try {
            $sql = "SELECT id, nom, prenom, sexe, email, password, role FROM utilisateurs WHERE id = :id LIMIT 1";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);
            
            $data = $stmt->fetch();
            if (!$data) {
                return null;
            }

            return $this->hydratiserUtilisateur($data);
        } catch (PDOException $e) {
            throw new Exception("Erreur recherche ID : " . $e->getMessage());
        }
    }

    /**
     * Compter total utilisateurs
     */
    public function compterUtilisateurs(): int {
        try {
            $sql = "SELECT COUNT(*) as total FROM utilisateurs WHERE role != :supersuper";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':supersuper' => 'SuperSuperAdmin']);
            
            $result = $stmt->fetch();
            return (int) $result['total'];
        } catch (PDOException $e) {
            throw new Exception("Erreur comptage : " . $e->getMessage());
        }
    }

    /**
     * Mettre à jour utilisateur
     */
    public function mettreAJour(int $id, array $donnees): bool {
        try {
            $colonnes = [];
            $params = [':id' => $id];

            foreach ($donnees as $key => $value) {
                if (in_array($key, ['nom', 'prenom', 'sexe', 'email', 'password', 'role'])) {
                    $colonnes[] = "$key = :$key";
                    $params[":$key"] = $value;
                }
            }

            if (empty($colonnes)) {
                return true; // Rien à mettre à jour
            }

            $sql = "UPDATE utilisateurs SET " . implode(', ', $colonnes) . ", updated_at = NOW() WHERE id = :id";
            
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            throw new Exception("Erreur mise à jour : " . $e->getMessage());
        }
    }

    /**
     * Obtenir tous les utilisateurs (sauf SuperSuperAdmin)
     */
    public function obtenirTous(string $role = null): array {
        try {
            $sql = "SELECT id, nom, prenom, sexe, email, password, role FROM utilisateurs WHERE role != :supersuper";
            $params = [':supersuper' => 'SuperSuperAdmin'];

            if ($role !== null) {
                $sql .= " AND role = :role";
                $params[':role'] = $role;
            }

            $sql .= " ORDER BY created_at DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            $resultats = [];
            while ($row = $stmt->fetch()) {
                $resultats[] = $this->hydratiserUtilisateur($row);
            }

            return $resultats;
        } catch (PDOException $e) {
            throw new Exception("Erreur récupération : " . $e->getMessage());
        }
    }

    /**
     * Obtenir utilisateurs par rôle
     */
    public function obtenirParRole(string $role): array {
        return $this->obtenirTous($role);
    }

    /**
     * Supprimer utilisateur (soft delete possible)
     */
    public function supprimer(int $id): bool {
        try {
            $sql = "DELETE FROM utilisateurs WHERE id = :id AND role != :supersuper";
            
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                ':id' => $id,
                ':supersuper' => 'SuperSuperAdmin'
            ]);
        } catch (PDOException $e) {
            throw new Exception("Erreur suppression : " . $e->getMessage());
        }
    }

    /**
     * Hydrater l'objet Utilisateur selon son rôle
     */
    private function hydratiserUtilisateur(array $data): object {
        switch ($data['role']) {
            case 'Administrateur':
            case 'SuperAdmin':
                return new Administrateur(
                    $data['id'],
                    $data['nom'],
                    $data['prenom'],
                    $data['sexe'],
                    $data['email'],
                    $data['password'],
                    $data['role']
                );

            case 'Employé':
                return new Employe(
                    $data['id'],
                    $data['nom'],
                    $data['prenom'],
                    $data['sexe'],
                    $data['email'],
                    $data['password']
                );

            default:
                throw new Exception("Rôle inconnu : " . $data['role']);
        }
    }
}
