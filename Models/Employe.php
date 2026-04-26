<?php

require_once 'Personne.php';

class Employe extends Personne
{
    public function __construct($id, $nom, $prenom, $sexe, $email , $poste, $password)
    {
        parent::__construct($id, $nom, $prenom, $sexe, $email, $poste, $password, "Employe");
    }
}
