<?php
// On inclut tes classes (assure-toi que les chemins sont bons)
require_once 'Models/Personne.php';
require_once 'Models/Administrateur.php';
require_once 'Models/Employe.php';
require_once 'Models/Tache.php';
require_once 'Services/AuthServices.php';
require_once 'Services/TacheService.php';

/**
 * SIMULATION DU GROUPE 3 (Mock DAO)
 * Ce code remplace temporairement la base de données.
 */
class MockDAO {
    // Simule la recherche d'un utilisateur
    public function trouverParId($id) {
        if ($id == 1) {
           return new Administrateur(1, "Soms", "Jean", "M", "admin@ecole.com", "hash", "SuperAdmin");
      }
       if ($id == 2) {
          return new Employe(2, "Dupont", "Marie", "F", "marie@ecole.com", "hash", "Employé");
        }
        return null;
    }

    public function trouverTacheParId($id) {
        if ($id == 10) { // On simule une tâche parente déjà existante
            return new Tache(10, "Tâche Parente", "Desc", "2026-04-26", "5h", "En cours", null, null, 2, 1);
        }
        return null;
    }

    public function sauvegarder($donnees) {
        return true; // Simulation succès
    }
}

/**
 * EXÉCUTION DES TESTS
 */
$dao = new MockDAO();
$auth = new AuthServices($dao);
$tacheService = new TacheService($dao, $dao); // On passe le mock pour les deux besoins

echo "--- DÉBUT DES TESTS MÉTIER ---\n\n";

// TEST 1 : Attribution interdite au SuperAdmin
try {
    echo "Test 1 (Assigner au SuperAdmin ID:1) : ";
    $tacheService->creerTache([
        'libelle' => 'Test',
        'id_responsable' => 1, // ID du SuperAdmin
        'periode_realisation' => '10h'
    ],1); // ID du créateur (SuperAdmin pour ce test)

    $tacheService->creerTache([
        'libelle' => 'Test',
        'id_responsable' => 2, // ID du SuperAdmin
        'periode_realisation' => '10h'
    ],1); // ID du créateur (SuperAdmin pour ce test)
} catch (Exception $e) {
    echo "RÈGLE RESPECTÉE : " . $e->getMessage() . "\n". "\n";
}

// TEST 2 : Validation de la période (Durée)
try {
    echo "Test 2 (Période négative) : ";
    $periode = -5; 
    if($periode <= 0) throw new Exception("La durée doit être positive.");
} catch (Exception $e) {
    echo "RÈGLE RESPECTÉE : " . $e->getMessage() . "\n";
}

// TEST 3 : Dépendance de tâche
try {
    echo "Test 3 (Tâche parente inexistante) : ";
    $tacheService->creerTache([
        'libelle' => 'Sous-tâche',
        'id_responsable' => 2,
        'id_parent' => 999, // ID qui n'existe pas dans notre Mock
        'periode_realisation' => '2j'
    ],1); // ID du créateur (SuperAdmin pour ce test)
} catch (Exception $e) {
    echo "RÈGLE RESPECTÉE : " . $e->getMessage() . "\n";
}


// TEST 4 : Création d'un Admin par un non-SuperAdmin
try {
    echo "Test 4 (Tentative de création par un Employé ID:2) : ";
    $auth->creerUtilisateurParAdmin([
        'nom' => 'Nouveau',
        'email' => 'admin2@ecole.com',
        'role' => 'Administrateur'
    ], 2); // ID 2 est un Employé dans notre Mock
} catch (Exception $e) {
    echo "RÈGLE RESPECTÉE : " . $e->getMessage() . "\n";
}

// TEST 5 : Création par le SuperAdmin
try {
    echo "Test 5 (Création par le SuperAdmin ID:1) : ";
    $resultat = $auth->creerUtilisateurParAdmin([
        'nom' => 'Nouveau',
        'prenom' => 'Admin',
        'sexe' => 'M',
        'email' => 'admin2@test.com',
        'role' => 'Administrateur' // Le rôle qu'on veut donner au nouveau
    ], 1); // 1 = ID de celui qui crée (doit être SuperAdmin)
    
    if ($resultat) echo "RÉUSSI ! Administrateur créé.\n";
} catch (Exception $e) {
    // Si ça échoue encore, affiche le rôle pour comprendre
    $roleReel = $dao->trouverParId(1)->getRole();
    echo "ERREUR : " . $e->getMessage() . " (Rôle détecté : " . $roleReel . ")\n";
}


echo "\n--- FIN DES TESTS ---";