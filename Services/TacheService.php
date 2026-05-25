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

    private function parseDurationToSeconds(string $duration): ?int
    {
        $duration = trim(strtolower($duration));
        if ($duration === '') {
            return null;
        }

        if (preg_match('/^(\d+)\s*j$/', $duration, $matches)) {
            return ((int) $matches[1]) * 86400;
        }

        if (preg_match('/^(\d+)\s*h(?:\s*(\d+)\s*m?)?$/', $duration, $matches)) {
            $hours = (int) $matches[1];
            $minutes = isset($matches[2]) ? (int) $matches[2] : 0;
            return $hours * 3600 + $minutes * 60;
        }

        if (preg_match('/^(\d+)\s*m$/', $duration, $matches)) {
            return ((int) $matches[1]) * 60;
        }

        if (preg_match('/^(\d+):(\d+)(?::(\d+))?$/', $duration, $matches)) {
            $hours = (int) $matches[1];
            $minutes = (int) $matches[2];
            $seconds = isset($matches[3]) ? (int) $matches[3] : 0;
            return $hours * 3600 + $minutes * 60 + $seconds;
        }

        return null;
    }

    private function getDeadlineTimestamp($tache): ?int
    {
        $deadlineRaw = trim($tache->getPeriodeRealisation() ?? '');
        if ($deadlineRaw === '') {
            return null;
        }

        $durationSeconds = $this->parseDurationToSeconds($deadlineRaw);
        $startRaw = $tache->getDateDebutAssignation() ?: $tache->getDateCreation();
        $startTs = $startRaw ? strtotime($startRaw) : false;

        if ($durationSeconds !== null && $startTs !== false) {
            return $startTs + $durationSeconds;
        }

        $absoluteTs = strtotime($deadlineRaw);
        if ($absoluteTs !== false) {
            return $absoluteTs;
        }

        return null;
    }

    private function mettreAJourDisponibiliteUtilisateur(?int $idUtilisateur): void
    {
        if (!$idUtilisateur) {
            return;
        }

        try {
            $this->utilisateurDAO->mettreAJourDisponibilite($idUtilisateur);
        } catch (Exception $e) {
            // Ne pas casser le flux principal si l'update de disponibilité échoue
        }
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

        // 4. Valider le responsable si fourni
        if (!empty($donnees['id_responsable'])) {
            $responsable = $this->utilisateurDAO->trouverParId((int) $donnees['id_responsable']);
            if (!$responsable) {
                throw new Exception("Responsable introuvable.");
            }
            if ($responsable->getRole() === 'SuperAdmin') {
                throw new Exception("Impossible d'assigner une tâche au SuperAdmin.");
            }
            if ($responsable->getDisponibilite() !== 'oui') {
                throw new Exception("L'utilisateur sélectionné n'est pas disponible pour l'affectation.");
            }
        }

        // 5. La logique de statut initial est gérée par la règle métier suivante :
        // - Si la tâche a une tâche parente -> status initial = 'non assigné'
        // - Sinon si un responsable est défini -> status initial = 'assigné' et dateDebutAssignation = now()
        // - Sinon -> status initial = 'non assigné'
        if (!empty($donnees['id_parent'])) {
            $parentTask = $this->tacheDAO->trouverParId((int) $donnees['id_parent']);
            if (!$parentTask) {
                throw new Exception("Tâche parente introuvable.");
            }
            if (!in_array($parentTask->getStatus(), ['assigné', 'en cours'])) {
                throw new Exception("Seules les tâches en statut 'assigné' ou 'en cours' peuvent être parentes.");
            }
            $donnees['status'] = 'non assigné';
            $donnees['dateDebutAssignation'] = null;
        } elseif (!empty($donnees['id_responsable'])) {
            $donnees['status'] = 'assigné';
            $donnees['dateDebutAssignation'] = date('Y-m-d H:i:s');
        } else {
            $donnees['status'] = 'non assigné';
            $donnees['dateDebutAssignation'] = null;
        }

        // 6. Ajouter les données de création
        $donnees['id_createur'] = $idCreateur === 0 ? null : $idCreateur;

        // 7. Enregistrement
        $result = $this->tacheDAO->sauvegarder($donnees);

        if ($result && !empty($donnees['id_responsable'])) {
            $this->mettreAJourDisponibiliteUtilisateur((int) $donnees['id_responsable']);
        }

        return $result;
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

            $deadline = $this->getDeadlineTimestamp($tache);
            if ($deadline !== null && $now >= $deadline && $status !== 'terminé' && $status !== 'expiré') {
                $this->tacheDAO->modifierStatut($id, 'expiré');
                $this->mettreAJourDisponibiliteUtilisateur($tache->getIdResponsable());
                continue;
            }

            // Ne jamais rétrograder une tâche déjà expirée ou terminée.
            if ($status === 'expiré' || $status === 'terminé') {
                continue;
            }

            $parentId = $tache->getIdParent();
            if ($parentId) {
                $parent = $this->tacheDAO->trouverParId($parentId);
                if (!$parent) {
                    continue;
                }

                $parentEnd = $this->getDeadlineTimestamp($parent);
                if ($parentEnd === null) {
                    continue;
                }

                if ($now >= ($parentEnd - 60) && $now < $parentEnd) {
                    if ($status !== 'assigné') {
                        $this->tacheDAO->modifierStatut($id, 'assigné');
                        $this->tacheDAO->modifierDateDebutAssignation($id, date('Y-m-d H:i:s', $parentEnd - 60));
                    }
                }

                if ($now >= $parentEnd) {
                    if ($status !== 'en cours') {
                        $this->tacheDAO->modifierStatut($id, 'en cours');
                        $this->mettreAJourDisponibiliteUtilisateur($tache->getIdResponsable());
                    }
                }

                continue;
            }

            if ($status === 'assigné') {
                $dateDebut = $tache->getDateDebutAssignation() ?: $tache->getDateCreation();
                $startTs = strtotime($dateDebut);
                if ($startTs !== false && ($now >= ($startTs + 60))) {
                    $this->tacheDAO->modifierStatut($id, 'en cours');
                    $this->mettreAJourDisponibiliteUtilisateur($tache->getIdResponsable());
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
        $result = $this->tacheDAO->modifierStatut($idTache, $nouveauStatut);
        if ($result) {
            $this->mettreAJourDisponibiliteUtilisateur($tache->getIdResponsable());
        }

        return $result;
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

        switch ($utilisateur->getRole()) {
            case "SuperAdmin":
            case "Administrateur":
                // Les admins voient toutes les tâches pour les vues de gestion.
                $tachesObjet = $this->tacheDAO->obtenirTous();
                break;

            case "Employe":
                // Les employés ne voient que leurs tâches assignées.
                $tachesObjet = $this->tacheDAO->obtenirParResponsable($idUtilisateur);
                break;

            default:
                throw new Exception("Rôle non reconnu.");
        }

        // Synchroniser les statuts en fonction du temps / dépendances
        $this->syncStatuses($tachesObjet);

        // Recharger les tâches après éventuelles modifications
        if ($utilisateur->getRole() === "SuperAdmin" || $utilisateur->getRole() === "Administrateur") {
            $tachesObjet = $this->tacheDAO->obtenirTous();
        } else {
            $tachesObjet = $this->tacheDAO->obtenirParResponsable($idUtilisateur);
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
        $result = $this->tacheDAO->supprimer($idTache);
        if ($result) {
            $this->mettreAJourDisponibiliteUtilisateur($tache->getIdResponsable());
        }

        return $result;
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
        // 4. Vérifier que le responsable est disponible
        if (method_exists($responsable, 'getDisponibilite') && $responsable->getDisponibilite() !== 'oui') {
            throw new Exception("Impossible d'assigner une tâche à un utilisateur actuellement indisponible.");
        }

        $ancienResponsable = $tache->getIdResponsable();
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

            // 5. Mettre à jour la disponibilité de l'ancien et du nouveau responsable
            $this->mettreAJourDisponibiliteUtilisateur($idResponsable);
            if ($ancienResponsable && $ancienResponsable !== $idResponsable) {
                $this->mettreAJourDisponibiliteUtilisateur($ancienResponsable);
            }
        }

        return $result;
    }
}
