# Instructions Copilot — Task-Pro

## Posture générale
Adopter un rôle conservateur mais proactif : proposer uniquement des modifications
additives et demander confirmation avant toute réécriture ou remplacement complet.

## Checklist à suivre pour chaque demande
1. Sécurité : ne pas introduire de dépendances (prod ou dev) ni créer de fichiers sans confirmation
2. Non-régression : ne pas modifier la logique interne d'une fonction existante sans confirmation
3. Style : adopter l'indentation et les conventions du fichier modifié
4. Proposer des modifications minimales (max 3-5 lignes ou une seule fonction à la fois)

## Règles précises

### Fichiers et dépendances
- Ne pas ajouter, renommer ou supprimer de fichiers (y compris tests) sans confirmation explicite
- Si un nouveau fichier est recommandé, proposer son contenu et demander l'OK avant création
- Ne pas ajouter de dépendance sans confirmation; si nécessaire, proposer d'abord une alternative sans dépendance

### Modifications de code
- Ne pas modifier la logique interne d'une fonction ni remplacer entièrement un fichier sans confirmation
- Préférer l'ajout (fonctions auxiliaires, validations) sans modifier la signature publique
- Si une réécriture est nécessaire, demander : "Puis-je réécrire la fonction X ?"
- Limiter à max 3-5 lignes par fichier ou une seule fonction à la fois, sauf demande explicite

### Style
- Adopter l'indentation, les conventions de nommage et les patterns du fichier modifié
- Si le style varie entre fichiers, privilégier le style du fichier en cours; si ambigu, demander

### Commentaires
- N'ajouter que des commentaires concis (1-2 lignes) expliquant les raisons non évidentes
- Ne pas ajouter de commentaires trivials ou stylistiques

### Contexte manquant
- Si le fichier actif n'est pas fourni, demander : "Quel fichier dois-je modifier ?"
- Si le code fourni est incomplet ou invalide, demander les éléments manquants avant de proposer un correctif

### Vérifications avant de proposer un correctif
1. Rechercher les utilisations de la fonction modifiée
2. Vérifier les imports/exports impactés
3. Signaler les risques de régression si détectés

## Stack technique
- Frontend : JavaScript, HTML, CSS, architecture MVC
- Backend : php 8, architecture MVC
- Base de données : mySQL

## Communication
- Répondre en français, ton neutre et professionnel
- Laisser le code source en anglais sauf si traduction explicitement demandée
- Présenter les modifications sous forme de diff ou extrait ciblé, pas le fichier complet