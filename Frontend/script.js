/**
 * TASKMANAGER PRO - LOGIQUE CLIENT
 * Complémentaire au style Glassmorphism & Animations
 */
// =======================
// INITIALISATION & SESSION
// =======================

let currentTasks =[];
let currentPage = 1;
const tasksPerPage = 3;

document.addEventListener("DOMContentLoaded", () => {
    // Animation d'entrée pour les éléments de la page
    document.body.style.opacity = "0";
    setTimeout(() => {
        document.body.style.transition = "opacity 0.6s ease";
        document.body.style.opacity = "1";
    }, 50);

    // Initialiser lucide icons si disponible
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Vérifier la page et initialiser
    initializePage();
});

function initializePage() {
    const isLoginPage = window.location.pathname.includes("login");
    const isInscriptionPage = window.location.pathname.includes("inscription");
    
    if (isLoginPage) {
        initializeLoginForm();
    } else if (isInscriptionPage) {
        initializeInscriptionForm();
    } else {
        checkUser();
        chargerTaches();
        chargerInfosProfil();
    }
}

function checkUser() {
    const user = getCurrentUserFromStorage();
    const isAuthPage = window.location.pathname.includes("login") || window.location.pathname.includes("inscription");

    if (!user && !isAuthPage) {
        window.location.href = "login.html";
        return;
    }

    const userNameEl = document.getElementById("displayUserName");
    if (userNameEl && user) {
        userNameEl.innerHTML = `👋 <span style="color: var(--primary)">${user.nom} ${user.prenom || ''}</span>`;
    }
}

// =======================
// GESTION DU LOGIN
// =======================
function initializeLoginForm() {
    const loginForm = document.getElementById("loginForm");
    const messageEl = document.getElementById("message");
    
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        
        await handleLogin(email, password, messageEl);
    });
}

async function handleLogin(email, password, messageEl) {
    const messageEl_actual = messageEl || document.getElementById("message");
    
    // 1. On vide le message précédent et on lance le loader
    messageEl_actual.textContent = ""; 
    toggleLoader(true);

    try {
        const result = await apiLogin(email, password);
        
        // 2. Vérification stricte du résultat
        if (result && result.success === true) {
            showMessage("Connexion réussie ! Redirection...", "lightgreen", messageEl_actual);
            
            // Redirection selon le rôle
            const userRole = result.user?.role;
            setTimeout(() => {
                window.location.href = (userRole === 'SuperAdmin') ? "dashboard.html" : "dashbordUser.html";
            }, 1000);
        } else {
            // 3. Affichage du message d'erreur venant de Laravel (ex: "Email incorrect")
            const errorMsg = result?.message || "Identifiants invalides.";
            showMessage(errorMsg, "#ff4d4d", messageEl_actual);
        }
    } catch (error) {
        // 4. Capture des erreurs réseau ou crash serveur
        console.error("Erreur API:", error);
        showMessage("Serveur injoignable ou erreur de saisie.", "#ff4d4d", messageEl_actual);
    } finally {
        toggleLoader(false);
    }
}

// =======================
// GESTION DE L'INSCRIPTION
// =======================
function initializeInscriptionForm() {
    const registerForm = document.getElementById("registerForm");
    const messageEl = document.getElementById("message");
    
    if (!registerForm) return;

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const userData = {
            nom: document.getElementById("nom").value,
            prenom: document.getElementById("prenom").value,
            sexe: document.getElementById("sexe").value,
            poste: document.getElementById("poste").value || "",
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            confirm_password: document.getElementById("confirm_password").value
        };
        
        await handleInscription(userData, messageEl);
    });
}

async function handleInscription(userData, messageEl) {
    const messageEl_actual = messageEl || document.getElementById("message");
    toggleLoader(true);

    try {
        const result = await apiRegister(userData);
        
        if (result.success) {
            showMessage("Compte créé avec succès! Redirection vers connexion...", "lightgreen", messageEl_actual);
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            showMessage(result.message || "Erreur lors de l'inscription", "red", messageEl_actual);
        }
    } catch (error) {
        showMessage(error.message || "Erreur lors de l'inscription", "red", messageEl_actual);
    } finally {
        toggleLoader(false);
    }
}


// =======================
// GESTION DU LOADER (ANIMÉ)
// =======================
function toggleLoader(show) {
    const loader = document.getElementById("loader");
    if (!loader) return;
    
    if (show) {
        loader.classList.remove("hidden");
        loader.style.animation = "fadeIn 0.3s ease forwards";
    } else {
        loader.style.animation = "fadeOut 0.3s ease forwards";
        setTimeout(() => loader.classList.add("hidden"), 300);
    }
}

// =======================
// AFFICHAGE DES MESSAGES
// =======================
function showMessage(message, color, element) {
    const msgEl = element || document.getElementById("message");
    if (!msgEl) return;
    
    msgEl.textContent = message;
    msgEl.style.color = color;
    msgEl.style.animation = "none";
    void msgEl.offsetWidth; // Hack pour relancer l'animation
    msgEl.style.animation = "fadeIn 0.5s ease";
    
    if (!window.location.pathname.includes("login") && !window.location.pathname.includes("inscription")) {
        setTimeout(() => { msgEl.textContent = ""; }, 4000);
    }
}

function notify(txt, color) {
    const msgEl = document.getElementById("message");
    showMessage(txt, color, msgEl);
}

// =======================
// CHARGER & AFFICHER LES TÂCHES
// =======================
async function chargerTaches() {
    const tableBody = document.getElementById("task-table-body");
    if (!tableBody) return;

    toggleLoader(true);
    try {
        const taches = await apiListTasks(); 
        if (Array.isArray(taches)) {
            currentTasks = taches; // On stocke tout
            updateStats(taches);   // Stats sur le total

            const taskSection = document.getElementById("tasks-section");
            if (taskSection && taskSection.style.display ==="none") {
                taskSection.style.display = "block";
            }
            displayPage(1);       // On affiche la première page
        }
    } catch (err) {
        notify("Erreur de chargement", "red");
    } finally {
        toggleLoader(false);
    }
}

function displayPage(page) {
    currentPage = page;
    const startIndex = (page - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const tasksToDisplay = currentTasks.slice(startIndex, endIndex);

    renderTaches(tasksToDisplay); // Affiche uniquement les 3 tâches
    renderPaginationControls();    // Affiche les boutons Suivant/Précédent
}

function renderPaginationControls() {
    let paginationContainer = document.getElementById("pagination-controls");
    
    // Créer le conteneur s'il n'existe pas dans le HTML
    if (!paginationContainer) {
        paginationContainer = document.createElement("div");
        paginationContainer.id = "pagination-controls";
        paginationContainer.style = "display:flex; justify-content:center; gap:10px; margin-top:15px;";
        document.getElementById("tasks-section").appendChild(paginationContainer);
    }

    const totalPages = Math.ceil(currentTasks.length / tasksPerPage);
    
    paginationContainer.innerHTML = `
        <button onclick="displayPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="btn-outline" style="padding:5px";>Précédent</button>
        <span>Page ${currentPage} / ${totalPages}</span>
        <button onclick="displayPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="btn-outline">Suivant</button>
    `;
}

function renderTaches(data) {

    const tableBody = document.getElementById("task-table-body");
    
    if (!tableBody) return;

    // 1. On vide le tableau
    tableBody.innerHTML = "";

    // 2. Vérification si le tableau est vide ou n'est pas un tableau
    if (!data || !Array.isArray(data) || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Aucune tâche ne vous a ete assignée</td></tr>`;
        return;
    }

    // 3. Boucle sur les données reçues
    data.forEach((t, index) => {
        const tr = document.createElement("tr");
        tr.className = "task-row";

        // IMPORTANT : On utilise les noms exacts de ton objet (vu en console)
        const id = t.id;
        const libelle = t.libelle || "Sans titre";
        const description = t.description || "Aucune description";
        const debut = t.dateCreation || "-"; // Ton objet a 'dateCreation'
        const fin = t.periode_realisation || "-"; // Ton objet a 'periode_realisation'
        const status = t.status || "en cours";

        tr.onclick = () => {
            // if (typeof openTaskModal === 'function') {
            //     openTaskModal(id, libelle, debut, fin, status);
            // }
            openTaskModal(t);
        };

        const statusClass = status.toLowerCase().replace(/\s+/g, '-');
        tr.innerHTML = `
            <td>${libelle}</td>
            <td>${description}</td>
            <td>${debut}</td>
            <td>${fin}</td>
            <td><span class="status-badge ${statusClass}" style="margin: 5px 10px; border-radius: 15px;">${status}</span></td>
        `;
        
        tableBody.appendChild(tr);
    });

    // Recréer les icônes si nécessaire
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function updateStats(data) {

    if (!data || !Array.isArray(data)) {
        return;
    }
    //calcul les nombres
    const total = data.length;
    const pending = data.filter(t => 
        t.status?.toLowerCase() === "non terminé" || 
        t.status?.toLowerCase() === "en cours"
    ).length;


    // On filtre selon les ENUM de ta base de données
    const done = data.filter(t => 
        t.status?.toLowerCase() === "terminé" || 
        t.statut?.toLowerCase() === "terminée"
    ).length;

    animateValue("totalTasks", total);
    animateValue("pendingTasks", pending);
    animateValue("doneTasks", done);
}

// Animation fluide des chiffres
function animateValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    let start = parseInt(el.textContent) || 0;
    if (start === value) return;
    
    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(progress * (value - start) + start);
        el.textContent = current;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// =======================
// GESTION DES TÂCHES
// =======================
const taskForm = document.getElementById("taskForm");
if (taskForm) {
    taskForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        toggleLoader(true);

        const id = document.getElementById("taskId")?.value;
        const payload = {
            libelle: document.getElementById("titre")?.value || "",
            description: document.getElementById("description")?.value || "",
            status: document.getElementById("statut")?.value || "non assigné",
            periode_realisation: document.getElementById("date_echeance")?.value || ""
        };

        try {
            let result;
            if (id) {
                // Update
                result = await apiUpdateTaskStatus(id, payload.status);
                notify("Tâche mise à jour ✨", "lightgreen");
            } else {
                // Create
                result = await apiCreateTask(payload);
                notify("Tâche créée avec succès 🚀", "lightgreen");
            }
            
            taskForm.reset();
            if (document.getElementById("taskId")) {
                document.getElementById("taskId").value = "";
            }
            chargerTaches();
        } catch (err) {
            notify("Erreur lors de l'enregistrement: " + err.message, "red");
        } finally {
            toggleLoader(false);
        }
    });
}

function editTask(id, titre, description, statut) {
    if (document.getElementById("taskId")) {
        document.getElementById("taskId").value = id;
    }
    if (document.getElementById("titre")) {
        document.getElementById("titre").value = titre;
    }
    if (document.getElementById("description")) {
        document.getElementById("description").value = description;
    }
    if (document.getElementById("statut")) {
        document.getElementById("statut").value = statut;
    }
    
    const formSection = document.querySelector(".form-section");
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
        formSection.style.borderColor = "var(--primary)";
        setTimeout(() => formSection.style.borderColor = "var(--card-border)", 1000);
    }
}

async function deleteTask(id) {
    if (!confirm("Voulez-vous vraiment supprimer cette tâche ?")) return;

    toggleLoader(true);
    try {
        await apiDeleteTask(id);
        notify("Tâche supprimée", "orange");
        chargerTaches();
    } catch (err) {
        notify("Erreur de suppression: " + err.message, "red");
    } finally {
        toggleLoader(false);
    }
}

// =======================
// DÉCONNEXION
// =======================
async function logout() {
    try {
        await apiLogout();
    } finally {
        window.location.href = "login.html";
    }
}

// =======================
// EVENT LISTENERS DYNAMIQUES
// =======================
document.getElementById("search")?.addEventListener("input", () => {
    // Debounce pour ne pas surcharger le filtrage
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(chargerTaches, 300);
});

document.getElementById("filterStatus")?.addEventListener("change", chargerTaches);

function showSection(sectionId) {
    // 1. Récupération des éléments
    const stats = document.getElementById('stats-section');
    const tasks = document.getElementById('tasks-section');
    const profile = document.getElementById('profile-section');

    // 2. Logique d'affichage
    if (sectionId === 'stats-section') {
        // Mode "Vue d'ensemble" : On montre les Stats ET le Tableau
        if (stats) stats.style.display = 'block';
        if (tasks) tasks.style.display = 'block';
        if (profile) profile.style.display = 'none';
        
        // On rafraîchit les données
        chargerTaches(); 
        chargerInfosProfil();
    } 
    else if (sectionId === 'tasks-section') {
        // Mode "Mes tâches" uniquement : On cache les stats
        if (stats) stats.style.display = 'none';
        if (tasks) tasks.style.display = 'block';
        if (profile) profile.style.display = 'none';
        
        chargerTaches();
        // chargerInfosProfil();
    } 
    else if (sectionId === 'profile-section') {
        // Mode "Profil" : On cache tout le reste
        if (stats) stats.style.display = 'none';
        if (tasks) tasks.style.display = 'none';
        if (profile) profile.style.display = 'block';
    }

    // 3. Gestion visuelle du menu (classe 'active')
    document.querySelectorAll('.side-nav a').forEach(a => a.classList.remove('active'));
    const navMap = {
        'stats-section': 'nav-stats',
        'tasks-section': 'nav-tasks',
        'profile-section': 'nav-profile'
    };
    const activeNav = document.getElementById(navMap[sectionId]);
    if (activeNav) activeNav.classList.add('active');
}


async function chargerInfosProfil() {
    try {
        const res = await apiCall('/auth/me', 'GET');
        if (res.success && res.user) {
            const u = res.user;

            // Mapping des IDs HTML -> Données BD
            const mapping = {
                'displayFirstName': u.prenom,
                'displayLastName': u.nom,
                'displayProfileEmail': u.email,
                'displaySexe': u.sexe,
                'displayRole': u.role, // <-- AJOUTE CET ID DANS TON HTML
                'displayFullName': `${u.prenom} ${u.nom}`
            };

            for (let id in mapping) {
                const el = document.getElementById(id);
                if (el) el.innerText = mapping[id] || 'Non renseigné';
            }
        }
    } catch (error) {
        console.error("Erreur profil :", error);
    }
}

let selectedTaskId = null; // Pour savoir quelle tâche on modifie

function openTaskModal(task) {
    selectedTaskId = task.id;
    
    // Remplir les champs de la modale
    document.getElementById("modalLibelle").textContent = task.libelle;
    document.getElementById("modalDesc").textContent = task.description;
    document.getElementById("modalDates").textContent = `Du ${task.dateCreation || '-'} au ${task.periode_realisation || '-'}`;
    
    // Pré-sélectionner le statut actuel dans le <select>
    const statusSelect = document.getElementById("statusSelect");
    if (statusSelect) {
        statusSelect.value = task.status;
    }

    // Afficher la modale avec une petite animation
    const modal = document.getElementById("taskModal");
    modal.style.display = "block";
}

function closeModal(modalId) {
    // Si on appelle closeModal() sans argument, on ferme par défaut taskModal
    const id = modalId || "taskModal"; 
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = "none";
    }
}

function closeProfileModal() {
    closeModal('profileModal');
}
// Ouvrir la modale de mot de passe
function openPasswordModal() {
    const pwdModal = document.getElementById('passwordModal');
    if (pwdModal) {
        pwdModal.style.display = 'flex';
    } else {
        // Fallback si l'élément n'a pas un conteneur flex dédié
        const fallback = document.getElementById('passwordModal');
        if (fallback) fallback.style.display = 'block';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();

}
// Ouvrir la modale de profil en pré-remplissant les champs
// Ouvrir la modale de profil en pré-remplissant les champs
function openEditProfile() {
    // On vérifie que les éléments source existent avant de lire leur texte
    const fName = document.getElementById('displayFirstName');
    const lName = document.getElementById('displayLastName');
    const email = document.getElementById('displayProfileEmail');
    const sexe = document.getElementById('displaySexe');

    if (fName) document.getElementById('editFirstName').value = fName.innerText;
    if (lName) document.getElementById('editLastName').value = lName.innerText;
    if (email) document.getElementById('editEmail').value = email.innerText;
    if (sexe) document.getElementById('editSexe').value = sexe.innerText;
    
    document.getElementById('editProfileModal').style.display = 'flex';
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}


// Fermer si on clique sur le fond sombre de N'IMPORTE QUELLE modale
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
};



async function saveStatus() {
    const newStatus = document.getElementById("statusSelect").value;
    
    console.log("Tentative de sauvegarde - ID:", selectedTaskId, "Nouveau Statut:", newStatus);
    if (!selectedTaskId){
        notify("Aucune tâche sélectionnée", "red");
        return;
    }

    toggleLoader(true);
    try {
        // On appelle ton service API (assure-toi qu'il existe dans api.js)
        await apiUpdateTaskStatus(selectedTaskId, newStatus);
        
        notify("Statut mis à jour !", "lightgreen");
        closeModal();
        
        // Rafraîchir les données localement sans recharger la page
        chargerTaches(); 
    } catch (err) {
        notify("Erreur lors de la mise à jour", "red");
    } finally {
        toggleLoader(false);
    }
}
// sauvegarder les infos du profil
// Sauvegarder les infos du profil
async function updateProfile() {
    // On récupère les valeurs depuis les nouveaux IDs de la modale
    const userDate = {
        nom: document.getElementById('editLastName').value,
        prenom: document.getElementById('editFirstName').value,
        email: document.getElementById('editEmail').value,
        sexe: document.getElementById('editSexe').value
    };

    toggleLoader(true); // Toujours bien de montrer qu'on travaille
    try {
        const res = await apiUpdateProfile(userDate);
        if (res.success) {
            notify("Profil mis à jour !", "lightgreen");
            
            // Mise à jour du stockage local pour la cohérence
            let user = JSON.parse(localStorage.getItem('user')) || {};
            localStorage.setItem('user', JSON.stringify({...user, ...userDate}));
            
            closeModal('editProfileModal'); // On ferme la modale après succès
            
            setTimeout(() => {
                location.reload(); // Recharge pour rafraîchir l'affichage partout
            }, 800);
        }
    } catch (error) {
        notify("Erreur : " + error.message, "red");
    } finally {
        toggleLoader(false);
    }
}


async function updatePassword() {
    // Vérifie bien que ces IDs existent dans ton HTML (modale sécurité)
    const oldField = document.getElementById('currentPassword');
    const newField = document.getElementById('newPassword');
    const confirmField = document.getElementById('confirmPassword');

    // Sécurité : on vérifie s'ils existent avant de lire .value
    if (!oldField || !newField || !confirmField) {
        console.error("Un des IDs de mot de passe est introuvable dans le HTML !");
        return;
    }

    const data = {
        old_password: oldField.value,
        new_password: newField.value,
        confirm_password: confirmField.value
    };

    if (data.new_password !== data.confirm_password) {
        notify("Les mots de passe ne correspondent pas", "red");
        return;
    }

    try {
        const res = await apiUpdatePassword(data);
        if (res.success) {
            notify("Sécurité mise à jour !", "lightgreen");
            closeModal('passwordModal');
        }
    } catch (error) {
        notify("Erreur : " + error.message, "red");
    }
}