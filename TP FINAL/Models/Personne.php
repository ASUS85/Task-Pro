<?php

abstract class Personne
{
    protected $nom;
    protected $prenom;
    protected $sexe;
    protected $email;
    protected $role;
    protected $password;
    protected $status;


    public function __construct($nom, $prenom, $sexe, $email, $password, $status, $role)
    {
        $this->nom = $nom;
        $this->prenom = $prenom;
        $this->sexe = $sexe;
        $this->email = $email;
        $this->role = $role;
        $this->password = $password;
        $this->status = $status;
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

    public function getStatus()
    {
        return $this->status;
    }
}