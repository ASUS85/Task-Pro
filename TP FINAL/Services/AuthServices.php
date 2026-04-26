<?php

class AuthServices{

private $utilisateurDAO;

// injection du DAO(groupe 3 ) par le constructeur
public function __construct($utilisateurDAO){
    $this->utilisateurDAO = $utilisateurDAO;

}

// logique d'inscription
public function inscrire($donnees){
    // verification des champs obligatoires
    if (empty($donnees['email']) || empty($donnees['password'])) {
        # code...
        throw new Exception("L'email et le mot de passe sont obligatoires.");
        
    }

    if ($donnees['password'] !== $donnees['confirm_password']) {
        # code...
        throw new Exception("Les mots de passe ne correspondent pas.");
    }

    //hachage du mot de passe
    $passwordHache = password_hash($donnees['password'], PASSWORD_BCRYPT);

    //  on demamde au groupe 3 si c'est le premier utilisateur 
    $isFirstUser = $this->utilisateurDAO->compterUtilisateurs() === 0;

    $role = $isFirstUser ? 'SuperAdmin' : $donnees['role'];

    // appel du DAO pour enregistrer l'utilisateur
    return $this->utilisateurDAO->sauvegarder(
        $donnees['nom'],
        $donnees['prenom'],
        $donnees['sexe'],
        $donnees['email'],
        $passwordHache,
        $role
    );
}


// logique de connexion
public function connecter($email, $password){

// on demande au groupe 3 de chercher l'utilisateur par son email
    $utilisateur = $this->utilisateurDAO->trouverParEmail($email);

    if (!$utilisateur || !password_verify($password, $utilisateur->getPassword())) {
        throw new Exception("identifiant incorrects.");
        # code...
    }
    // retourne l'objet utilisateur connecté
    return $utilisateur;
}

public function deconnecter(){

if (session_status() == PHP_SESSION_NONE) {
    session_start();
    # code...
}
    // logique de déconnexion (ex: destruction de session)
    session_destroy();
    return true;
}


public function modifierProfil($id, $donnees) {
    //  Validation de base
    if (empty($donnees['email'])) {
        throw new Exception("L'email est obligatoire.");
    }

    //  Gestion du mot de passe
    if (!empty($donnees['password'])) {
        if ($donnees['password'] !== $donnees['confirm_password']) {
            throw new Exception("Les mots de passe de confirmation ne correspondent pas.");
        }
        $donnees['password'] = password_hash($donnees['password'], PASSWORD_BCRYPT);
    } else {
        // Si le mot de passe est vide, on le supprime du tableau pour que le DAO ne l'écrase pas
        unset($donnees['password']);
    }

    //  Appel au Groupe 3
    return $this->utilisateurDAO->mettreAJour($id, $donnees);
}


public function creerUtilisateurParAdmin($donnees, $idExecuteur) {
    // 1. Vérifier qui fait l'action
    $executeur = $this->utilisateurDAO->trouverParId($idExecuteur);
    
    if (!$executeur || $executeur->getRole() !== "SuperAdmin") {
        throw new Exception("Action interdite : Seul le SuperAdmin peut créer des administrateurs."); 
    }

    // 2. Vérification des champs obligatoires 
    if (empty($donnees['email']) || empty($donnees['role'])) {
        throw new Exception("L'email et le rôle sont obligatoires.");
    }

    // Hachage du mot de passe par défaut 
    $passwordParDefaut = password_hash("Password123", PASSWORD_BCRYPT);

    // Appel au DAO  pour sauvegarder le nouvel admin 
    return $this->utilisateurDAO->sauvegarder(
        $donnees['nom'],
        $donnees['prenom'],
        $donnees['sexe'],
        $donnees['email'],
        $passwordParDefaut,
        "Actif",
        $donnees['role'] 
    );
}

}
