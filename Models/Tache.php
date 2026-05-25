<?php

class Tache
{
    // Statuts corrects selon les specs
    private const STATUTS_VALIDES = ["non assigné", "assigné", "en cours", "non terminé", "terminé", "expiré"];
    
    private int $id;
    private string $libelle;
    private string $description;
    private string $status;
    private ?int $id_parent; // ID de la tâche parente (dépendance)
    private string $periode_realisation;
    private string $dateCreation;
    private ?string $dateDebutAssignation; // T0 quand assignée
    private ?string $dateFinReelle; // Quand vraiment terminée
    private ?string $cheminFichier; // Chemin du fichier joint
    private ?int $id_responsable; // ID de l'Employé assigné
    private ?int $id_createur; // ID de l'Admin qui a créé

    public function __construct(
        int $id,
        string $libelle,
        string $description,
        string $status,
        ?int $id_parent,
        string $periode_realisation,
        string $dateCreation,
        ?string $dateDebutAssignation,
        ?string $dateFinReelle,
        ?string $cheminFichier,
        ?int $id_responsable,
        ?int $id_createur
    ) {
        if (!in_array($status, self::STATUTS_VALIDES)) {
            throw new InvalidArgumentException("Statut invalide : " . $status);
        }
        
        $this->id = $id;
        $this->libelle = $libelle;
        $this->description = $description;
        $this->status = $status;
        $this->id_parent = $id_parent;
        $this->periode_realisation = $periode_realisation;
        $this->dateCreation = $dateCreation;
        $this->dateDebutAssignation = $dateDebutAssignation;
        $this->dateFinReelle = $dateFinReelle;
        $this->cheminFichier = $cheminFichier;
        $this->id_responsable = $id_responsable;
        $this->id_createur = $id_createur;
    }

    // Getters
    public function getId(): int { return $this->id; }
    public function getLibelle(): string { return $this->libelle; }
    public function getDescription(): string { return $this->description; }
    public function getStatus(): string { return $this->status; }
    public function getIdParent(): ?int { return $this->id_parent; }
    public function getPeriodeRealisation(): string { return $this->periode_realisation; }
    public function getDateCreation(): string { return $this->dateCreation; }
    public function getDateDebutAssignation(): ?string { return $this->dateDebutAssignation; }
    public function getDateFinReelle(): ?string { return $this->dateFinReelle; }
    public function getCheminFichier(): ?string { return $this->cheminFichier; }
    public function getIdResponsable(): ?int { return $this->id_responsable; }
    public function getIdCreateur(): ?int { return $this->id_createur; }

    // Setters
    public function setStatus(string $status): void {
        if (!in_array($status, self::STATUTS_VALIDES)) {
            throw new InvalidArgumentException("Statut invalide : " . $status);
        }
        $this->status = $status;
    }

    public function setLibelle(string $libelle): void { $this->libelle = $libelle; }
    public function setDescription(string $description): void { $this->description = $description; }
    public function setIdResponsable(?int $id_responsable): void { $this->id_responsable = $id_responsable; }
    public function setCheminFichier(?string $chemin): void { $this->cheminFichier = $chemin; }
    public function setDateDebutAssignation(?string $date): void { $this->dateDebutAssignation = $date; }
    public function setDateFinReelle(?string $date): void { $this->dateFinReelle = $date; }
}