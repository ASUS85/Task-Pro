/**
 * Gère l'affichage des différentes sections du dashboard
 */
function showSection(sectionId) {
    const sections = ['overview', 'myTasks', 'profileSection'];
    
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });

    const target = document.getElementById(sectionId);
    if (target) target.style.display = 'block';
    
    // Mise à jour du titre de la page
    const title = document.getElementById('page-title');
    switch(sectionId) {
        case 'myTasks': title.innerText = "Mes Missions"; break;
        case 'profileSection': title.innerText = "Mon Profil"; break;
        default: title.innerText = "Vue d'ensemble & Stats";
    }
}

/**
 * Ouvre la modale avec les détails de la tâche (Lecture seule)
 */
function openTaskModal(id, title, date, status, desc) {
    document.getElementById('modalID').innerText = "Tâche " + id;
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDate').innerText = date;
    document.getElementById('modalStatus').innerText = status;
    document.getElementById('modalDesc').innerText = desc;
    
    document.getElementById('taskModal').style.display = "block";
}

/**
 * Ferme la modale
 */
function closeModal() {
    document.getElementById('taskModal').style.display = "none";
}

/**
 * Fermeture de la modale en cliquant à l'extérieur
 */
window.onclick = function(event) {
    const modal = document.getElementById('taskModal');
    if (event.target == modal) {
        closeModal();
    }
}