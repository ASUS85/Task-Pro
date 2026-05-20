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

        // 4. La logique de statut initial est gérée par la règle métier suivante :
        // - Si la tâche a une tâche parente -> status initial = 'non assigné'
        // - Sinon -> status initial = 'assigné' et la dateDebutAssignation = now()
        if (!empty($donnees['id_parent'])) {
            $donnees['status'] = 'non assigné';
            $donnees['dateDebutAssignation'] = null;
        } else {
            $donnees['status'] = 'assigné';
            $donnees['dateDebutAssignation'] = date('Y-m-d H:i:s');
        }

        // 6. Ajouter les données de création
        $donnees['id_createur'] = $idCreateur;
        $donnees['dateCreation'] = date('Y-m-d H:i:s');

        // 7. Enregistrement
        return $this->tacheDAO->sauvegarder($donnees);
    }

    /**
     * Synchronise les statuts des tâches en fonction du temps et des dépendances
     */
    private function syncStatuses(array $taches): void
    {
        // Construire un index pour accès rapide
        $map = [];
        foreach ($taches as $t) {
            $map[$t->getId()] = $t;
        }

        $now = time();

        foreach ($taches as $tache) {
            $id = $tache->getId();
            $status = $tache->getStatus();

            // Expiration : si la date limite est dépassée et non terminé
            $deadline = strtotime($tache->getPeriodeRealisation());
            if ($deadline !== false && $now > $deadline && $status !== 'terminé' && $status !== 'expiré') {
                $this->tacheDAO->modifierStatut($id, 'expiré');
                continue;
            }

            // Si la tâche a un parent, appliquer la règle liée au parent
            $parentId = $tache->getIdParent();
            if ($parentId) {
                $parent = $this->tacheDAO->trouverParId($parentId);
                if (!$parent) continue;

                $parentEnd = strtotime($parent->getPeriodeRealisation());
                if ($parentEnd === false) continue;

                // 1 minute avant la fin du parent -> assigner la tâche
                if ($now >= ($parentEnd - 60) && $now < $parentEnd) {
                    if ($status !== 'assigné') {
                        $this->tacheDAO->modifierStatut($id, 'assigné');
                        $this->tacheDAO->modifierDateDebutAssignation($id, date('Y-m-d H:i:s', $parentEnd - 60));
                    }
                }

                // Quand le parent se termine -> mettre en cours
                if ($now >= $parentEnd) {
                    if ($status !== 'en cours') {
                        $this->tacheDAO->modifierStatut($id, 'en cours');
                    }
                }

                continue;
            }

            // Pas de parent : si assigné depuis +1min -> en cours
            if ($status === 'assigné') {
                $dateDebut = $tache->getDateDebutAssignation() ?: $tache->getDateCreation();
                $startTs = strtotime($dateDebut);
                if ($startTs !== false && ($now >= ($startTs + 60))) {
                    $this->tacheDAO->modifierStatut($id, 'en cours');
                }
            }
        }
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
        $statutsValides = ["non assigné", "assigné", "en cours", "non terminé", "terminé", "expiré"];
        if (!in_array($nouveauStatut, $statutsValides)) {
            throw new Exception("Statut invalide. Statuts acceptés : " . implode(", ", $statutsValides));
        }

        // 3. Vérification des permissions
        $utilisateur = $this->utilisateurDAO->trouverParId($idUtilisateur);
        if (!$utilisateur) {
            throw new Exception("Utilisateur introuvable.");
        }

        // Tâche expirée ne peut plus être modifiée
        if ($tache->getStatus() === 'expiré') {
            throw new Exception("Impossible de modifier une tâche expirée.");
        }

        if ($utilisateur->getRole() === "Employe") {
            // Les employés ne peuvent modifier que leurs tâches
            if ($tache->getIdResponsable() !== $idUtilisateur) {
                throw new Exception("Action interdite : vous ne pouvez modifier que vos propres tâches.");
            }

            // Transition de statut autorisée uniquement après assignation
            if ($tache->getStatus() === "assigné") {
                if (!in_array($nouveauStatut, ["en cours", "terminé"])) {
                    throw new Exception("Action interdite : un employé ne peut passer qu'en cours ou terminé depuis assigné.");
                }
            } elseif ($tache->getStatus() === "en cours") {
                if ($nouveauStatut !== "terminé") {
                    throw new Exception("Action interdite : un employé ne peut passer qu'à terminé depuis en cours.");
                }
            } else {
                throw new Exception("Action interdite : le statut ne peut être modifié que lorsque la tâche est assignée ou en cours.");
            }
        } else {
            // Administrateur / SuperAdmin ne peuvent plus modifier le statut dès que la tâche est assignée
            if ($tache->getStatus() !== "non assigné") {
                throw new Exception("La modification de statut est réservée à l'employé une fois la tâche assignée.");
            }
        }

        // 4. Mise à jour du statut
        return $this->tacheDAO->modifierStatut($idTache, $nouveauStatut);
    }

    /**
     * Modifier les détails d'une tâche avant assignation
     */
    public function modifierTache(int $idTache, array $donnees, int $idUtilisateur): bool
    {
        $tache = $this->tacheDAO->trouverParId($idTache);
        if (!$tache) {
            throw new Exception("Tâche introuvable.");
        }

        $utilisateur = $this->utilisateurDAO->trouverParId($idUtilisateur);
        if (!$utilisateur || ($utilisateur->getRole() !== "Administrateur" && $utilisateur->getRole() !== "SuperAdmin")) {
            throw new Exception("Action interdite : seuls les administrateurs peuvent modifier les détails de la tâche.");
        }

        if ($tache->getStatus() !== "non assigné") {
            throw new Exception("La tâche ne peut être modifiée que tant qu'elle n'est pas assignée.");
        }

        if (empty($donnees['libelle']) || empty($donnees['description']) || empty($donnees['periode_realisation'])) {
            throw new Exception("Libellé, description et période de réalisation sont obligatoires pour la modification.");
        }

        return $this->tacheDAO->modifierTache($idTache, [
            'libelle' => $donnees['libelle'],
            'description' => $donnees['description'],
            'periode_realisation' => $donnees['periode_realisation'],
            'id_parent' => $donnees['id_parent'] ?? null
        ]);
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

        // Synchroniser les statuts en fonction du temps / dépendances
        $this->syncStatuses($tachesObjet);

        // Recharger les tâches après éventuelles modifications
        switch ($utilisateur->getRole()) {
            case "SuperAdmin":
            case "Administrateur":
                $tachesObjet = $this->tacheDAO->obtenirTous();
                break;

            case "Employe":
                $tachesObjet = $this->tacheDAO->obtenirParResponsable($idUtilisateur);
                break;
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
            // 2. Mise à jour du statut et date d'assignation
            $this->tacheDAO->modifierStatut($idTache, 'assigné');
            $this->tacheDAO->modifierDateDebutAssignation($idTache, date('Y-m-d H:i:s'));

            // 3. On récupère les infos de la tâche et du responsable
            $tache = $this->tacheDAO->trouverParId($idTache);
            $resp = $this->utilisateurDAO->trouverParId($idResponsable);

            // 4. On déclenche la notification via le service
            $msg = "La tâche '" . $tache->getLibelle() . "' vous a été assignée par l'administrateur.";

            $this->notificationService->notifierUtilisateur(
                $idResponsable,
                $resp->getEmail(),
                $resp->getPrenom(),
                $msg,
                $idTache
            );
        }

        return $result;
    }
}
