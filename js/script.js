class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        
        this.initializeElements();
        this.bindEvents();
        this.renderTodos();
    }

    initializeElements() {
        this.todoForm = document.getElementById('todoForm');
        this.taskInput = document.getElementById('taskInput');
        this.dateInput = document.getElementById('dateInput');
        this.priorityInput = document.getElementById('priorityInput');
        this.todoList = document.getElementById('todoList');
        this.filterSelect = document.getElementById('filterSelect');
        this.searchInput = document.getElementById('searchInput');
        this.emptyMessage = document.getElementById('emptyMessage');
        this.taskError = document.getElementById('taskError');
        this.dateError = document.getElementById('dateError');
    }

    bindEvents() {
        this.todoForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.filterSelect.addEventListener('change', (e) => this.handleFilter(e));
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
    }

    handleSubmit(e) {
        e.preventDefault();
        
        if (this.validateForm()) {
            const todo = {
                id: Date.now(),
                task: this.taskInput.value.trim(),
                dueDate: this.dateInput.value,
                priority: this.priorityInput.value,
                completed: false,
                createdAt: new Date().toISOString()
            };

            this.addTodo(todo);
            this.resetForm();
        }
    }

    validateForm() {
        let isValid = true;
        this.taskError.textContent = '';
        this.dateError.textContent = '';
        this.taskInput.classList.remove('error');
        const task = this.taskInput.value.trim();
        if (!task) {
            this.taskError.textContent = 'Task is required';
            isValid = false;
        } else if (task.length < 3) {
            this.taskError.textContent = 'Task must be at least 3 characters long';
            isValid = false;
        } else if (task.length > 100) {
            this.taskError.textContent = 'Task must be less than 100 characters';
            isValid = false;
        }

        this.taskInput.classList.toggle('error', !isValid);
        const dueDate = this.dateInput.value;
        if (!dueDate) {
            this.dateError.textContent = 'Due date is required';
            isValid = false;
        } else {
            const selectedDate = new Date(dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                this.dateError.textContent = 'Due date cannot be in the past';
                isValid = false;
            }
        }

        this.dateInput.classList.toggle('error', !isValid);
        this.taskInput.value = this.escapeHtml(task);
        const duplicateTask = this.todos.find(todo => 
            todo.task.toLowerCase() === task.toLowerCase() && !todo.completed
        );
        
        if (duplicateTask) {
            this.taskError.textContent = 'This task already exists';
            isValid = false;
        }

        return isValid;
    }

    addTodo(todo) {
        this.todos.push(todo);
        this.saveTodos();
        this.renderTodos();
        this.showNotification('Task added successfully!', 'success');
    }

    deleteTodo(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.saveTodos();
            this.renderTodos();
            this.showNotification('Task deleted successfully!', 'success');
        }
    }

    toggleComplete(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            
            const message = todo.completed ? 'Task completed!' : 'Task marked as pending';
            this.showNotification(message, 'success');
        }
    }

    editTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            const newTask = prompt('Edit task:', todo.task);
            if (newTask && newTask.trim() && newTask.trim() !== todo.task) {
                if (newTask.trim().length >= 3 && newTask.trim().length <= 100) {
                    todo.task = newTask.trim();
                    this.saveTodos();
                    this.renderTodos();
                    this.showNotification('Task updated successfully!', 'success');
                } else {
                    alert('Task must be between 3 and 100 characters long');
                }
            }
        }
    }

    handleFilter(e) {
        this.currentFilter = e.target.value;
        this.renderTodos();
    }

    handleSearch(e) {
        this.searchTerm = e.target.value.toLowerCase();
        this.renderTodos();
    }

    getFilteredTodos() {
        let filteredTodos = [...this.todos];
        switch (this.currentFilter) {
            case 'completed':
                filteredTodos = filteredTodos.filter(todo => todo.completed);
                break;
            case 'pending':
                filteredTodos = filteredTodos.filter(todo => !todo.completed);
                break;
            case 'high':
            case 'medium':
            case 'low':
                filteredTodos = filteredTodos.filter(todo => todo.priority === this.currentFilter);
                break;
        }
        if (this.searchTerm) {
            filteredTodos = filteredTodos.filter(todo =>
                todo.task.toLowerCase().includes(this.searchTerm)
            );
        }

        filteredTodos.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            // Sort by due date first
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);
            if (dateA !== dateB) {
                return dateA - dateB;
            }
            // Then by priority
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        return filteredTodos;
    }

    renderTodos() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.innerHTML = '';
            this.emptyMessage.style.display = 'block';
            this.emptyMessage.textContent = this.todos.length === 0 
                ? 'No tasks yet. Add one above!' 
                : 'No tasks match your current filter.';
        } else {
            this.emptyMessage.style.display = 'none';
            this.todoList.innerHTML = filteredTodos.map(todo => this.createTodoHTML(todo)).join('');
        }

        this.updateStats();
    }

    createTodoHTML(todo) {
        const dueDate = new Date(todo.dueDate);
        const today = new Date();
        const isOverdue = dueDate < today && !todo.completed;
        const dueDateFormatted = dueDate.toLocaleDateString();

        return `
            <li class="todo-item ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-id="${todo.id}">
                <div class="task-info">
                    <div class="task-text">${this.escapeHtml(todo.task)}</div>
                    <div class="task-meta">
                        <span class="due-date ${isOverdue ? 'overdue-text' : ''}">
                            📅 ${dueDateFormatted} ${isOverdue ? '(Overdue)' : ''}
                        </span>
                        <span class="priority ${todo.priority}">${todo.priority}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-complete" onclick="todoApp.toggleComplete(${todo.id})">
                        ${todo.completed ? '↩️ Undo' : '✅ Complete'}
                    </button>
                    <button class="btn btn-edit" onclick="todoApp.editTodo(${todo.id})">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-delete" onclick="todoApp.deleteTodo(${todo.id})">
                        🗑️ Delete
                    </button>
                </div>
            </li>
        `;
    }

    updateStats() {
        const totalTasks = this.todos.length;
        const completedTasks = this.todos.filter(todo => todo.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        const statsElement = document.getElementById('stats');
        document.title = `My To-Do List (${pendingTasks} pending)`;
    }

    resetForm() {
        this.todoForm.reset();
        this.taskError.textContent = '';
        this.dateError.textContent = '';
        
        this.taskInput.classList.remove('error');
        const today = new Date().toISOString().split('T')[0];
        this.dateInput.value = today;
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.backgroundColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '1000',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease'
        });
        // Set color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Append to body
        document.body.appendChild(notification);

        // Slide in animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    clearCompleted() {
        if (confirm('Are you sure you want to delete all completed tasks?')) {
            this.todos = this.todos.filter(todo => !todo.completed);
            this.saveTodos();
            this.renderTodos();
            this.showNotification('Completed tasks cleared!', 'success');
        }
    }

    markAllComplete() {
        this.todos.forEach(todo => todo.completed = true);
        this.saveTodos();
        this.renderTodos();
        this.showNotification('All tasks marked as complete!', 'success');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
    
    // Set today's date as default in the date input
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateInput').value = today;
});


document.addEventListener('keydown', (e) => {
    // Ctrl + Enter or Cmd + Enter to submit the form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        document.getElementById('todoForm').dispatchEvent(new Event('submit'));
    }
    
    // Escape key to clear search input
    if (e.key === 'Escape') {
        document.getElementById('searchInput').value = '';
        todoApp.handleSearch({ target: { value: '' } });
    }
});