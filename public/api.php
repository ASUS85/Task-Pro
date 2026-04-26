<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Inclusions
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../Models/Personne.php';
require_once __DIR__ . '/../Models/Administrateur.php';
require_once __DIR__ . '/../Models/Employe.php';
require_once __DIR__ . '/../Models/Tache.php';
require_once __DIR__ . '/../DAOs/UtilisateurDAO.php';
require_once __DIR__ . '/../DAOs/TacheDAO.php';
require_once __DIR__ . '/../DAOs/NotificationDAO.php';
require_once __DIR__ . '/../Services/AuthServices.php';
require_once __DIR__ . '/../Services/TacheService.php';
require_once __DIR__ . '/../Services/NotificationService.php';

// ===============================
// ROUTE PROPRE (FIX PRINCIPAL)
// ===============================
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$base = dirname($_SERVER['SCRIPT_NAME']);
$path = str_replace($base . '/api.php', '', $uri);
$path = trim($path, '/');
$parts = $path ? explode('/', $path) : [];

// Méthode
$method = $_SERVER['REQUEST_METHOD'];

// Données JSON
$input = file_get_contents("php://input");
$data = json_decode($input, true) ?? [];

// Services
$utilisateurDAO = new UtilisateurDAO();
$tacheDAO = new TacheDAO();
$notificationDAO = new NotificationDAO(); 
$notificationServices = new NotificationServices($notificationDAO);

$authServices = new AuthServices($utilisateurDAO);
$tacheServices = new TacheService($tacheDAO, $utilisateurDAO, $notificationServices);


// Helpers
function requireAuth()
{
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Non authentifié']);
        exit;
    }
}

function requireSuperAdmin()
{
    if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'SuperAdmin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Accès refusé']);
        exit;
    }
}

// ===============================
// ROUTAGE
// ===============================
try {

    // ROOT
    if (empty($parts)) {
        echo json_encode([
            'success' => true,
            'message' => 'API Task-Pro fonctionne'
        ]);
        exit;
    }

    // ================= AUTH =================
    if ($parts[0] === 'auth') {

        // REGISTER
        if (($parts[1] ?? '') === 'register' && $method === 'POST') {
            $utilisateurDAO->sauvegarder(
             $data['nom'] ?? '',
             $data['prenom'] ?? '',
             $data['sexe'] ?? 'Non spécifié',
             $data['poste'] ?? '', // Position 4
             $data['email'] ?? '', // Position 5
             password_hash($data['password'] ?? '', PASSWORD_BCRYPT),
             'Employe'
         );

            echo json_encode(['success' => true, 'message' => 'Inscription réussie']);
            exit;
        }

        // LOGIN
        if (($parts[1] ?? '') === 'login' && $method === 'POST') {
            $user = $authServices->connecter($data['email'], $data['password']);

            $_SESSION['user_id'] = $user->getId();
            $_SESSION['user_role'] = $user->getRole();

            echo json_encode([
                'success' => true,
                'message' => 'Connexion réussie',
                'user' => [
                    'id' => $user->getId(),
                    'nom' => $user->getNom(),
                    'prenom' => $user->getPrenom(),
                    'email' => $user->getEmail(),
                    'role' => $user->getRole()
                ]
            ]);
            exit;
        }

        // LOGOUT
        if (($parts[1] ?? '') === 'logout' && $method === 'POST') {
            session_destroy();
            echo json_encode(['success' => true]);
            exit;
        }

        // ME
        if (($parts[1] ?? '') === 'me' && $method === 'GET') {
            requireAuth();

            $user = $utilisateurDAO->trouverParId($_SESSION['user_id']);

            echo json_encode(['success' => true, 'user' => $user]);
            exit;
        }
    }

    // ================= TACHES =================
    if ($parts[0] === 'taches') {

        requireAuth();

        // CREATE
        if (($parts[1] ?? '') === 'create' && $method === 'POST') {
            $result = $tacheServices->creerTache($data, $_SESSION['user_id']);
            echo json_encode(['success' => $result]);
            exit;
        }

        // LIST
        if (($parts[1] ?? '') === 'list' && $method === 'GET') {
            $taches = $tacheServices->getTaches($_SESSION['user_id']);
            echo json_encode(['success' => true, 'taches' => $taches]);
            exit;
        }

        // GET BY ID
        if ($method === 'GET' && isset($parts[1]) && is_numeric($parts[1])) {
            $tache = $tacheDAO->trouverParId((int)$parts[1]);
            echo json_encode(['success' => true, 'tache' => $tache]);
            exit;
        }

        // STATUS
        if ($method === 'PUT' && isset($parts[1], $parts[2]) && $parts[2] === 'status') {
            $result = $tacheServices->modifierStatut((int)$parts[1], $data['status'], $_SESSION['user_id']);
            echo json_encode(['success' => $result]);
            exit;
        }

        // ASSIGN
        if ($method === 'PUT' && isset($parts[1], $parts[2]) && $parts[2] === 'assign') {
            $result = $tacheServices->assignerTache((int)$parts[1], $data['id_responsable'], $_SESSION['user_id']);
            echo json_encode(['success' => $result]);
            exit;
        }

        // DELETE
        if ($method === 'DELETE' && isset($parts[1])) {
            $result = $tacheServices->supprimerTache((int)$parts[1], $_SESSION['user_id']);
            echo json_encode(['success' => $result]);
            exit;
        }
    }

     //  pour les notifications
    if ($parts[0] === 'notifications') {
     requireAuth();
     $notifDAO = new NotificationDAO();

        if ($method === 'GET') {
         // On utilise la méthode du DAO plutôt que de réécrire le SQL ici
         $notifications = $notifDAO->obtenirNonLues($_SESSION['user_id']);
         echo json_encode(['success' => true, 'notifications' => $notifications]);
         exit;
        }
   }

    // ================= ADMIN =================
    if ($parts[0] === 'admin') {

        requireSuperAdmin();

        if (($parts[1] ?? '') === 'users' && ($parts[2] ?? '') === 'create') {
            $result = $authServices->creerUtilisateurParAdmin($data, $_SESSION['user_id']);
            echo json_encode(['success' => $result]);
            exit;
        }

        if (($parts[1] ?? '') === 'users' && $method === 'GET') {
            $users = $utilisateurDAO->obtenirTous();
            echo json_encode(['success' => true, 'users' => $users]);
            exit;
        }
    }

    // NOT FOUND
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint not found']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
