<?php

class TacheService
{
    private $tacheDAO;
    private $utilisateurDAO;
    private $notificationService; // Nouveau

    public function __construct($tacheDAO, $utilisateurDAO, $notificationService)
    {
        $this->tacheDAO = $tacheDAO;
        $this->utilisateurDAO = $utilisateurDAO;
        $this->notificationService = $notificationService;
    }

    /**
     * Créer une tâche - Admin ou SuperAdmin uniquement
     */
    public function creerTache(array $donnees, int $idCreateur): bool
    {
        // 1. Vérification des droits
        $createur = $this->utilisateurDAO->trouverParId($idCreateur);
        if (!$createur || ($createur->getRole() !== "Administrateur" && $createur->getRole() !== "SuperAdmin")) {
            throw new Exception("Action interdite : Seuls les administrateurs peuvent créer des tâches.");
        }

        // 2. Validation des champs obligatoires
        if (empty($donnees['libelle']) || empty($donnees['description']) || empty($donnees['periode_realisation'])) {
            throw new Exception("Libellé, description et période de réalisation sont obligatoires.");
        }

        if (empty($donnees['periode_realisation'])) {
            throw new Exception("La période de réalisation est obligatoire.");
        }

        // 4. Vérifier que le responsable existe (optionnel à la création)
        if (!empty($donnees['id_responsable'])) {
            $responsable = $this->utilisateurDAO->trouverParId($donnees['id_responsable']);
            if (!$responsable) {
                throw new Exception("L'utilisateur sélectionné n'existe pas.");
            }

            // 5. Vérifier que le responsable n'est pas SuperAdmin
            if ($responsable->getRole() === "SuperAdmin") {
                throw new Exception("Impossible d'assigner une tâche au SuperAdmin.");
            }

            // Statut = "assigné" si responsable assigné immédiatement
            $donnees['status'] = 'assigné';
            $donnees['dateDebutAssignation'] = date('Y-m-d H:i:s');
        } else {
            // Statut = "non assigné" si pas de responsable
            $donnees['status'] = 'non assigné';
            $donnees['dateDebutAssignation'] = null;
        }

        // 6. Ajouter les données de création
        $donnees['id_createur'] = $idCreateur;
        $donnees['dateCreation'] = date('Y-m-d H:i:s');

        // 7. Enregistrement
        return $this->tacheDAO->sauvegarder($donnees);
    }

    /**
     * Modifier le statut d'une tâche
     * - Employé peut modifier le statut de ses tâches
     * - Admin/SuperAdmin peuvent modifier n'importe quelle tâche
     */
    public function modifierStatut(int $idTache, string $nouveauStatut, int $idUtilisateur): bool
    {
        // 1. Vérifier que la tâche existe
        $tache = $this->tacheDAO->trouverParId($idTache);
        if (!$tache) {
            throw new Exception("Tâche introuvable.");
        }

        // 2. Validation du statut
        $statutsValides = ["non assigné", "assigné", "en cours", "non terminé", "terminé"];
        if (!in_array($nouveauStatut, $statutsValides)) {
            throw new Exception("Statut invalide. Statuts acceptés : " . implode(", ", $statutsValides));
        }

        // 3. Vérification des permissions
        $utilisateur = $this->utilisateurDAO->trouverParId($idUtilisateur);
        if (!$utilisateur) {
            throw new Exception("Utilisateur introuvable.");
        }

        // Admin/SuperAdmin peuvent modifier n'importe quelle tâche
        if ($utilisateur->getRole() !== "Administrateur" && $utilisateur->getRole() !== "SuperAdmin") {
            // Les employés ne peuvent modifier que leurs tâches
            if ($tache->getIdResponsable() !== $idUtilisateur) {
                throw new Exception("Action interdite : vous ne pouvez modifier que vos propres tâches.");
            }

            // Les employés ne peuvent passer de "assigné" à "en cours" ou à "terminé"
            // Transition automatique "assigné" -> "en cours" se fait via scheduler (T+10min)
            if ($tache->getStatus() === "assigné" && $nouveauStatut === "en cours") {
                throw new Exception("Transition automatique en cours. Attendez 10 minutes.");
            }
        }

        // 4. Mise à jour du statut
        return $this->tacheDAO->modifierStatut($idTache, $nouveauStatut);
    }

    /**
     * Récupérer les tâches selon le rôle
     */
    public function getTaches(int $idUtilisateur): array
    {
        $utilisateur = $this->utilisateurDAO->trouverParId($idUtilisateur);
        if (!$utilisateur) {
            throw new Exception("Utilisateur introuvable.");
        }

        $tachesObjet = [];

        switch ($utilisateur->getRole()) {
            case "SuperAdmin":
            case "Administrateur":
                // Les admins voient toutes les tâches
                $tachesObjet = $this->tacheDAO->obtenirTous();
                break;

            case "Employe":
                // Les employés ne voient que leurs tâches assignées
                $tachesObjet = $this->tacheDAO->obtenirParResponsable($idUtilisateur);
                break;

            default:
                throw new Exception("Rôle non reconnu.");
        }

        // Sérialiser les objets Tache pour l'API
        return array_map(function (Tache $tache) {
            return [
                'id' => $tache->getId(),
                'libelle' => $tache->getLibelle(),
                'description' => $tache->getDescription(),
                'status' => $tache->getStatus(),
                'id_parent' => $tache->getIdParent(),
                'periode_realisation' => $tache->getPeriodeRealisation(),
                'dateCreation' => $tache->getDateCreation(),
                'dateDebutAssignation' => $tache->getDateDebutAssignation(),
                'dateFinReelle' => $tache->getDateFinReelle(),
                'cheminFichier' => $tache->getCheminFichier(),
                'id_responsable' => $tache->getIdResponsable(),
                'id_createur' => $tache->getIdCreateur()
            ];
        }, $tachesObjet);
    }

    /**
     * Supprimer une tâche - Admin ou SuperAdmin uniquement
     */
    public function supprimerTache(int $idTache, int $idUtilisateur): bool
    {
        // 1. Vérifier les droits
        $utilisateur = $this->utilisateurDAO->trouverParId($idUtilisateur);
        if (!$utilisateur || ($utilisateur->getRole() !== "Administrateur" && $utilisateur->getRole() !== "SuperAdmin")) {
            throw new Exception("Action interdite : Seuls les administrateurs peuvent supprimer des tâches.");
        }

        // 2. Vérifier que la tâche existe
        $tache = $this->tacheDAO->trouverParId($idTache);
        if (!$tache) {
            throw new Exception("Tâche introuvable.");
        }

        // 3. Suppression
        return $this->tacheDAO->supprimer($idTache);
    }

    /**
     * Assigner une tâche à un employé
     */
    public function assignerTache(int $idTache, int $idResponsable, int $idUtilisateur): bool
    {

        // 1. Vérifier les droits
        $utilisateur = $this->utilisateurDAO->trouverParId($idUtilisateur);
        if (!$utilisateur || ($utilisateur->getRole() !== "Administrateur" && $utilisateur->getRole() !== "SuperAdmin")) {
            throw new Exception("Action interdite : Seuls les administrateurs peuvent assigner des tâches.");
        }

        // 2. Vérifier que la tâche existe
        $tache = $this->tacheDAO->trouverParId($idTache);
        if (!$tache) {
            throw new Exception("Tâche introuvable.");
        }

        // 3. Vérifier que le responsable existe
        $responsable = $this->utilisateurDAO->trouverParId($idResponsable);
        if (!$responsable) {
            throw new Exception("Utilisateur introuvable.");
        }

        // 4. Vérifier que le responsable n'est pas SuperAdmin
        if ($responsable->getRole() === "SuperAdmin") {
            throw new Exception("Impossible d'assigner une tâche au SuperAdmin.");
        }

        // 1. On modifie le responsable en BDD via le DAO
        $result = $this->tacheDAO->modifierResponsable($idTache, $idResponsable);

        if ($result) {
            // 2. On récupère les infos de la tâche et du responsable
            $tache = $this->tacheDAO->trouverParId($idTache);
            $resp = $this->utilisateurDAO->trouverParId($idResponsable);

            // 3. On déclenche la notification via le nouveau service
            // Ce service va gérer l'email ET l'enregistrement en BDD tout seul
            $msg = "La tâche '" . $tache->getLibelle() . "' vous a été assignée par l'administrateur.";

            $this->notificationService->notifierUtilisateur(
                $idResponsable,
                $resp->getEmail(),
                $resp->getPrenom(),
                $msg,
                $idTache
            );
        }

        // 5. Mise à jour
        return $this->tacheDAO->modifierResponsable($idTache, $idResponsable);
    }
}
