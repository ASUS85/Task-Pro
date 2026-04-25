<?php
/**
 * BACKEND PROXY - TASKMANAGER PRO
 * Gestion sécurisée des tâches et des utilisateurs
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

$tasksFile = "tasks.json";
$usersFile = "users.json";

// Initialisation silencieuse des fichiers
if (!file_exists($tasksFile)) file_put_contents($tasksFile, json_encode([]));
if (!file_exists($usersFile)) file_put_contents($usersFile, json_encode([]));

// Chargement des données
$tasks = json_decode(file_get_contents($tasksFile), true) ?? [];
$users = json_decode(file_get_contents($usersFile), true) ?? [];

// Récupération des données entrantes
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// =======================
// ROUTAGE GET
// =======================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // On retourne les tâches triées par ID décroissant (plus récentes en premier)
    usort($tasks, function($a, $b) { return $b['id'] <=> $a['id']; });
    echo json_encode($tasks);
    exit;
}

// =======================
// ROUTAGE POST
// =======================
$action = $data['action'] ?? null;

switch ($action) {

    case "register":
        // Vérification si l'utilisateur existe déjà
        foreach ($users as $u) {
            if ($u['email'] === $data['email']) {
                echo json_encode(["success" => false, "message" => "Cet email est déjà enregistré 🛡️"]);
                exit;
            }
        }

        // Création utilisateur avec hachage du mot de passe
        $newUser = [
            "id" => uniqid("user_"),
            "nom" => htmlspecialchars($data['nom']),
            "email" => filter_var($data['email'], FILTER_SANITIZE_EMAIL),
            "password" => password_hash($data['password'], PASSWORD_DEFAULT),
            "created_at" => date("Y-m-d H:i:s")
        ];

        $users[] = $newUser;
        file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT));
        echo json_encode(["success" => true, "message" => "Compte créé !"]);
        break;

    case "login":
        foreach ($users as $u) {
            // Vérification email et mot de passe haché
            if ($u['email'] === $data['email'] && password_verify($data['password'], $u['password'])) {
                // On ne renvoie pas le mot de passe au client
                unset($u['password']);
                echo json_encode(["success" => true, "user" => $u]);
                exit;
            }
        }
        echo json_encode(["success" => false, "message" => "Identifiants invalides ❌"]);
        break;

    case "create":
        $newTask = [
            "id" => time(), // ID unique basé sur le timestamp
            "titre" => htmlspecialchars($data['titre']),
            "description" => htmlspecialchars($data['description']),
            "statut" => $data['statut'],
            "date_echeance" => $data['date_echeance'],
            "assignee" => filter_var($data['assignee'], FILTER_SANITIZE_EMAIL),
            "created_at" => date("Y-m-d H:i:s")
        ];

        $tasks[] = $newTask;
        saveData($tasksFile, $tasks);
        echo json_encode(["success" => true]);
        break;

    case "update":
        $updated = false;
        foreach ($tasks as &$t) {
            if ($t['id'] == $data['id']) {
                $t['titre'] = htmlspecialchars($data['titre']);
                $t['description'] = htmlspecialchars($data['description']);
                $t['statut'] = $data['statut'];
                $t['date_echeance'] = $data['date_echeance'];
                $t['assignee'] = filter_var($data['assignee'], FILTER_SANITIZE_EMAIL);
                $updated = true;
                break;
            }
        }
        if ($updated) {
            saveData($tasksFile, $tasks);
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => "Tâche non trouvée"]);
        }
        break;

    case "delete":
        $initialCount = count($tasks);
        $tasks = array_filter($tasks, function($t) use ($data) {
            return $t['id'] != $data['id'];
        });

        if (count($tasks) < $initialCount) {
            saveData($tasksFile, array_values($tasks));
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => "Erreur de suppression"]);
        }
        break;

    default:
        echo json_encode(["success" => false, "message" => "Action inconnue"]);
        break;
}

/**
 * Fonction utilitaire pour sauvegarder proprement
 */
function saveData($file, $data) {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}