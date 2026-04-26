<?php

class Tache
{
    private $id;
    private $libelle;
    private $description;
    private $status;
    private $status_parent;
    private $periode_realisation;
    private $dateCreation;
    private $condition;
    private $id_responsable; // ID de la Personne à qui la tâche est assignée
    private $id_createur; // ID de la Personne qui a créé la tâche

    public function __construct($id, $libelle, $description, $status, $status_parent, $periode_realisation, $dateCreation, $condition, $id_responsable, $id_createur)
    {
        $this->id = $id;
        $this->libelle = $libelle;
        $this->description = $description;
        $this->status = $status;
        $this->status_parent = $status_parent;
        $this->periode_realisation = $periode_realisation;
        $this->dateCreation = $dateCreation;
        $this->condition = $condition;
        $this->id_responsable = $id_responsable;
        $this->id_createur = $id_createur;
    }

    // Getters et Setters pour chaque propriété

    public function getLibelle()
    {
        return $this->libelle;
    }

    public function getDescription()
    {
        return $this->description;
    }

    public function getStatus()
    {
        return $this->status;
    }

    public function getStatusParent()
    {
        return $this->status_parent;
    }

    public function getPeriodeRealisation()
    {
        return $this->periode_realisation;
    }

    public function getDateCreation()
    {
        return $this->dateCreation;
    }

    public function getCondition()
    {
        return $this->condition;
    }

    public function getIdResponsable()
    {
        return $this->id_responsable;
    }

    public function getIdCreateur()
    {
        return $this->id_createur;
    }

}