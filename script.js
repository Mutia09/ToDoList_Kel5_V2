class ToDoList {
    constructor() {
        this.initPage();
    }

    initPage() {
        if (document.getElementById('loginForm')) {
            this.loginPage();
        } else if (document.getElementById('registerForm')) {
            this.registerPage();
        } else {
            this.checkLogin();
        }
    }

    // === LOGIN PAGE (FIXED) ===
    loginPage() {
        const form = document.getElementById('loginForm');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const userInput = document.getElementById('loginUsername').value
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '');

            const pass = document.getElementById('loginPassword').value;

            if (!userInput || !pass) {
                alert('Isi username & password!');
                return;
            }

            const users = JSON.parse(localStorage.getItem('users') || '{}');

            // 🔥 CARI USER AMAN (ANTI ERROR)
            const foundUser = Object.keys(users).find(u =>
                u.trim().toLowerCase().replace(/\s+/g, '') === userInput
            );

            if (!foundUser) {
                alert('User tidak ditemukan!');
                return;
            }

            try {
                const savedPass = atob(users[foundUser]);

                if (savedPass === pass) {
                    localStorage.setItem('currentUser', foundUser);
                    alert('Login berhasil! 🎉');
                    window.location.href = 'index.html';
                } else {
                    alert('Password salah!');
                }

            } catch (err) {
                console.error('Data error:', err);
                alert('Terjadi error pada data user!');
            }

            document.getElementById('loginPassword').value = '';
        });
    }

    // === REGISTER PAGE (FIXED) ===
    registerPage() {
        const form = document.getElementById('registerForm');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const user = document.getElementById('registerUsername').value
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '');

            const pass = document.getElementById('registerPassword').value;

            if (!user || pass.length < 4) {
                alert('Username & password (min 4 karakter) wajib!');
                return;
            }

            let users = {};

            try {
                users = JSON.parse(localStorage.getItem('users')) || {};
            } catch {
                users = {};
            }

            if (users[user]) {
                alert('Username sudah terdaftar!');
                return;
            }

            users[user] = btoa(pass);
            localStorage.setItem('users', JSON.stringify(users));

            console.log('✅ DATA TERSIMPAN:', localStorage.getItem('users'));

            alert('Daftar berhasil! Silakan login.');
            window.location.href = 'login.html';
        });
    }

    // === INDEX ===
    checkLogin() {
        const user = localStorage.getItem('currentUser');
        const users = JSON.parse(localStorage.getItem('users') || '{}');

        if (!user || !users[user]) {
            localStorage.removeItem('currentUser');
            window.location.replace('login.html');
            return;
        }

        this.initApp(user);
    }

    // === MAIN APP ===
    initApp(user) {
        this.user = user;
        this.tasks = JSON.parse(localStorage.getItem(`tasks_${user}`) || '[]');
        this.filter = 'all';

        document.getElementById('username').textContent = user;

        document.getElementById('addTaskForm').onsubmit = this.addTask.bind(this);

        document.getElementById('logoutBtn').onclick = () => {
            if (confirm('Yakin ingin logout?')) {
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            }
        };

        document.querySelectorAll('.tab').forEach(tab => {
            tab.onclick = () => this.setFilter(tab.dataset.filter, tab);
        });

        document.getElementById('closeModal').onclick = this.closeModal.bind(this);
        document.getElementById('editForm').onsubmit = this.saveEdit.bind(this);
        document.getElementById('deleteTaskBtn').onclick = this.deleteCurrentTask.bind(this);

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

    setFilter(filter, el) {
        this.filter = filter;

        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        if (el) el.classList.add('active');

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
            <div class="task-card ${task.priority?'priority':''} ${task.done?'done':''}">
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    ${task.dueDate?`<div class="task-date ${this.isOverdue(task.dueDate)?'overdue':''}">📅 ${task.dueDate}</div>`:''}
                </div>
                <div class="task-actions">
                    <button onclick="todo.edit(${task.id})">✏️</button>
                    <button onclick="todo.remove(${task.id})">🗑️</button>
                    <button onclick="todo.toggle(${task.id})">
                        ${task.done?'↶':'✅'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    getFiltered() {
        if (this.filter === 'done') return this.tasks.filter(t => t.done);
        if (this.filter === 'priority') return this.tasks.filter(t => !t.done && t.priority);

        if (this.filter === 'today') {
            const today = new Date().toISOString().split('T')[0];
            return this.tasks.filter(t => !t.done && t.dueDate === today);
        }

        return this.tasks.filter(t => !t.done);
    }

    getEmptyMessage() {
        if (this.filter === 'done') return 'Belum ada tugas selesai';
        if (this.filter === 'priority') return 'Belum ada tugas penting';
        if (this.filter === 'today') return 'Belum ada tugas hari ini';
        return 'Tambahkan tugas pertama kamu!';
    }

    isOverdue(date) {
        const today = new Date().toISOString().split('T')[0];
        return date && date < today;
    }

    escapeHtml(text) {
        return text.replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m]));
    }

    toggle(id) {
        const task = this.tasks.find(t => t.id == id);
        if (!task) return;

        task.done = !task.done;
        this.saveTasks();
        this.render();
        this.updateStats();
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

        const task = this.tasks.find(t => t.id == window.editTaskId);
        if (!task) return;

        const title = document.getElementById('editTitle').value.trim();
        if (!title) {
            alert('Nama tugas tidak boleh kosong!');
            return;
        }

        task.title = title;
        task.priority = document.getElementById('editPriority').checked;
        task.dueDate = document.getElementById('editDueDate').value || '';

        this.saveTasks();
        this.render();
        this.updateStats();
        this.closeModal();
    }

    remove(id) {
        if (!confirm('Hapus tugas ini?')) return;

        this.tasks = this.tasks.filter(t => t.id != id);
        this.saveTasks();
        this.render();
        this.updateStats();
    }

    deleteCurrentTask() {
        if (window.editTaskId) {
            this.remove(window.editTaskId);
            this.closeModal();
        }
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        window.editTaskId = null;
    }

    updateStats() {
        document.getElementById('totalCount').textContent = this.tasks.filter(t => !t.done).length;
        document.getElementById('priorityCount').textContent = this.tasks.filter(t => !t.done && t.priority).length;
        document.getElementById('doneCount').textContent = this.tasks.filter(t => t.done).length;
    }

    saveTasks() {
        localStorage.setItem(`tasks_${this.user}`, JSON.stringify(this.tasks));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.todo = new ToDoList();
});