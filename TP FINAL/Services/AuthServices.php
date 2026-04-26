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

    // appel du DAO pour enregistrer l'utilisateur
    return $this->utilisateurDAO->sauvegarder(
        $donnees['nom'],
        $donnees['prenom'],
        $donnees['sexe'],
        $donnees['email'],
        $passwordHache,
        $donnees['status'],
        $donnees['role']
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
}
}
