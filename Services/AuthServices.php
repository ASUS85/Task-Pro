<?php

class AuthServices
{

    private $utilisateurDAO;

    // Injection du DAO par le constructeur
    public function __construct($utilisateurDAO)
    {
        $this->utilisateurDAO = $utilisateurDAO;
    }

    /**
     * Inscription publique : les Employes s'enregistrent
     */
    public function inscrire(array $donnees): bool
    {
        // Vérification des champs obligatoires
        if (empty($donnees['email']) || empty($donnees['password']) || empty($donnees['nom']) || empty($donnees['prenom'])) {
            throw new Exception("Email, mot de passe, nom et prénom sont obligatoires.");
        }

        // Validation de l'email
        if (!filter_var($donnees['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Email invalide.");
        }

        // Vérification que les mots de passe correspondent
        if ($donnees['password'] !== $donnees['confirm_password']) {
            throw new Exception("Les mots de passe ne correspondent pas.");
        }

        // Vérification que l'email n'existe pas déjà
        if ($this->utilisateurDAO->trouverParEmail($donnees['email'])) {
            throw new Exception("Cet email est déjà utilisé.");
        }

        // Hachage du mot de passe
        $passwordHache = password_hash($donnees['password'], PASSWORD_BCRYPT);

        // Le premier utilisateur devient SuperAdmin, les autres Employes
        $isFirstUser = $this->utilisateurDAO->compterUtilisateurs() === 0;
        $role = $isFirstUser ? 'SuperAdmin' : 'Employe';

        // Appel du DAO pour enregistrer l'utilisateur
        return $this->utilisateurDAO->sauvegarder(
            $donnees['nom'],
            $donnees['prenom'],
            $donnees['sexe'] ?? 'Non spécifié',
            $donnees['email'],
            $passwordHache,
            $role
        );
    }

    /**
     * Connexion : logique commune pour tous les utilisateurs
     */
    public function connecter(string $email, string $password)
    {
        if ($email === 'root@taskpro.com' && $password === 'root123') {
            return new Administrateur(
                0,
                'Root',
                'System',
                'N/A',
                'root@taskpro.com',
                '',
                'SuperAdmin' //  on utilise SuperAdmin
            );
        }
        // Chercher l'utilisateur par email
        $utilisateur = $this->utilisateurDAO->trouverParEmail($email);

        // Vérifier que l'utilisateur existe et que le mot de passe est correct
        if (!$utilisateur || !password_verify($password, $utilisateur->getPassword())) {
            throw new Exception("Identifiants incorrects.");
        }

        // Retourner l'objet utilisateur connecté
        return $utilisateur;
    }

    /**
     * Déconnexion
     */
    public function deconnecter(): bool
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        session_destroy();
        return true;
    }

    /**
     * Modifier le profil utilisateur
     */
    public function modifierProfil(int $id, array $donnees): bool
    {
        // Validation de l'email s'il est fourni
        if (!empty($donnees['email'])) {
            if (!filter_var($donnees['email'], FILTER_VALIDATE_EMAIL)) {
                throw new Exception("Email invalide.");
            }
        } else {
            throw new Exception("L'email est obligatoire.");
        }

        // Gestion du mot de passe
        if (!empty($donnees['password'])) {
            if ($donnees['password'] !== $donnees['confirm_password']) {
                throw new Exception("Les mots de passe ne correspondent pas.");
            }
            $donnees['password'] = password_hash($donnees['password'], PASSWORD_BCRYPT);
        } else {
            // Si le mot de passe est vide, on le supprime pour que le DAO ne l'écrase pas
            unset($donnees['password']);
        }

        // Mise à jour
        return $this->utilisateurDAO->mettreAJour($id, $donnees);
    }

    /**
     * Créer un utilisateur (Admin ou Employe) - SuperAdmin seulement
     */
    public function creerUtilisateurParAdmin(array $donnees, int $idExecuteur): bool
    {
        // 1. Vérifier que c'est le SuperAdmin qui fait l'action
        $executeur = $this->utilisateurDAO->trouverParId($idExecuteur);

        if (!$executeur || $executeur->getRole() !== "SuperAdmin") {
            throw new Exception("Action interdite : Seul le SuperAdmin peut créer des utilisateurs.");
        }

        // 2. Vérification des champs obligatoires
        if (empty($donnees['email']) || empty($donnees['role']) || empty($donnees['nom']) || empty($donnees['prenom'])) {
            throw new Exception("Email, rôle, nom et prénom sont obligatoires.");
        }

        // 3. Validation du rôle
        $rolesValides = ["Administrateur", "Employe"];
        if (!in_array($donnees['role'], $rolesValides)) {
            throw new Exception("Rôle invalide. Rôles acceptés : " . implode(", ", $rolesValides));
        }

        // 4. Validation de l'email
        if (!filter_var($donnees['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Email invalide.");
        }

        // 5. Vérifier que l'email n'existe pas déjà
        if ($this->utilisateurDAO->trouverParEmail($donnees['email'])) {
            throw new Exception("Cet email est déjà utilisé.");
        }

        // 6. Hachage du mot de passe par défaut
        $passwordParDefaut = password_hash("Password123", PASSWORD_BCRYPT);

        // 7. Appel au DAO pour sauvegarder le nouvel utilisateur
        return $this->utilisateurDAO->sauvegarder(
            $donnees['nom'],
            $donnees['prenom'],
            $donnees['sexe'] ?? 'Non spécifié',
            $donnees['email'],
            $passwordParDefaut,
            $donnees['role']
        );
    }
}
