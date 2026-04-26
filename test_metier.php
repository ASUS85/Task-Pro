<?php

// Fichier : test_metier.php
require_once 'Models/Personne.php';
require_once 'Services/AuthServices.php';

// 1. Simulation du Groupe 3 (Faux DAO)
class MockDAO {
    public function sauvegarder($nom, $prenom, $sexe, $email, $pass, $status, $role) {
        return true; // Simule une sauvegarde réussie
    }
    public function trouverParEmail($email) {
        // Simule un utilisateur trouvé pour le test de connexion
        // On imagine que le Groupe 3 nous renvoie un objet Personne
        return new class("Admin", "Super", "M", "admin@todo.com", password_hash("123", PASSWORD_BCRYPT), "Actif", "SuperAdmin") extends Personne {};
    }
}

// 2. Exécution du test
$dao = new MockDAO();
$auth = new AuthServices($dao);

try {
    echo "Test Connexion... ";
    $user = $auth->connecter("admin@todo.com", "123");
    echo "Réussi ! Bonjour " . $user->getPrenom() . "\n";
    
    echo "Test Erreur Mot de passe... ";
    $auth->connecter("admin@todo.com", "mauvais_pass");
} catch (Exception $e) {
    echo "Erreur capturée avec succès : " . $e->getMessage() . "\n";
}