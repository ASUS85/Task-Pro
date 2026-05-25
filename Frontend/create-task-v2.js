/**
 * ============================================================
 * TASKPRO - CREATE TASK (V2.0)
 * Création de tâche avec API intégrée et loaders
 * ============================================================
 */

// État du formulaire
let createTaskState = {
    selectedResponsible: null,
    selectedParentTask: null,
    formData: {}
};

// DOM References
const createTaskForm = document.getElementById('createTaskForm');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescriptionInput = document.getElementById('taskDescription');
const taskPeriodInput = document.getElementById('taskPeriod');
const responsibleSelect = document.getElementById('responsibleSelect');
const parentTaskSelect = document.getElementById('parentTaskSelect');
const submitBtn = document.getElementById('submitCreateTask');
const cancelBtn = document.getElementById('cancelCreateTask');

// ==============================================
// INITIALISATION
// ==============================================
document.addEventListener('DOMContentLoaded', async () => {
    requireAuth();
    
    // Charger les utilisateurs et tâches
    await loadFormData();
    
    // Initialiser event listeners
    initializeEventListeners();
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// ==============================================
// CHARGER DONNÉES FORMULAIRE
// ==============================================
async function loadFormData() {
    try {
        loaderManager.show('Préparation du formulaire');
        
        // Charger les utilisateurs disponibles
        let users = [];
        if (sessionManager.isSuperAdmin()) {
            users = await apiListUsers();
        } else {
            // Pour admin/employé: récupérer les autres employés
            users = await apiListUsers();
        }

        // Charger les tâches parentes
        const tasks = await apiListTasks({ showLoader: false });

        loaderManager.hide();

        // Remplir les selects
        populateResponsibleSelect(users);
        populateParentTaskSelect(tasks);

    } catch (error) {
        loaderManager.hide();
        loaderManager.toast(`Erreur: ${error.message}`, 'error');
        console.error('Erreur chargement données:', error);
    }
}

// ==============================================
// REMPLIR LES SELECTS
// ==============================================
function populateResponsibleSelect(users) {
    if (!responsibleSelect) return;

    responsibleSelect.innerHTML = '<option value="">-- Non assigné --</option>';
    
    if (users && users.length > 0) {
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.nom} ${user.prenom} (${getRoleDisplay(user.role)})`;
            responsibleSelect.appendChild(option);
        });
    }
}

function populateParentTaskSelect(tasks) {
    if (!parentTaskSelect) return;

    parentTaskSelect.innerHTML = '<option value="">-- Aucune tâche parente --</option>';
    
    if (tasks && tasks.length > 0) {
        tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = `${task.libelle} (${getStatusDisplay(task.status).text})`;
            parentTaskSelect.appendChild(option);
        });
    }
}

// ==============================================
// EVENT LISTENERS
// ==============================================
function initializeEventListeners() {
    if (createTaskForm) {
        createTaskForm.addEventListener('submit', handleSubmitCreateTask);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr? Les données seront perdues.')) {
                window.location.href = '/Task-Pro/Frontend/task-list.html';
            }
        });
    }

    if (responsibleSelect) {
        responsibleSelect.addEventListener('change', (e) => {
            createTaskState.selectedResponsible = e.target.value;
        });
    }

    if (parentTaskSelect) {
        parentTaskSelect.addEventListener('change', (e) => {
            createTaskState.selectedParentTask = e.target.value;
        });
    }
}

// ==============================================
// SOUMISSION FORMULAIRE
// ==============================================
async function handleSubmitCreateTask(event) {
    event.preventDefault();

    // Validation
    const title = taskTitleInput?.value?.trim();
    const description = taskDescriptionInput?.value?.trim();
    const period = taskPeriodInput?.value?.trim();

    if (!title) {
        loaderManager.toast('Le titre de la tâche est obligatoire', 'error');
        taskTitleInput?.focus();
        return;
    }

    if (!period) {
        loaderManager.toast('La période de réalisation est obligatoire', 'error');
        taskPeriodInput?.focus();
        return;
    }

    // Préparer les données
    const taskData = {
        libelle: title,
        description: description || '',
        periode_realisation: period,
        id_responsable: createTaskState.selectedResponsible || null,
        id_parent: createTaskState.selectedParentTask || null
    };

    // Créer la tâche
    try {
        loaderManager.show('Création de la tâche');
        
        const result = await apiCreateTask(taskData);
        
        loaderManager.hide();
        loaderManager.toast('Tâche créée avec succès!', 'success');

        // Rediriger après succès
        setTimeout(() => {
            window.location.href = '/Task-Pro/Frontend/task-list.html';
        }, 1500);

    } catch (error) {
        loaderManager.hide();
        loaderManager.toast(`Erreur: ${error.message}`, 'error');
        console.error('Erreur création tâche:', error);
    }
}

// ==============================================
// UTILITAIRES
// ==============================================
function validateTaskForm() {
    // Validation format période (ex: "10h", "2j")
    const period = taskPeriodInput?.value || '';
    const periodRegex = /^\d+[hjdms]$/i;

    if (!periodRegex.test(period)) {
        loaderManager.toast('Format période invalide. Exemples: 10h, 2j, 30m', 'warning');
        return false;
    }

    return true;
}

// CSS pour le formulaire
const style = document.createElement('style');
style.textContent = `
    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #333;
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
        transition: all 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
        outline: none;
        border-color: #D4AF37;
        box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
    }

    .form-group textarea {
        resize: vertical;
        min-height: 120px;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }

    @media (max-width: 768px) {
        .form-row {
            grid-template-columns: 1fr;
        }
    }

    .form-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #eee;
    }

    .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s;
    }

    .btn-primary {
        background: #D4AF37;
        color: white;
    }

    .btn-primary:hover {
        background: #C49A27;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
    }

    .btn-secondary {
        background: #eee;
        color: #333;
    }

    .btn-secondary:hover {
        background: #ddd;
    }

    .form-info {
        background: #f0f4ff;
        border-left: 4px solid #5DADE2;
        padding: 15px;
        border-radius: 6px;
        margin-bottom: 20px;
        font-size: 13px;
        color: #333;
    }

    .form-info strong {
        color: #5DADE2;
    }
`;
document.head.appendChild(style);
