<?php

abstract class Personne
{
    protected $id;
    protected $nom;
    protected $prenom;
    protected $sexe;
    protected $email;
    protected $password;
    protected $role;
    


    public function __construct($id, $nom, $prenom, $sexe, $email, $password, $role)
    {
        $this->nom = $nom;
        $this->prenom = $prenom;
        $this->sexe = $sexe;
        $this->email = $email;
        $this->role = $role;
        $this->password = $password;
        $this->id = $id;
    }

    public function getNom()
    {
        return $this->nom;
    }

    public function getPrenom()
    {
        return $this->prenom;
    }

    public function getSexe()
    {
        return $this->sexe;
    }

    public function getEmail()
    {
        return $this->email;
    }

    public function getRole()
    {
        return $this->role;
    }

    public function getPassword()
    {
        return $this->password;
    }

    public function getId()
    {
        return $this->id;
    }

}