/* ============================================================
   TASKPRO - CREATE TASK JS
   INTERACTIONS + MODALS + LOGIQUE METIER UI
   ============================================================ */

/* =========================
   DONNEES REELLES (depuis API)
========================= */

let realTasks = [];
let realUsers = [];

/* =========================
   ELEMENTS DOM
========================= */

const form = document.getElementById("createTaskForm");

// FILES
const fileInput = document.getElementById("taskFiles");
const attachFileBtn = document.getElementById("attachFileBtn");
const filePreview = document.getElementById("attachedFilesPreview");

// PARENT TASK
const clearParentTaskBtn = document.getElementById("clearParentTask");
const parentModal = document.getElementById("parentTaskModal");
const parentBtn = document.getElementById("selectParentTaskBtn");
const parentList = document.getElementById("parentTaskList");
const parentDisplay = document.getElementById("parentTaskDisplay");
const searchParent = document.getElementById("searchParentTask");

// USER
const clearUserSelectionBtn = document.getElementById("clearUserSelection");
const userModal = document.getElementById("userSelectModal");
const userBtn = document.getElementById("selectUserBtn");
const userList = document.getElementById("userList");
const userDisplay = document.getElementById("assignedUserDisplay");
const searchUser = document.getElementById("searchUser");
const filterRole = document.getElementById("filterRole");

// CONFIRM
const confirmModal = document.getElementById("confirmModal");
const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
const confirmCreateBtn = document.getElementById("confirmCreateBtn");

/* =========================
   ETAT GLOBAL
========================= */

let selectedParentTask = null;
let selectedUser = null;
let selectedFiles = [];

/* =========================
   FILE UPLOAD
========================= */

attachFileBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);

  files.forEach((file) => {
    selectedFiles.push(file);
  });

  renderFiles();
});

function renderFiles() {
  filePreview.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const div = document.createElement("div");
    div.classList.add("file-chip");
    div.innerHTML = `
            📎 ${file.name}
            <span style="cursor:pointer;margin-left:10px;" data-index="${index}">✖</span>
        `;

    div.querySelector("span").addEventListener("click", (e) => {
      const i = e.target.getAttribute("data-index");
      selectedFiles.splice(i, 1);
      renderFiles();
    });

    filePreview.appendChild(div);
  });
}

/* =========================
   MODAL GENERIQUE
========================= */

function openModal(modal) {
  modal.style.display = "flex";
}

function closeModal(modal) {
  modal.style.display = "none";
}

window.addEventListener("click", (e) => {
  if (e.target === parentModal) closeModal(parentModal);
  if (e.target === userModal) closeModal(userModal);
  if (e.target === confirmModal) closeModal(confirmModal);
});

/* =========================
   MODAL TASK PARENT
========================= */

parentBtn.addEventListener("click", async () => {
  try {
    console.log("[MODAL] Ouverture modal tâches parentes...");
    
    if (realTasks.length === 0) {
      console.warn("[MODAL] Aucune tâche en mémoire, rechargement...");
      realTasks = await apiListTasks();
    }
    
    if (realTasks.length === 0) {
      alert("Aucune tâche disponible");
      return;
    }
    
    renderParentTasks(realTasks);
    openModal(parentModal);
  } catch (error) {
    console.error("Erreur chargement tâches:", error);
    alert("Erreur lors du chargement des tâches parentes: " + error.message);
  }
});

function renderParentTasks(tasks) {
  // TRI PAR DATE (plus récent en premier)
  tasks.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));

  parentList.innerHTML = "";

  if (tasks.length === 0) {
    parentList.innerHTML = "<p style='padding:10px; text-align:center;'>Aucune tâche disponible</p>";
    return;
  }

  tasks.forEach((task) => {
    const div = document.createElement("div");
    div.classList.add("modal-item");
    div.textContent = task.libelle || task.title;

    div.addEventListener("click", () => {
      selectedParentTask = task;
      parentDisplay.value = task.libelle || task.title;
      closeModal(parentModal);

      // LOGIQUE METIER - statut devient assigné ou non assigné selon si responsable existe
      document.getElementById("taskStatus").value = "non assigné";
    });

    parentList.appendChild(div);
  });
}

// SEARCH PARENT
searchParent.addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();

  const filtered = realTasks.filter((t) =>
    (t.libelle || t.title).toLowerCase().includes(value),
  );

  renderParentTasks(filtered);
});

/* =========================
   MODAL USERS
========================= */

userBtn.addEventListener("click", async () => {
  try {
    console.log("[MODAL] Ouverture modal utilisateurs...");
    
    if (realUsers.length === 0) {
      console.warn("[MODAL] Aucun utilisateur en mémoire, rechargement...");
      realUsers = await apiListUsers();
    }
    
    if (realUsers.length === 0) {
      alert("Aucun utilisateur disponible pour assignation.\nAssurez-vous d'être connecté en tant qu'Administrateur.");
      return;
    }
    
    renderUsers(realUsers);
    openModal(userModal);
  } catch (error) {
    console.error("Erreur chargement utilisateurs:", error);
    alert("Erreur lors du chargement des utilisateurs: " + error.message);
  }
});

function renderUsers(users) {
  // TRI par poste
  const postOrder = {
    "Administrateur": 1,
    "Employe": 2,
  };

  users.sort((a, b) => {
    const orderA = postOrder[a.role] || postOrder[a.poste] || 99;
    const orderB = postOrder[b.role] || postOrder[b.poste] || 99;
    return orderA - orderB;
  });

  userList.innerHTML = "";

  if (users.length === 0) {
    userList.innerHTML = "<p style='padding:10px; text-align:center;'>Aucun utilisateur disponible</p>";
    return;
  }

  users.forEach((user) => {
    const div = document.createElement("div");
    div.classList.add("modal-item");
    const userName = `${user.prenom} ${user.nom}`;
    const userRole = user.role || user.poste || 'Non spécifié';
    div.textContent = `${userName} (${userRole})`;

    div.addEventListener("click", () => {
      selectedUser = user;
      userDisplay.value = userName;
      closeModal(userModal);

      // LOGIQUE METIER - assigné si on sélectionne un utilisateur
      document.getElementById("taskStatus").value = "assigné";
    });

    userList.appendChild(div);
  });
}

// SEARCH USER
searchUser.addEventListener("input", filterUsers);
filterRole.addEventListener("change", filterUsers);

function filterUsers() {
  const text = searchUser.value.toLowerCase();
  const role = filterRole.value;

  const filtered = realUsers.filter((u) => {
    const fullName = `${u.prenom} ${u.nom}`.toLowerCase();
    const matchName = fullName.includes(text);
    const userRole = u.role || u.poste || '';
    const matchRole = role ? userRole === role : true;
    return matchName && matchRole;
  });

  renderUsers(filtered);
}
function resetField(input) {
  input.value = "";
  input.classList.add("reset-effect");

  setTimeout(() => {
    input.classList.remove("reset-effect");
  }, 300);
}

/* =========================
   VALIDATION FORM
========================= */

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("taskTitle").value.trim();
  const description = document.getElementById("taskDescription").value.trim();
  const duration = document.getElementById("taskDuration").value;

  // VALIDATION MINIMALE
  if (!title) {
    alert("Le libellé est obligatoire");
    return;
  }

  if (!description) {
    alert("La description est obligatoire");
    return;
  }

  if (!duration) {
    alert("La durée ou échéance est obligatoire");
    return;
  }

  // OUVRIR CONFIRMATION
  openModal(confirmModal);
});

/* =========================
   CONFIRMATION CREATION
========================= */

cancelConfirmBtn.addEventListener("click", () => {
  closeModal(confirmModal);
});

confirmCreateBtn.addEventListener("click", async () => {

    try {

        const taskData = {
            libelle: document.getElementById("taskTitle").value.trim(),
            description: document.getElementById("taskDescription").value.trim(),

            id_parent: selectedParentTask ? selectedParentTask.id : null,

            id_responsable: selectedUser ? selectedUser.id : null,

            periode_realisation: document.getElementById("taskDuration").value,

            status: document.getElementById("taskStatus").value,

            cheminFichier: selectedFiles.length
                ? selectedFiles.map(f => f.name).join(', ')
                : null
        };

        const response = await apiCreateTask(taskData);

        if (!response.success) {
            throw new Error(response.message || "Erreur création tâche");
        }

        closeModal(confirmModal);

        alert("Tâche créée avec succès !");

        // Réinitialiser le formulaire
        form.reset();

        selectedFiles = [];
        selectedParentTask = null;
        selectedUser = null;

        filePreview.innerHTML = "";
        parentDisplay.value = "";
        userDisplay.value = "";
        document.getElementById("taskStatus").value = "non assigné";

    } catch (error) {

        console.error(error);

        alert("Erreur: " + error.message);
    }
});

/* =========================
   LOGIQUE DYNAMIQUE STATUT
========================= */

document.getElementById("taskStatus").addEventListener("change", (e) => {
  // exemple extension future logique métier
});

/* =========================
   INIT UI
========================= */

// Initialiser au chargement de la page
async function initializePage() {
  try {
    // Vérifier d'abord que l'utilisateur est authentifié
    const currentUser = getCurrentUserFromStorage();
    console.log("[AUTH] Utilisateur actuel:", currentUser);
    
    if (!currentUser) {
      console.warn("⚠️ PAS D'UTILISATEUR AUTHENTIFIÉ - Redirection vers login");
      alert("Vous devez être connecté pour créer une tâche");
      window.location.href = 'login.html';
      return;
    }
    
    console.log("[INIT] Démarrage du chargement des données pour", currentUser.prenom, currentUser.nom);
    
    // Charger les utilisateurs pour la modal
    console.log("[API] Appel GET /users...");
    const usersResponse = await apiListUsers();
    console.log("[API] Réponse utilisateurs:", usersResponse);
    
    if (Array.isArray(usersResponse)) {
      realUsers = usersResponse;
    } else {
      console.warn("[WARN] apiListUsers() n'a pas retourné un tableau, reçu:", usersResponse);
      realUsers = [];
    }
    
    // Charger les tâches pour les tâches parentes
    console.log("[API] Appel GET /taches/list...");
    const tasksResponse = await apiListTasks();
    console.log("[API] Réponse tâches:", tasksResponse);
    
    if (Array.isArray(tasksResponse)) {
      realTasks = tasksResponse;
    } else {
      console.warn("[WARN] apiListTasks() n'a pas retourné un tableau, reçu:", tasksResponse);
      realTasks = [];
    }
    
    console.log("✅ TaskPRO Create Task JS chargé et données initialisées");
    console.log("📊 Utilisateurs disponibles:", realUsers.length);
    console.log("📊 Tâches disponibles:", realTasks.length);
    
    if (realUsers.length === 0) {
      console.warn("⚠️ AUCUN UTILISATEUR CHARGÉ - Vérifiez les droits (doit être Administrateur)");
    }
    if (realTasks.length === 0) {
      console.warn("⚠️ AUCUNE TÂCHE CHARGÉE - C'est normal si c'est la première fois");
    }
    
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    console.error("Stack:", error.stack);
    alert("⚠️ Erreur de chargement des données:\n" + error.message + "\n\nVérifiez la console pour plus de détails");
  }
}

// Appeler l'initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}

// Boutons de réinitialisation
clearParentTaskBtn.addEventListener("click", () => {
  selectedParentTask = null;
  parentDisplay.value = "";
  document.getElementById("taskStatus").value = "non assigné";
  closeModal(parentModal);
});

clearUserSelectionBtn.addEventListener("click", () => {
  selectedUser = null;
  resetField(userDisplay);
  document.getElementById("taskStatus").value = "non assigné";
  closeModal(userModal);
});
