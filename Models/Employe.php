<?php

require_once 'Personne.php';

class Employe extends Personne implements JsonSerializable
{
    public function __construct($id, $nom, $prenom, $sexe, $poste, $email, $password)
    {
        parent::__construct($id, $nom, $prenom, $sexe, $email, $poste, $password, "Employe");
    }

    public function jsonSerialize() : mixed
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'sexe' => $this->sexe,
            'email' => $this->email,
            'poste' => $this->poste,
            'role' => $this->role
        ];
    }
}
