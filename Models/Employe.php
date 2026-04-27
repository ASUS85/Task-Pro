<?php

require_once 'Personne.php';

class Employe extends Personne
{
    public function __construct($id, $nom, $prenom, $sexe, $poste, $email, $password)
    {
        parent::__construct($id, $nom, $prenom, $sexe, $email, $poste, $password, "Employe");
    }
}
