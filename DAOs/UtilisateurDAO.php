<?php

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../Models/Personne.php';
require_once __DIR__ . '/../Models/Administrateur.php';
require_once __DIR__ . '/../Models/Employe.php';

/**
 * UtilisateurDAO - Gestion des utilisateurs (Admin, Employé)
 */
class UtilisateurDAO
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::getInstance();
    }

    /**
     * Sauvegarder un nouvel utilisateur
     */
    public function sauvegarder(string $nom, string $prenom, string $sexe, string $poste, string $email, string $password, string $role): bool
    {
        try {
            $sql = "INSERT INTO utilisateurs (nom, prenom, sexe, poste, email, password, role, disponibilite, created_at)
                VALUES (:nom, :prenom, :sexe, :poste, :email, :password, :role, :disponibilite, NOW())";

            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                ':nom'          => $nom,
                ':prenom'       => $prenom,
                ':sexe'         => $sexe,
                ':poste'        => $poste,
                ':email'        => $email,
                ':password'     => $password,
                ':role'         => $role,
                ':disponibilite' => 'oui',
            ]);
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la sauvegarde : " . $e->getMessage());
        }
    }

    /**
     * Chercher utilisateur par email
     */
    public function trouverParEmail(string $email): ?object
    {
        try {
            $sql = "SELECT id, nom, prenom, sexe, poste, email, password, role, disponibilite
                    FROM utilisateurs
                    WHERE email = :email
                    LIMIT 1";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':email' => $email]);

            $data = $stmt->fetch(PDO::FETCH_ASSOC);

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
    public function trouverParId(int $id): ?object
    {
        try {
            if ($id === 0) {
                return new Administrateur(
                    0,
                    'Root',
                    'System',
                    'N/A',
                    'root@taskpro.com',
                    'root123',
                    'SuperAdmin',
                    'Administration'
                );
            }

            $sql = "SELECT id, nom, prenom, sexe, poste, email, password, role, disponibilite
                    FROM utilisateurs
                    WHERE id = :id
                    LIMIT 1";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $data = $stmt->fetch(PDO::FETCH_ASSOC);

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
    public function compterUtilisateurs(): int
    {
        try {
            $sql = "SELECT COUNT(*) as total FROM utilisateurs";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int) $result['total'];
        } catch (PDOException $e) {
            throw new Exception("Erreur comptage : " . $e->getMessage());
        }
    }

    /**
     * Mettre à jour utilisateur
     */
    public function mettreAJour(int $id, array $donnees): bool
    {
        try {
            $colonnes = [];
            $params = [':id' => $id];

            foreach ($donnees as $key => $value) {
                if (in_array($key, ['nom', 'prenom', 'sexe', 'poste', 'email', 'password', 'role'])) {
                    $colonnes[] = "$key = :$key";
                    $params[":$key"] = $value;
                }
            }

            if (empty($colonnes)) {
                return true;
            }

            $sql = "UPDATE utilisateurs 
                    SET " . implode(', ', $colonnes) . ", updated_at = NOW() 
                    WHERE id = :id";

            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            throw new Exception("Erreur mise à jour : " . $e->getMessage());
        }
    }

    /**
     * Obtenir tous les utilisateurs
     */
    public function obtenirTous(string $role = null): array
    {
        try {
            $sql = "SELECT id, nom, prenom, sexe, poste, email, password, role, disponibilite FROM utilisateurs";
            $params = [];

            if ($role !== null) {
                $sql .= " WHERE role = :role";
                $params[':role'] = $role;
            }

            $sql .= " ORDER BY created_at DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);

            $resultats = [];

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $resultats[] = $this->hydratiserUtilisateur($row);
            }

            return $resultats;
        } catch (PDOException $e) {
            throw new Exception("Erreur récupération : " . $e->getMessage());
        }
    }

    public function obtenirTousAvecTaches(string $role = null): array
    {
        try {
            $sql = "
            SELECT 
                u.*,
                CASE
                    WHEN SUM(CASE WHEN t.status IN ('assigné', 'en cours') THEN 1 ELSE 0 END) > 0
                    THEN 'non'
                    ELSE 'oui'
                END AS disponibilite,
                COUNT(t.id) AS total_taches
            FROM utilisateurs u
            LEFT JOIN taches t 
                ON t.id_responsable = u.id
        ";

            $params = [];

            if ($role !== null) {
                $sql .= " WHERE u.role = :role";
                $params[':role'] = $role;
            }

            $sql .= "
            GROUP BY u.id
            ORDER BY u.created_at DESC
        ";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            throw new Exception($e->getMessage());
        }
    }

    public function mettreAJourDisponibilite(int $userId): bool
    {
        try {
            $sql = "
            SELECT COUNT(*) as active_count
            FROM taches
            WHERE id_responsable = :id
            AND status IN ('assigné', 'en cours')
        ";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $userId]);

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $activeCount = isset($result['active_count']) ? (int) $result['active_count'] : 0;

            $disponible = ($activeCount === 0) ? 'oui' : 'non';

            $update = $this->pdo->prepare("
            UPDATE utilisateurs 
            SET disponibilite = :disp
            WHERE id = :id
        ");

            return $update->execute([
                ':disp' => $disponible,
                ':id'   => $userId
            ]);

        } catch (PDOException $e) {
            throw new Exception("Erreur disponibilité : " . $e->getMessage());
        }
    }

    public function obtenirDisponibles(): array
    {
        try {
            $sql = "
            SELECT id, nom, prenom, email, role, poste, disponibilite
            FROM utilisateurs
            WHERE disponibilite = 'oui'
            AND role != 'SuperAdmin'
        ";

            $stmt = $this->pdo->query($sql);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            throw new Exception("Erreur utilisateurs disponibles : " . $e->getMessage());
        }
    }

    public function obtenirTachesParUtilisateur(int $id): array
    {
        try {
            $sql = "
            SELECT *
            FROM taches
            WHERE id_responsable = :id
            ORDER BY created_at DESC
        ";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            throw new Exception("Erreur tâches utilisateur : " . $e->getMessage());
        }
    }

    public function obtenirParRole(string $role): array
    {
        return $this->obtenirTous($role);
    }

    public function obtenirUtilisateursAvecTachesParAdmin(int $idAdmin): array
    {
        $sql = "
        SELECT 
            u.id,
            u.nom,
            u.prenom,
            u.email,
            u.role,
            u.poste,
            CASE
                WHEN SUM(CASE WHEN t.status IN ('assigné', 'en cours') THEN 1 ELSE 0 END) > 0
                THEN 'non'
                ELSE 'oui'
            END AS disponibilite,
            COUNT(t.id) AS total_taches
        FROM utilisateurs u
        LEFT JOIN taches t 
            ON t.id_responsable = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
    ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Supprimer utilisateur
     */
    public function supprimer(int $id): bool
    {
        try {
            $sql = "DELETE FROM utilisateurs WHERE id = :id";

            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([':id' => $id]);
        } catch (PDOException $e) {
            throw new Exception("Erreur suppression : " . $e->getMessage());
        }
    }

    /**
     * Hydrater l'objet Utilisateur selon son rôle
     */
    private function hydratiserUtilisateur(array $data): object
    {
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
                    $data['role'],
                    $data['poste'] ?? 'Administration',
                    $data['disponibilite'] ?? 'oui'
                );

            case 'Employe':
                return new Employe(
                    $data['id'],
                    $data['nom'],
                    $data['prenom'],
                    $data['sexe'],
                    $data['poste'],
                    $data['email'],
                    $data['password'],
                    $data['disponibilite'] ?? 'oui'
                );

            default:
                throw new Exception("Rôle inconnu : " . $data['role']);
        }
    }
}