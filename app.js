// ==================== CLASS TODO APP ====================
class TodoApp {
    constructor() {
        // Estado da aplicação
        this.tasks = [];
        this.currentFilter = 'all';
        this.storageKey = 'todoApp_tasks';

        // Elementos do DOM
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');

        // Estatísticas
        this.statTotal = document.getElementById('statTotal');
        this.statCompleted = document.getElementById('statCompleted');
        this.statProgress = document.getElementById('statProgress');
        this.countAll = document.getElementById('countAll');
        this.countPending = document.getElementById('countPending');
        this.countCompleted = document.getElementById('countCompleted');

        // Inicializar
        this.init();
    }

    // ==================== INICIALIZAÇÃO ====================
    init() {
        this.loadTasks();
        this.attachEventListeners();
        this.render();
    }

    attachEventListeners() {
        // Adicionar tarefa
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filtros
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.closest('.filter-btn').dataset.filter));
        });

        // Ações
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
    }

    // ==================== GERENCIAMENTO DE TAREFAS ====================
    addTask() {
        const text = this.taskInput.value.trim();

        if (!text) {
            this.showNotification('Por favor, digite uma tarefa');
            return;
        }

        if (text.length > 200) {
            this.showNotification('A tarefa é muito longa (máx. 200 caracteres)');
            return;
        }

        const task = {
            id: Date.now(),
            text,
            completed: false,
            createdAt: new Date().toLocaleDateString('pt-BR')
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.taskInput.value = '';
        this.taskInput.focus();
        this.render();
        this.showNotification('✓ Tarefa adicionada com sucesso!');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    deleteTask(id) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index > -1) {
            const taskText = this.tasks[index].text;
            this.tasks.splice(index, 1);
            this.saveTasks();
            this.render();
            this.showNotification('🗑️ Tarefa removida');
        }
    }

    // ==================== FILTROS ====================
    setFilter(filter) {
        this.currentFilter = filter;

        // Atualizar botões
        this.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'pending':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            case 'all':
            default:
                return this.tasks;
        }
    }

    // ==================== RENDERIZAÇÃO ====================
    render() {
        this.renderTasks();
        this.updateStats();
        this.updateCounts();
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            this.tasksList.style.display = 'none';
            this.emptyState.style.display = 'block';
        } else {
            this.tasksList.style.display = 'flex';
            this.emptyState.style.display = 'none';

            this.tasksList.innerHTML = filteredTasks
                .map(task => this.createTaskElement(task))
                .join('');

            // Adicionar event listeners aos elementos dinâmicos
            this.tasksList.querySelectorAll('.task-checkbox').forEach(checkbox => {
                checkbox.addEventListener('click', (e) => {
                    const id = parseInt(e.target.dataset.id);
                    this.toggleTask(id);
                });
            });

            this.tasksList.querySelectorAll('.task-delete').forEach(deleteBtn => {
                deleteBtn.addEventListener('click', (e) => {
                    const id = parseInt(e.target.dataset.id);
                    if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
                        this.deleteTask(id);
                    }
                });
            });
        }
    }

    createTaskElement(task) {
        const isCompleted = task.completed ? 'completed' : '';
        return `
            <div class="task-item ${isCompleted}">
                <div class="task-checkbox${task.completed ? ' checked' : ''}" data-id="${task.id}"></div>
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <button class="task-delete" data-id="${task.id}" title="Deletar tarefa">×</button>
            </div>
        `;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        this.statTotal.textContent = total;
        this.statCompleted.textContent = completed;
        this.statProgress.textContent = progress + '%';

        // Atualizar cor do progresso
        if (progress === 100 && total > 0) {
            this.statProgress.style.color = 'var(--success-color)';
        } else {
            this.statProgress.style.color = 'var(--primary-color)';
        }
    }

    updateCounts() {
        const all = this.tasks.length;
        const pending = this.tasks.filter(t => !t.completed).length;
        const completed = this.tasks.filter(t => t.completed).length;

        this.countAll.textContent = all;
        this.countPending.textContent = pending;
        this.countCompleted.textContent = completed;
    }

    // ==================== AÇÕES ====================
    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;

        if (completedCount === 0) {
            this.showNotification('Não há tarefas completas para limpar');
            return;
        }

        if (confirm(`Tem certeza que deseja remover ${completedCount} tarefa(s) completa(s)?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.render();
            this.showNotification(`✓ ${completedCount} tarefa(s) removida(s)`);
        }
    }

    clearAll() {
        if (this.tasks.length === 0) {
            this.showNotification('Não há tarefas para limpar');
            return;
        }

        if (confirm(`⚠️ Tem certeza que deseja remover TODAS as ${this.tasks.length} tarefas?`)) {
            this.tasks = [];
            this.saveTasks();
            this.currentFilter = 'all';
            this.render();
            this.showNotification('✓ Todas as tarefas foram removidas');
        }
    }

    // ==================== LOCALSTORAGE ====================
    saveTasks() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    }

    loadTasks() {
        const stored = localStorage.getItem(this.storageKey);
        this.tasks = stored ? JSON.parse(stored) : [];
    }

    // ==================== UTILITÁRIOS ====================
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message) {
        // Criar notificação simples com console
        console.log('📢', message);

        // Opcional: criar elemento visual
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-weight: 600;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// ==================== INICIAR APLICAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
