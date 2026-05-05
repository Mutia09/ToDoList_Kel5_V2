// ULTRA-SIMPLE ToDoList - PASTI MULAI DARI LOGIN
class ToDoList {
    constructor() {
        this.initPage();
    }

    initPage() {
        // DETECT HALAMAN DENGAN 1 BARIS SAJA
        if (document.getElementById('loginForm')) {
            this.loginPage();
        } else if (document.getElementById('registerForm')) {
            this.registerPage();
        } else {
            // INDEX.HTML - CHECK LOGIN IMMEDIATELY
            this.checkLogin();
        }
    }

    // === LOGIN PAGE ===
    loginPage() {
        document.getElementById('loginForm').onsubmit = (e) => {
            e.preventDefault();
            const user = document.getElementById('loginUsername').value.trim();
            const pass = document.getElementById('loginPassword').value;
            
            if (!user || !pass) {
                alert('Isi username & password!');
                return;
            }
            
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (users[user] === btoa(pass)) {
                localStorage.setItem('currentUser', user);
                alert('Login berhasil! 🎉');
                window.location.href = 'index.html';
            } else {
                alert('Username/password salah!');
                document.getElementById('loginPassword').value = '';
            }
        };
    }

    // === REGISTER PAGE ===
    registerPage() {
        document.getElementById('registerForm').onsubmit = (e) => {
            e.preventDefault();
            const user = document.getElementById('registerUsername').value.trim();
            const pass = document.getElementById('registerPassword').value;
            
            if (!user || pass.length < 4) {
                alert('Username & password (min 4 karakter) wajib!');
                return;
            }
            
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (users[user]) {
                alert('Username sudah terdaftar! Silakan login.');
                return;
            }
            
            users[user] = btoa(pass);
            localStorage.setItem('users', JSON.stringify(users));
            alert('Daftar berhasil! Silakan login.');
            window.location.href = 'login.html';
        };
    }

    // === INDEX.HTML - CHECK LOGIN SEKARANG ===
    checkLogin() {
        const user = localStorage.getItem('currentUser');
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        // JIKA TIDAK LOGIN → LANGSUNG KE LOGIN
        if (!user || !users[user]) {
            localStorage.removeItem('currentUser');
            window.location.replace('login.html');
            return;
        }
        
        // LOGIN OK → INIT APP
        this.initApp(user);
    }

    // === MAIN APP ===
    initApp(user) {
        this.user = user;
        this.tasks = JSON.parse(localStorage.getItem(`tasks_${user}`) || '[]');
        this.filter = 'all'; // Default filter
        
        // Update UI
        document.getElementById('username').textContent = user;
        
        // Event Listeners
        document.getElementById('addTaskForm').onsubmit = this.addTask.bind(this);
        document.getElementById('logoutBtn').onclick = () => {
            if (confirm('Yakin ingin logout?')) {
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            }
        };
        
        // Tabs - FIXED BUG
        document.querySelectorAll('.tab').forEach(tab => {
            tab.onclick = (e) => this.setFilter(tab.dataset.filter);
        });
        
        // Modal
        document.getElementById('closeModal').onclick = this.closeModal.bind(this);
        document.getElementById('editForm').onsubmit = this.saveEdit.bind(this);
        document.getElementById('deleteTaskBtn').onclick = this.deleteCurrentTask.bind(this);
        
        // Close modal on outside click
        document.getElementById('editModal').onclick = (e) => {
            if (e.target.id === 'editModal') this.closeModal();
        };
        
        this.render();
        this.updateStats();
    }

    addTask(e) {
        e.preventDefault();
        const title = document.getElementById('newTask').value.trim();
        if (!title) return;
        
        const task = {
            id: Date.now(),
            title,
            priority: !!document.getElementById('isPriority').checked,
            dueDate: document.getElementById('dueDate').value || '',
            done: false
        };
        
        this.tasks.unshift(task);
        this.saveTasks();
        e.target.reset();
        document.getElementById('isPriority').checked = false;
        document.getElementById('dueDate').value = '';
        this.render();
        this.updateStats();
    }

    setFilter(filter) {
        this.filter = filter;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active'); // FIXED: event.target
        this.render();
    }

    render() {
        const container = document.getElementById('tasksList');
        let filtered = this.getFiltered();
        
        if (!filtered.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h2>Tidak ada tugas</h2>
                    <p>${this.getEmptyMessage()}</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filtered.map(task => `
            <div class="task-card ${task.priority?'priority':''} ${task.done?'done':''}" data-id="${task.id}">
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    ${task.dueDate?`<div class="task-date ${this.isOverdue(task.dueDate)?'overdue':''}">📅 ${this.formatDate(task.dueDate)}</div>`:''}
                </div>
                <div class="task-actions">
                    <button class="action-btn btn-edit" onclick="todo.edit(${task.id})">✏️</button>
                    <button class="action-btn btn-delete" onclick="todo.remove(${task.id})">🗑️</button>
                    <button class="action-btn btn-toggle" onclick="todo.toggle(${task.id})">
                        ${task.done?'↶':'✅'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    getFiltered() {
        let filtered = this.tasks;
        
        if (this.filter === 'done') {
            filtered = filtered.filter(task => task.done);
        } else if (this.filter === 'priority') {
            filtered = filtered.filter(task => !task.done && task.priority);
        } else if (this.filter === 'today') {
            const today = new Date().toISOString().split('T')[0];
            filtered = filtered.filter(task => !task.done && task.dueDate === today);
        } else {
            // 'all' - show all unfinished tasks
            filtered = filtered.filter(task => !task.done);
        }
        
        return filtered;
    }

    getEmptyMessage() {
        switch(this.filter) {
            case 'done': return 'Belum ada tugas yang selesai';
            case 'priority': return 'Belum ada tugas penting';
            case 'today': return 'Belum ada tugas untuk hari ini';
            default: return 'Tambahkan tugas pertama kamu!';
        }
    }

    isOverdue(date) {
        const today = new Date().toISOString().split('T')[0];
        return date && date < today;
    }

    formatDate(date) {
        return date;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    toggle(id) {
        const task = this.tasks.find(t => t.id == id);
        if (task) {
            task.done = !task.done;
            this.saveTasks();
            this.render();
            this.updateStats();
        }
    }

    edit(id) {
        const task = this.tasks.find(t => t.id == id);
        if (!task) return;
        
        document.getElementById('editTitle').value = task.title;
        document.getElementById('editPriority').checked = task.priority;
        document.getElementById('editDueDate').value = task.dueDate || '';
        document.getElementById('editModal').style.display = 'flex';
        window.editTaskId = id;
    }

    saveEdit(e) {
        e.preventDefault();
        const id = window.editTaskId;
        const task = this.tasks.find(t => t.id == id);
        if (!task) return;
        
        task.title = document.getElementById('editTitle').value.trim();
        task.priority = !!document.getElementById('editPriority').checked;
        task.dueDate = document.getElementById('editDueDate').value || '';
        
        if (!task.title) {
            alert('Nama tugas tidak boleh kosong!');
            return;
        }
        
        this.saveTasks();
        this.render();
        this.updateStats();
        this.closeModal();
    }

    remove(id) {
        if (confirm('Hapus tugas ini?')) {
            this.tasks = this.tasks.filter(t => t.id != id);
            this.saveTasks();
            this.render();
            this.updateStats();
        }
    }

    deleteCurrentTask() {
        if (window.editTaskId && confirm('Hapus tugas ini?')) {
            this.remove(window.editTaskId);
            this.closeModal();
        }
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        window.editTaskId = null;
    }

    updateStats() {
        const total = this.tasks.filter(t => !t.done).length;
        const priority = this.tasks.filter(t => !t.done && t.priority).length;
        const done = this.tasks.filter(t => t.done).length;
        
        document.getElementById('totalCount').textContent = total;
        document.getElementById('priorityCount').textContent = priority;
        document.getElementById('doneCount').textContent = done;
    }

    saveTasks() {
        localStorage.setItem(`tasks_${this.user}`, JSON.stringify(this.tasks));
    }
}

// GLOBAL SHORTCUT & INIT
const todo = new ToDoList();