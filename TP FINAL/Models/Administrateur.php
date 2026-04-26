<?php

require_once 'Personne.php';

class Administrateur extends Personne
{
    private const ROLES_VALIDES = ["Administrateur", "SuperAdmin"];

    public function __construct(
        int $id, 
        string $nom, 
        string $prenom, 
        string $sexe, 
        string $poste, 
        string $email, 
        string $password, 
        string $role = "Administrateur"
    ) {
        if (!in_array($role, self::ROLES_VALIDES)) {
            throw new InvalidArgumentException("Rôle invalide : " . $role);
        }
        parent::__construct($id, $nom, $prenom, $sexe, $poste, $email, $password, $role);
    }
}