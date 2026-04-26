<?php

require_once 'Personne.php';

class Administrateur extends Personne
{
    public function __construct($nom, $prenom, $sexe, $email, $password, $status)
    {
        parent::__construct($nom, $prenom, $sexe, $email, $password, $status,'Administrateur');
    }
}