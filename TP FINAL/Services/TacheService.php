<?php

class TacheService {
    private $tacheDAO;
    private $utilisateurDAO;

    public function __construct($tacheDAO, $utilisateurDAO) {
        $this->tacheDAO = $tacheDAO;
        $this->utilisateurDAO = $utilisateurDAO;
    }

    public function creerTache($donnees, $idCreateur) {

        //  VERIFICATION DES DROITS (Règle métier)
        $createur = $this->utilisateurDAO->trouverParId($idCreateur);
        if (!$createur || ($createur->getRole() !== "Administrateur" && $createur->getRole() !== "SuperAdmin")) {
          throw new Exception("Action interdite : Seuls les administrateurs peuvent créer des tâches.");
        }

        //  validation de la periode de réalisation (doit être une date future)
        if(empty($donnees['periode_realisation'])){
            throw new Exception("La période de réalisation est obligatoire."); 
        }

        $periode = $donnees['periode_realisation'];
        if (!preg_match('/^[0-9]+[hj]$/', $periode)) {
            throw new Exception("Format de période invalide (ex: '10h' ou '2j').");
        }


        // Vérifier si le responsable choisi existe
        $responsable = $this->utilisateurDAO->trouverParId($donnees['id_responsable']);
        if (!$responsable) {
            throw new Exception("L'utilisateur sélectionné n'existe pas."); 
        }

        //  Interdire d'assigner au SuperAdmin (comme convenu)
        if ($responsable->getRole() === "SuperAdmin") {
            throw new Exception("Impossible d'assigner une tâche au SuperAdmin."); 
        }

        // Gestion de la dépendance (Tâche parente)
        $idParent = $donnees['id_parent'] ?? null;
        if ($idParent) {
            $tacheParente = $this->tacheDAO->trouverParId($idParent);
            if (!$tacheParente) {
                throw new Exception("La tâche parente spécifiée n'existe pas."); 
            }
        }

        // Appel au DAO pour l'enregistrement
        return $this->tacheDAO->sauvegarder($donnees);
    }

    public function terminerTache($idTache) {
        $tache = $this->tacheDAO->trouverParId($idTache);
        
        // Si elle a une parente, vérifier si la parente est terminée
        if ($tache->getIdParent()) {
            $parente = $this->tacheDAO->trouverParId($tache->getIdParent());
            if ($parente->getStatus() !== 'Terminée') {
                throw new Exception("Impossible de terminer : la tâche parente est encore en cours."); 
            }
        }

        return $this->tacheDAO->modifierStatut($idTache, 'Terminée'); 
    }
}