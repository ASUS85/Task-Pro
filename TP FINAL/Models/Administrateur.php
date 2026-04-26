<?php

require_once 'Personne.php';

class Administrateur extends Personne
{
    public function __construct($id, $nom, $prenom, $sexe, $email, $password, $role= "Administrateur")
    {
        parent::__construct($id,$nom, $prenom, $sexe, $email, $password, $role);
    }
}