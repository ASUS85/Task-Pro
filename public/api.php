<?php

/**
 * API PRINCIPALE - Task Pro
 * Point d'entrée unique pour toutes les routes
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Démarrer session pour authentification
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Inclusions des classes
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../Models/Personne.php';
require_once __DIR__ . '/../Models/Administrateur.php';
require_once __DIR__ . '/../Models/Employe.php';
require_once __DIR__ . '/../Models/Tache.php';
require_once __DIR__ . '/../DAOs/UtilisateurDAO.php';
require_once __DIR__ . '/../DAOs/TacheDAO.php';
require_once __DIR__ . '/../Services/AuthServices.php';
require_once __DIR__ . '/../Services/TacheService.php';

// Récupérer la route et la méthode
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/Task-Pro/public/api.php', '', $path);
$parts = array_filter(explode('/', $path));

// Récupérer les données de requête
$input = file_get_contents("php://input");
$data = json_decode($input, true) ?? [];

// Variables utiles
$utilisateurDAO = new UtilisateurDAO();
$tacheDAO = new TacheDAO();
$authServices = new AuthServices($utilisateurDAO);
$tacheServices = new TacheService($tacheDAO, $utilisateurDAO);

// ========================================
// ROUTAGE
// ========================================

try {
    // ========== AUTH ==========
    if ($parts[0] === 'auth') {
        
        // POST /api/auth/register
        if ($parts[1] === 'register' && $method === 'POST') {
            $utilisateurDAO->sauvegarder(
                $data['nom'],
                $data['prenom'],
                $data['sexe'] ?? 'Non spécifié',
                $data['email'],
                $data['poste'] ?? 'Non spécifié',
                password_hash($data['password'], PASSWORD_BCRYPT),
                'Employé' // L'employé s'enregistre
            );
            echo json_encode(['success' => true, 'message' => 'Inscription réussie']);
            exit;
        }

        // POST /api/auth/login
        if ($parts[1] === 'login' && $method === 'POST') {
            $user = $authServices->connecter($data['email'], $data['password']);
            $_SESSION['user_id'] = $user->getId();
            $_SESSION['user_role'] = $user->getRole();
            $_SESSION['user_email'] = $user->getEmail();
            
            echo json_encode([
                'success' => true,
                'message' => 'Connexion réussie',
                'user' => [
                    'id' => $user->getId(),
                    'nom' => $user->getNom(),
                    'prenom' => $user->getPrenom(),
                    'sexe' => $user->getSexe(),
                    'poste' => $user->getPoste(),
                    'email' => $user->getEmail(),
                    'role' => $user->getRole()
                ]
            ]);
            exit;
        }

        // POST /api/auth/logout
        if ($parts[1] === 'logout' && $method === 'POST') {
            session_destroy();
            echo json_encode(['success' => true, 'message' => 'Déconnexion réussie']);
            exit;
        }

        // GET /api/auth/me (utilisateur connecté)
        if ($parts[1] === 'me' && $method === 'GET') {
            if (!isset($_SESSION['user_id'])) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Non authentifié']);
                exit;
            }
            
            $user = $utilisateurDAO->trouverParId($_SESSION['user_id']);
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user->getId(),
                    'nom' => $user->getNom(),
                    'prenom' => $user->getPrenom(),
                    'sexe' => $user->getSexe(),
                    'poste' => $user->getPoste(),
                    'email' => $user->getEmail(),
                    'role' => $user->getRole()
                ]
            ]);
            exit;
        }

        // POST /api/auth/profile (modifier profil)
        if ($parts[1] === 'profile' && $method === 'POST') {
            if (!isset($_SESSION['user_id'])) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Non authentifié']);
                exit;
            }
            
            $authServices->modifierProfil($_SESSION['user_id'], $data);
            echo json_encode(['success' => true, 'message' => 'Profil mise à jour']);
            exit;
        }
    }

    // ========== TÂCHES ==========
    if ($parts[0] === 'taches') {
        
        // Vérifier authentification
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Non authentifié']);
            exit;
        }

        // POST /api/taches/create
        if ($parts[1] === 'create' && $method === 'POST') {
            $result = $tacheServices->creerTache($data, $_SESSION['user_id']);
            echo json_encode(['success' => $result, 'message' => 'Tâche créée']);
            exit;
        }

        // GET /api/taches/list
        if ($parts[1] === 'list' && $method === 'GET') {
            $taches = $tacheServices->getTaches($_SESSION['user_id']);
            echo json_encode([
                'success' => true,
                'taches' => $taches
            ]);
            exit;
        }

        // GET /api/taches/:id
        if ($method === 'GET' && isset($parts[1]) && is_numeric($parts[1])) {
            $tache = $tacheDAO->trouverParId((int) $parts[1]);
            if (!$tache) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Tâche introuvable']);
                exit;
            }
            
            echo json_encode([
                'success' => true,
                'tache' => [
                    'id' => $tache->getId(),
                    'libelle' => $tache->getLibelle(),
                    'description' => $tache->getDescription(),
                    'status' => $tache->getStatus(),
                    'id_parent' => $tache->getIdParent(),
                    'periode_realisation' => $tache->getPeriodeRealisation(),
                    'dateCreation' => $tache->getDateCreation(),
                    'dateDebutAssignation' => $tache->getDateDebutAssignation(),
                    'dateFinReelle' => $tache->getDateFinReelle(),
                    'cheminFichier' => $tache->getCheminFichier(),
                    'id_responsable' => $tache->getIdResponsable(),
                    'id_createur' => $tache->getIdCreateur()
                ]
            ]);
            exit;
        }

        // PUT /api/taches/:id/status
        if ($method === 'PUT' && isset($parts[1]) && is_numeric($parts[1]) && $parts[2] === 'status') {
            $result = $tacheServices->modifierStatut((int) $parts[1], $data['status'], $_SESSION['user_id']);
            echo json_encode(['success' => $result, 'message' => 'Statut modifié']);
            exit;
        }

        // PUT /api/taches/:id/assign
        if ($method === 'PUT' && isset($parts[1]) && is_numeric($parts[1]) && $parts[2] === 'assign') {
            $result = $tacheServices->assignerTache((int) $parts[1], $data['id_responsable'], $_SESSION['user_id']);
            echo json_encode(['success' => $result, 'message' => 'Tâche assignée']);
            exit;
        }

        // DELETE /api/taches/:id
        if ($method === 'DELETE' && isset($parts[1]) && is_numeric($parts[1])) {
            $result = $tacheServices->supprimerTache((int) $parts[1], $_SESSION['user_id']);
            echo json_encode(['success' => $result, 'message' => 'Tâche supprimée']);
            exit;
        }
    }

    // ========== ADMIN - Gestion Utilisateurs (SuperAdmin only) ==========
    if ($parts[0] === 'admin') {
        
        // Vérifier SuperAdmin
        if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'SuperAdmin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Accès refusé (SuperAdmin requis)']);
            exit;
        }

        // POST /api/admin/users/create
        if ($parts[1] === 'users' && $parts[2] === 'create' && $method === 'POST') {
            $result = $authServices->creerUtilisateurParAdmin($data, $_SESSION['user_id']);
            echo json_encode(['success' => $result, 'message' => 'Utilisateur créé']);
            exit;
        }

        // GET /api/admin/users
        if ($parts[1] === 'users' && $method === 'GET') {
            $users = $utilisateurDAO->obtenirTous();
            echo json_encode(['success' => true, 'users' => $users]);
            exit;
        }

        // GET /api/admin/users/:id
        if ($parts[1] === 'users' && is_numeric($parts[2]) && $method === 'GET') {
            $user = $utilisateurDAO->trouverParId((int) $parts[2]);
            echo json_encode(['success' => true, 'user' => $user]);
            exit;
        }

        // DELETE /api/admin/users/:id
        if ($parts[1] === 'users' && is_numeric($parts[2]) && $method === 'DELETE') {
            $result = $utilisateurDAO->supprimer((int) $parts[2]);
            echo json_encode(['success' => $result, 'message' => 'Utilisateur supprimé']);
            exit;
        }
    }

    // Route non trouvée
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint not found']);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
