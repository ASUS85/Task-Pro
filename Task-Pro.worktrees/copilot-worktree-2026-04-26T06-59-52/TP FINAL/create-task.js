/* ============================================================
   TASKPRO - CREATE TASK JS
   INTERACTIONS + MODALS + LOGIQUE METIER UI
   ============================================================ */

/* =========================
   MOCK DATA (simulation API)
========================= */

const mockTasks = [
    { id: 1, title: "Mettre en place l'authentification", date: "2026-04-20" },
    { id: 2, title: "Créer le dashboard admin", date: "2026-04-22" },
    { id: 3, title: "Design du système de paiement", date: "2026-04-24" }
];

const mockUsers = [
    { id: 1, name: "Jean Claude", role: "developpeur" },
    { id: 2, name: "Marie Louise", role: "designer" },
    { id: 3, name: "Patrick Ngono", role: "manager" }
];

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

    files.forEach(file => {
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

parentBtn.addEventListener("click", () => {
    renderParentTasks(mockTasks);
    openModal(parentModal);
});

function renderParentTasks(tasks) {

    // TRI PAR DATE (plus récent en premier)
    tasks.sort((a, b) => new Date(b.date) - new Date(a.date));

    parentList.innerHTML = "";

    tasks.forEach(task => {
        const div = document.createElement("div");
        div.classList.add("modal-item");
        div.textContent = task.title;

        div.addEventListener("click", () => {
            selectedParentTask = task;
            parentDisplay.value = task.title;
            closeModal(parentModal);

            // LOGIQUE METIER
            document.getElementById("taskStatus").value = "en_attente";
        });

        parentList.appendChild(div);
    });
}

// SEARCH PARENT
searchParent.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();

    const filtered = mockTasks.filter(t =>
        t.title.toLowerCase().includes(value)
    );

    renderParentTasks(filtered);
});

/* =========================
   MODAL USERS
========================= */

userBtn.addEventListener("click", () => {
    renderUsers(mockUsers);
    openModal(userModal);
});

function renderUsers(users) {

    // TRI par rôle (ordre logique)
    const roleOrder = {
        manager: 1,
        developpeur: 2,
        designer: 3
    };

    users.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

    userList.innerHTML = "";

    users.forEach(user => {
        const div = document.createElement("div");
        div.classList.add("modal-item");
        div.textContent = `${user.name} (${user.role})`;

        div.addEventListener("click", () => {
            selectedUser = user;
            userDisplay.value = user.name;
            closeModal(userModal);

            document.getElementById("taskStatus").value = "en_cours";
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

    const filtered = mockUsers.filter(u => {
        const matchName = u.name.toLowerCase().includes(text);
        const matchRole = role ? u.role === role : true;
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
    const duration = document.getElementById("taskDuration").value;

    // VALIDATION MINIMALE
    if (!title) {
        alert("Le libellé est obligatoire");
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

confirmCreateBtn.addEventListener("click", () => {

    const taskData = {
        title: document.getElementById("taskTitle").value,
        description: document.getElementById("taskDescription").value,
        parentTask: selectedParentTask,
        user: selectedUser,
        duration: document.getElementById("taskDuration").value,
        status: document.getElementById("taskStatus").value,
        files: selectedFiles.map(f => f.name)
    };

    console.log("TASK CREATED :", taskData);

    closeModal(confirmModal);

    alert("Tâche créée avec succès !");

    form.reset();
    selectedFiles = [];
    selectedParentTask = null;
    selectedUser = null;
    filePreview.innerHTML = "";
    parentDisplay.value = "";
    userDisplay.value = "";
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

console.log("TaskPRO Create Task JS chargé");
clearParentTaskBtn.addEventListener("click", () => {
    selectedParentTask = null;
    parentDisplay.value = "";
    document.getElementById("taskStatus").value = "non_assignee";
    closeModal(parentModal);
});
clearUserSelectionBtn.addEventListener("click", () => {
    selectedUser = null;
    userDisplay.value = "";
    document.getElementById("taskStatus").value = "non_assignee";
    closeModal(userModal);
});
clearParentTaskBtn.addEventListener("click", () => {
    selectedParentTask = null;
    resetField(parentDisplay);
    document.getElementById("taskStatus").value = "non_assignee";
    closeModal(parentModal);
});
clearUserSelectionBtn.addEventListener("click", () => {
    selectedUser = null;
    resetField(userDisplay);
    document.getElementById("taskStatus").value = "non_assignee";
    closeModal(userModal);
});