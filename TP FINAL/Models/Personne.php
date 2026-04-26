<?php

abstract class Personne
{
    protected int $id;
    protected string $nom;
    protected string $prenom;
    protected string $sexe;
    protected string $email;
    public string $poste;
    protected string $password;
    protected string $role;

    public function __construct(int $id, string $nom, string $prenom, string $sexe, string $email, string $poste, string $password, string $role)
    {
        $this->id = $id;
        $this->nom = $nom;
        $this->prenom = $prenom;
        $this->sexe = $sexe;
        $this->email = $this->validerEmail($email);
        $this->poste = $poste;
        $this->password = password_hash($password, PASSWORD_BCRYPT); // Hacher le password
        $this->role = $role;
    }

    private function validerEmail(string $email): string
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("Email invalide");
        }
        return $email;
    }

    public function getId(): int
    {
        return $this->id;
    }
    public function getNom(): string
    {
        return $this->nom;
    }
    public function getPrenom(): string
    {
        return $this->prenom;
    }
    public function getSexe(): string
    {
        return $this->sexe;
    }
    public function getEmail(): string
    {
        return $this->email;
    }
    public function getPoste(): string
    {
        return $this->poste;
    }
    public function getPassword(): string
    {
        return $this->password;
    }
    public function getRole(): string
    {
        return $this->role;
    }

    public function setNom(string $nom): void
    {
        $this->nom = $nom;
    }
    public function setEmail(string $email): void
    {
        $this->email = $this->validerEmail($email);
    }
}
