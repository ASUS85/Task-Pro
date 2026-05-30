<?php

header("Content-Type: application/json");

// Gestion dynamique de l'origine pour accepter les Credentials
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
} else {
    header("Access-Control-Allow-Origin: http://localhost");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH,  OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ============================================================
// INITIALISATION DE LA CONFIGURATION (Sécurité & Environnement)
// ============================================================
require_once __DIR__ . '/../config/ConfigManager.php';
// Force le Singleton à charger le fichier .env dès le départ
ConfigManager::getInstance();

// Inclusions des composants de l'application
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
$notificationServices = new NotificationService($notificationDAO);

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

        $action = $parts[1] ?? '';

        // REGISTER
        if ($action === 'register' && $method === 'POST') {
            try {
                $authServices->inscrire($data);
                echo json_encode([
                    'success' => true,
                    'message' => 'Inscription réussie'
                ]);
            } catch (Exception $e) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => $e->getMessage()
                ]);
            }
            exit;
        }

        // LOGIN
        if ($action === 'login' && $method === 'POST') {
            try {
                $user = $authServices->connecter(
                    $data['email'] ?? '',
                    $data['password'] ?? ''
                );

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
                        'role' => $user->getRole(),
                        'sexe' => method_exists($user, 'getSexe') ? $user->getSexe() : ($user->sexe ?? null)
                    ]
                ]);
            } catch (Exception $e) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => $e->getMessage()
                ]);
            }
            exit;
        }

        // ME
        if ($action === 'me' && $method === 'GET') {
            requireAuth();
            $user = $utilisateurDAO->trouverParId($_SESSION['user_id']);

            if (!$user) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Utilisateur introuvable'
                ]);
                exit;
            }

            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user->getId(),
                    'nom' => $user->getNom(),
                    'prenom' => $user->getPrenom(),
                    'email' => $user->getEmail(),
                    'role' => $user->getRole(),
                    'sexe' => method_exists($user, 'getSexe') ? $user->getSexe() : ($user->sexe ?? null),
                    'poste' => $user->getPoste()
                ]
            ]);
            exit;
        }

        // UPDATE PROFILE
        if ($action === 'update-profile' && $method === 'POST') {
            requireAuth();
            try {
                $result = $utilisateurDAO->mettreAJour(
                    $_SESSION['user_id'],
                    $data
                );
                echo json_encode([
                    'success' => $result
                ]);
            } catch (Exception $e) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => $e->getMessage()
                ]);
            }
            exit;
        }

        // UPDATE ME
        if ($action === 'me' && $method === 'PUT') {
            requireAuth();
            $user = $utilisateurDAO->trouverParId($_SESSION['user_id']);

            if (!$user) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Utilisateur introuvable'
                ]);
                exit;
            }

            $data['email'] = $user->getEmail();

            try {
                $result = $authServices->modifierProfil(
                    $_SESSION['user_id'],
                    $data
                );
                echo json_encode([
                    'success' => $result
                ]);
            } catch (Exception $e) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => $e->getMessage()
                ]);
            }
            exit;
        }

        // CHANGE PASSWORD
        if ($action === 'change-password' && $method === 'POST') {
            requireAuth();
            try {
                if (method_exists($authServices, 'modifierMotdepass')) {
                    $authServices->modifierMotdepass(
                        $_SESSION['user_id'],
                        $data['old_password'],
                        $data['new_password']
                    );
                } else {
                    $utilisateurDAO->changerMotDePasse(
                        $_SESSION['user_id'],
                        password_hash(
                            $data['new_password'],
                            PASSWORD_BCRYPT
                        )
                    );
                }

                echo json_encode([
                    'success' => true,
                    'message' => 'Mot de passe modifié avec succès'
                ]);
            } catch (Exception $e) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => $e->getMessage()
                ]);
            }
            exit;
        }

        // LOGOUT
        if ($action === 'logout' && $method === 'POST') {
            session_destroy();
            echo json_encode([
                'success' => true
            ]);
            exit;
        }
    }

    // ================= TACHES =================
    if ($parts[0] === 'taches') {
        requireAuth();

        // CREATE
        if (($parts[1] ?? '') === 'create' && $method === 'POST') {
            try {
                $result = $tacheServices->creerTache($data, $_SESSION['user_id']);
                $response = [
                    'success' => true,
                    'message' => 'Tâche créée avec succès',
                    'created' => is_array($result) ? ($result['success'] ?? false) : $result,
                ];
                if (is_array($result) && !empty($result['warnings'])) {
                    $response['warnings'] = $result['warnings'];
                }
                echo json_encode($response);
            } catch (Exception $e) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            }
            exit;
        }

        // LIST
        if (($parts[1] ?? '') === 'list' && $method === 'GET') {
            $userId = $_GET['user_id'] ?? ($_SESSION['user_id'] ?? null);

            if (!$userId) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Utilisateur non identifié.']);
                exit;
            }

            $taches = $tacheServices->getTaches($userId);
            echo json_encode(['success' => true, 'taches' => $taches]);
            exit;
        }

        // GET BY ID
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
                    'id_createur' => $tache->getIdCreateur(),
                ]
            ]);
            exit;
        }

        // STATUS
        if ($method === 'PUT' && isset($parts[1], $parts[2]) && $parts[2] === 'status') {
            $result = $tacheServices->modifierStatut((int) $parts[1], $data['status'], $_SESSION['user_id']);
            echo json_encode(['success' => $result]);
            exit;
        }

        // ASSIGN
        if ($method === 'PUT' && isset($parts[1], $parts[2]) && $parts[2] === 'assign') {
            $result = $tacheServices->assignerTache((int) $parts[1], $data['id_responsable'], $_SESSION['user_id']);
            echo json_encode(['success' => $result]);
            exit;
        }

        // DELETE
        if ($method === 'DELETE' && isset($parts[1])) {
            $result = $tacheServices->supprimerTache((int) $parts[1], $_SESSION['user_id']);
            echo json_encode(['success' => $result]);
            exit;
        }

        // UPDATE TASK DETAILS
        if ($method === 'PUT' && isset($parts[1]) && is_numeric($parts[1]) && !isset($parts[2])) {
            $result = $tacheServices->modifierTache((int) $parts[1], $data, $_SESSION['user_id']);
            echo json_encode(['success' => $result]);
            exit;
        }
    }

    // pour les notifications
    if ($parts[0] === 'notifications') {
        requireAuth();
        $userId = $_SESSION['user_id'];

        // GET /notifications?ordre=ASC|DESC  — toutes les notifications
        if ($method === 'GET' && !isset($parts[1])) {
            $ordre = isset($_GET['ordre']) && strtoupper($_GET['ordre']) === 'ASC' ? 'ASC' : 'DESC';
            $notifications = $notificationDAO->obtenirToutesParUtilisateur($userId, $ordre);
            $unreadCount = $notificationDAO->compterNonLues($userId);
            echo json_encode([
                'success' => true,
                'notifications' => $notifications,
                'unread_count' => $unreadCount
            ]);
            exit;
        }

        // GET /notifications/unread-count  — badge uniquement
        if ($method === 'GET' && ($parts[1] ?? '') === 'unread-count') {
            echo json_encode([
                'success' => true,
                'unread_count' => $notificationDAO->compterNonLues($userId)
            ]);
            exit;
        }

        // PATCH /notifications/{id}/read  — marquer une comme lue
        if ($method === 'PATCH' && isset($parts[1]) && is_numeric($parts[1]) && ($parts[2] ?? '') === 'read') {
            $result = $notificationDAO->marquerCommeLue((int) $parts[1], $userId);
            echo json_encode(['success' => $result]);
            exit;
        }

        // PATCH /notifications/read-all  — tout marquer comme lu
        if ($method === 'PATCH' && ($parts[1] ?? '') === 'read-all') {
            $result = $notificationDAO->marquerToutesCommeLues($userId);
            echo json_encode(['success' => $result]);
            exit;
        }

        // DELETE /notifications/{id}  — supprimer une notification
        if ($method === 'DELETE' && isset($parts[1]) && is_numeric($parts[1])) {
            $result = $notificationDAO->supprimer((int) $parts[1], $userId);
            echo json_encode(['success' => $result]);
            exit;
        }
    }

    // ================= DASHBOARD =================
    if ($parts[0] === 'dashboard' && $method === 'GET') {
        requireAuth();

        $user = $utilisateurDAO->trouverParId($_SESSION['user_id']);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable']);
            exit;
        }

        if ($user->getRole() !== 'Administrateur' && $user->getRole() !== 'SuperAdmin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            exit;
        }

        if ($user->getRole() === 'SuperAdmin') {
            $tasks = $tacheDAO->obtenirTous();
            $users = $utilisateurDAO->obtenirTous();
            $userCount = count($users);
        } else {
            $tasks = $tacheDAO->obtenirParAdministrateur($user->getId());
            $responsables = [];
            foreach ($tasks as $task) {
                $rid = $task->getIdResponsable();
                if ($rid && $rid !== $user->getId()) {
                    $responsables[$rid] = true;
                }
            }
            $userCount = count($responsables);
        }

        $totalTasks = count($tasks);
        $inProgressTasks = count(array_filter($tasks, function ($task) {
            return $task->getStatus() === 'en cours';
        }));
        $doneTasks = count(array_filter($tasks, function ($task) {
            return $task->getStatus() === 'terminé';
        }));
        $completionPercent = $totalTasks > 0 ? round(($doneTasks / $totalTasks) * 100) : 0;

        $today = date('Y-m-d');
        $createdToday = count(array_filter($tasks, function ($task) use ($today) {
            return substr($task->getDateCreation(), 0, 10) === $today;
        }));
        $completedToday = count(array_filter($tasks, function ($task) use ($today) {
            return $task->getStatus() === 'terminé' && $task->getDateFinReelle() && substr($task->getDateFinReelle(), 0, 10) === $today;
        }));

        $teamPerformance = [];
        $statsByResponsable = [];
        foreach ($tasks as $task) {
            $responsableId = $task->getIdResponsable();
            if (!$responsableId) {
                continue;
            }
            if (!isset($statsByResponsable[$responsableId])) {
                $statsByResponsable[$responsableId] = 0;
            }
            $statsByResponsable[$responsableId]++;
        }

        if (!empty($statsByResponsable)) {
            $utilisateurs = $utilisateurDAO->obtenirTous();
            $utilisateurMap = [];
            foreach ($utilisateurs as $utilisateurItem) {
                $utilisateurMap[$utilisateurItem->getId()] = $utilisateurItem->getNom() . ' ' . $utilisateurItem->getPrenom();
            }

            arsort($statsByResponsable);
            foreach ($statsByResponsable as $responsableId => $count) {
                if (count($teamPerformance) >= 3) {
                    break;
                }
                $teamPerformance[] = [
                    'name' => $utilisateurMap[$responsableId] ?? 'Utilisateur #' . $responsableId,
                    'raw_count' => $count,
                    'progress' => $count  // temporaire, normalisé juste après
                ];
            }

            if (!empty($teamPerformance)) {
                $maxCount = max(array_column($teamPerformance, 'raw_count'));
                foreach ($teamPerformance as &$member) {
                    $member['progress'] = $maxCount > 0
                        ? round(($member['raw_count'] / $maxCount) * 100)
                        : 0;
                    unset($member['raw_count']);
                }
                unset($member);
            }
        }

        if (empty($teamPerformance)) {
            $teamPerformance = [
                ['name' => 'Aucun employé', 'progress' => 0],
                ['name' => '--//--', 'progress' => 0],
                ['name' => '--//--', 'progress' => 0],
            ];
        }

        $dashboard = [
            'user' => [
                'id' => $user->getId(),
                'nom' => $user->getNom(),
                'prenom' => $user->getPrenom(),
                'role' => $user->getRole()
            ],
            'stats' => [
                'totalTasks' => $totalTasks,
                'inProgressTasks' => $inProgressTasks,
                'doneTasks' => $doneTasks,
                'usersActive' => $userCount,
                'completionPercent' => $completionPercent
            ],
            'overview' => [
                'message' => $user->getRole() === 'SuperAdmin'
                    ? 'Accès total aux données du système'
                    : 'Statistiques centrées sur vos tâches créées',
                'activity' => [
                    "✔ {$createdToday} nouvelles tâches créées aujourd'hui",
                    "✔ {$completedToday} tâches terminées aujourd'hui",
                    "✔ {$userCount} utilisateurs concernés"
                ]
            ],
            'teamPerformance' => $teamPerformance
        ];

        echo json_encode(['success' => true, 'dashboard' => $dashboard]);
        exit;
    }

    // ================= USERS (pour les administrateurs) =================
    if ($parts[0] === 'users' && $method === 'GET') {
        requireAuth();

        $user = $utilisateurDAO->trouverParId($_SESSION['user_id']);
        if (!$user || ($user->getRole() !== 'Administrateur' && $user->getRole() !== 'SuperAdmin')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            exit;
        }

        // APRÈS
        $mapUser = function ($u) {
            return [
                'id' => $u['id'],
                'nom' => $u['nom'],
                'prenom' => $u['prenom'],
                'email' => $u['email'],
                'role' => $u['role'],
                'poste' => $u['poste'],
                'disponibilite' => $u['disponibilite'] ?? 'oui',
                'total_taches' => (int) $u['total_taches']
            ];
        };

        if ($user->getRole() === 'SuperAdmin') {
            // SuperAdmin voit tout sauf lui-même (les autres SuperAdmin exclus)
            $users = $utilisateurDAO->obtenirTousAvecTaches();
            $users = array_map($mapUser, $users);
            $users = array_filter($users, fn($u) => $u['role'] !== 'SuperAdmin');

        } else {
            // Admin voit uniquement les Employés
            // (obtenirUtilisateursAvecTachesParAdmin filtre déjà sur role = 'Employe')
            $users = $utilisateurDAO->obtenirUtilisateursAvecTachesParAdmin($user->getId());
            $users = array_map($mapUser, $users);
        }

        echo json_encode([
            'success' => true,
            'users' => array_values($users)
        ]);
        exit;
    }

    // ================= DASHBOARD STATS PAR RÔLE =================
    if ($parts[0] === 'dashboard') {
        requireAuth();

        if (($parts[1] ?? '') === 'stats' && $method === 'GET') {
            $userId = $_SESSION['user_id'];
            $userRole = $_SESSION['user_role'];
            $user = $utilisateurDAO->trouverParId($userId);

            $stats = [];
            $allTaches = $tacheDAO->obtenirTous();

            if ($userRole === 'SuperAdmin' || $userRole === 'Administrateur') {
                $stats = [
                    'totalTaches' => count($allTaches),
                    'tachesEnCours' => count(array_filter($allTaches, fn($t) => isset($t['status']) && $t['status'] === 'en cours')),
                    'tachesTerminees' => count(array_filter($allTaches, fn($t) => isset($t['status']) && $t['status'] === 'terminé')),
                    'tachesNonAssignees' => count(array_filter($allTaches, fn($t) => isset($t['status']) && $t['status'] === 'non assigné')),
                    'tachesAssignees' => count(array_filter($allTaches, fn($t) => isset($t['status']) && $t['status'] === 'assigné')),
                    'utilisateurActif' => $user->getNom() . ' ' . $user->getPrenom(),
                    'role' => $userRole
                ];

                $allUsers = $utilisateurDAO->obtenirTous();
                $stats['totalUtilisateurs'] = count($allUsers);

                $stats['adminCount'] = count(array_filter($allUsers, function ($u) {
                    if (is_object($u))
                        return method_exists($u, 'getRole') && $u->getRole() === 'Administrateur';
                    return isset($u['role']) && $u['role'] === 'Administrateur';
                }));

                $stats['employeCount'] = count(array_filter($allUsers, function ($u) {
                    if (is_object($u))
                        return method_exists($u, 'getRole') && $u->getRole() === 'Employe';
                    return isset($u['role']) && $u['role'] === 'Employe';
                }));

            } else if ($userRole === 'Employe') {
                $mesTaches = array_filter($allTaches, fn($t) => isset($t['id_responsable']) && $t['id_responsable'] == $userId);

                $stats = [
                    'totalTaches' => count($mesTaches),
                    'tachesEnCours' => count(array_filter($mesTaches, fn($t) => isset($t['status']) && $t['status'] === 'en cours')),
                    'tachesTerminees' => count(array_filter($mesTaches, fn($t) => isset($t['status']) && $t['status'] === 'terminé')),
                    'tachesAssignees' => count(array_filter($mesTaches, fn($t) => isset($t['status']) && $t['status'] === 'assigné')),
                    'utilisateurActif' => $user->getNom() . ' ' . $user->getPrenom(),
                    'role' => $userRole
                ];
            }

            echo json_encode(['success' => true, 'stats' => $stats]);
            exit;
        }

        // TÂCHES RÉCENTES
        if (($parts[1] ?? '') === 'recent-tasks' && $method === 'GET') {
            $userId = $_SESSION['user_id'];
            $userRole = $_SESSION['user_role'];

            $allTaches = $tacheDAO->obtenirTous();
            $taches = [];

            if ($userRole === 'SuperAdmin' || $userRole === 'Administrateur') {
                $taches = array_slice($allTaches, 0, 5);
            } else if ($userRole === 'Employe') {
                $mesTaches = array_filter($allTaches, fn($t) => isset($t['id_responsable']) && $t['id_responsable'] == $userId);
                $taches = array_slice(array_values($mesTaches), 0, 5);
            }

            echo json_encode(['success' => true, 'taches' => $taches]);
            exit;
        }
    }

    // ================= ADMIN (Gestion utilisateurs) =================
    if ($parts[0] === 'admin') {
        // Optionnel : si seul le SuperAdmin peut modifier, laisse requireSuperAdmin()
        // Si les Administrateurs simples peuvent aussi modifier les employés, utilise requireAuth()
        requireAuth();

        // 1. AJOUT DE LA ROUTE UPDATE (Mise à jour d'un utilisateur)
        if (($parts[1] ?? '') === 'users' && ($parts[2] ?? '') === 'update' && $method === 'POST') {
            try {
                // On vérifie qu'on a bien reçu un ID
                if (!isset($data['id'])) {
                    throw new Exception("L'identifiant de l'utilisateur est manquant.");
                }

                // On appelle la méthode du DAO ou du Service pour mettre à jour la BDD
                // Note : Assure-toi que mettreAJour prend bien ($id, $donnees) ou adapte selon ton UtilisateurDAO
                $result = $utilisateurDAO->mettreAJour((int) $data['id'], $data);

                echo json_encode([
                    'success' => $result,
                    'message' => $result ? 'Utilisateur mis à jour avec succès' : 'Aucune modification apportée'
                ]);
            } catch (Exception $e) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => $e->getMessage()
                ]);
            }
            exit;
        }

        // 2. NOUVELLE ROUTE : DELETE (Suppression d'un utilisateur)
        if (($parts[1] ?? '') === 'users' && ($parts[2] ?? '') === 'delete' && $method === 'POST') {
            try {
                // On vérifie qu'on a bien reçu l'ID à supprimer
                if (!isset($data['id'])) {
                    throw new Exception("L'identifiant de l'utilisateur à supprimer est manquant.");
                }

                // Appelle la méthode de suppression de ton DAO (adapte le nom si nécessaire, ex: supprimer)
                $result = $utilisateurDAO->supprimer((int) $data['id']);

                echo json_encode([
                    'success' => $result,
                    'message' => $result ? 'Utilisateur supprimé avec succès' : 'Impossible de supprimer l\'utilisateur'
                ]);
            } catch (Exception $e) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => $e->getMessage()
                ]);
            }
            exit;
        }

        // 2. ROUTE EXISTANTE : CREATE
        if (($parts[1] ?? '') === 'users' && ($parts[2] ?? '') === 'create') {
            $result = $authServices->creerUtilisateurParAdmin($data, $_SESSION['user_id']);
            echo json_encode(['success' => $result]);
            exit;
        }

        // 3. ROUTE EXISTANTE : GET LIST
        if (($parts[1] ?? '') === 'users' && $method === 'GET') {
            $users = $utilisateurDAO->obtenirTous();

            $formattedUsers = array_map(function ($user) {
                return [
                    'id' => $user->getId(),
                    'nom' => $user->getNom(),
                    'prenom' => $user->getPrenom(),
                    'email' => $user->getEmail(),
                    'role' => $user->getRole(),
                    'poste' => $user->getPoste()
                ];
            }, $users);

            echo json_encode([
                'success' => true,
                'users' => $formattedUsers
            ]);
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