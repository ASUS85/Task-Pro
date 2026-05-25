// Navigation entre les sections
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(sectionId).classList.add('active');
    event.currentTarget.classList.add('active');
    
    const titles = { 'overview': 'Vue d\'ensemble', 'tasks': 'Mes Tâches', 'profile': 'Mon Profil' };
    document.getElementById('section-title').innerText = titles[sectionId];
}

// Ouvrir/Fermer les Popups
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
}

// Détails Tâche
function openTaskModal(id, desc, start, end, status) {
    document.getElementById('modal-task-title').innerText = "Tâche " + id;
    document.getElementById('modal-task-desc').innerText = desc;
    document.getElementById('task-status-select').value = status;
    toggleModal('task-modal');
}

function saveTaskStatus() {
    alert("Statut enregistré !");
    toggleModal('task-modal');
}

// Mise à jour du nom de profil
function updateProfileName() {
    const nameInput = document.getElementById('new-username').value;
    if(nameInput.trim() !== "") {
        // Mise à jour en haut à droite
        document.getElementById('header-username').innerText = nameInput;
        // Mise à jour dans la section profil
        document.getElementById('profile-name-display').innerText = nameInput;
        
        toggleModal('profile-modal');
        alert("Nom modifié avec succès !");
    }
}

// Déconnexion
function logout() {
    if(confirm("Voulez-vous retourner à la page de connexion ?")) {
        window.location.href = "login.html"; // Assure-toi d'avoir un fichier login.html
    }
}

// Fermeture au clic extérieur
window.onclick = function(event) {
    if (event.target.className === 'modal') {
        event.target.style.display = "none";
    }
}