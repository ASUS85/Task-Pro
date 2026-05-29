<?php

function renderTaskAssignedEmail($prenom, $tache)
{
    return "
    <div style='font-family:Arial;background:#f6f8fa;padding:20px'>
        <div style='max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:10px'>

            <h2 style='color:#0d6efd'>Nouvelle tâche assignée</h2>

            <p>Bonjour <b>{$prenom}</b>,</p>

            <p>Une nouvelle tâche vous a été assignée :</p>

            <h3>{$tache->getLibelle()}</h3>

            <p>{$tache->getDescription()}</p>

            <hr>

            <p><b>Statut :</b> {$tache->getStatus()}</p>
            <p><b>Échéance :</b> {$tache->getPeriodeRealisation()}</p>

            <br>

            <small style='color:#777'>
                Task-Pro Notification automatique
            </small>

        </div>
    </div>
    ";
}