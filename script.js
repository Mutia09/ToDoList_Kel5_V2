class ToDoList {
    constructor() {
        this.initPage();
    }

    normalize(user) {
        return user.trim().toLowerCase().replace(/\s+/g, '');
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

    // LOGIN 
    loginPage() {
        const form = document.getElementById('loginForm');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const userInput = this.normalize(
                document.getElementById('loginUsername').value
            );

            const pass = document.getElementById('loginPassword').value;

            if (!userInput || !pass) {
                alert('Isi username & password!');
                return;
            }

            let users = {};

            try {
                users = JSON.parse(localStorage.getItem('users')) || {};
            } catch {
                localStorage.removeItem('users');
                users = {};
            }

            const foundUser = Object.keys(users).find(
                u => this.normalize(u) === userInput
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

            } catch {
                alert('Data user rusak! Silakan daftar ulang.');
                localStorage.removeItem('users');
            }

            document.getElementById('loginPassword').value = '';
        });
    }

    // REGISTER 
    registerPage() {
        const form = document.getElementById('registerForm');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const user = this.normalize(
                document.getElementById('registerUsername').value
            );

            const pass = document.getElementById('registerPassword').value;

            if (!user || pass.length < 4) {
                alert('Username & password min 4 karakter!');
                return;
            }

            let users = {};

            try {
                users = JSON.parse(localStorage.getItem('users')) || {};
            } catch {
                localStorage.removeItem('users');
                users = {};
            }

            if (users[user]) {
                alert('Username sudah terdaftar!');
                return;
            }

            users[user] = btoa(pass);
            localStorage.setItem('users', JSON.stringify(users));

            console.log('✅ USERS:', users);

            alert('Daftar berhasil!');
            window.location.href = 'login.html';
        });
    }

    // CHECK LOGIN 
    checkLogin() {
        const user = localStorage.getItem('currentUser');

        let users = {};
        try {
            users = JSON.parse(localStorage.getItem('users')) || {};
        } catch {
            users = {};
        }

        if (!user || !users[user]) {
            localStorage.removeItem('currentUser');
            window.location.replace('login.html');
            return;
        }

        this.initApp(user);
    }

    // APP 
    initApp(user) {
        this.user = user;

        try {
            this.tasks = JSON.parse(localStorage.getItem(`tasks_${user}`)) || [];
        } catch {
            this.tasks = [];
        }

        this.filter = 'all';

        document.getElementById('username').textContent = user;

        document.getElementById('addTaskForm').onsubmit = this.addTask.bind(this);

        document.getElementById('logoutBtn').onclick = () => {
            if (confirm('Logout?')) {
                localStorage.removeItem('currentUser');
                location.href = 'login.html';
            }
        };

        document.querySelectorAll('.tab').forEach(tab => {
            tab.onclick = () => this.setFilter(tab.dataset.filter, tab);
        });

        document.getElementById('closeModal').onclick = this.closeModal.bind(this);
        document.getElementById('editForm').onsubmit = this.saveEdit.bind(this);
        document.getElementById('deleteTaskBtn').onclick = this.deleteCurrentTask.bind(this);

        this.render();
        this.updateStats();
    }

    addTask(e) {
        e.preventDefault();

        const title = document.getElementById('newTask').value.trim();
        if (!title) return;

        this.tasks.unshift({
            id: Date.now(),
            title,
            priority: document.getElementById('isPriority').checked,
            dueDate: document.getElementById('dueDate').value,
            done: false
        });

        this.saveTasks();
        e.target.reset();

        this.render();
        this.updateStats();
    }

    setFilter(filter, el) {
        this.filter = filter;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        this.render();
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

    render() {
        const el = document.getElementById('tasksList');
        const data = this.getFiltered();

        if (!data.length) {
            el.innerHTML = `<p style="text-align:center">Tidak ada tugas</p>`;
            return;
        }

        el.innerHTML = data.map(t => `
            <div class="task-card ${t.done?'done':''}">
                <div>${t.title}</div>
                <div>
                    <button onclick="todo.toggle(${t.id})">✅</button>
                    <button onclick="todo.remove(${t.id})">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    toggle(id) {
        const t = this.tasks.find(x => x.id == id);
        if (!t) return;
        t.done = !t.done;
        this.saveTasks();
        this.render();
        this.updateStats();
    }

    remove(id) {
        this.tasks = this.tasks.filter(t => t.id != id);
        this.saveTasks();
        this.render();
        this.updateStats();
    }

    saveTasks() {
        localStorage.setItem(`tasks_${this.user}`, JSON.stringify(this.tasks));
    }

    updateStats() {
        document.getElementById('totalCount').textContent = this.tasks.filter(t=>!t.done).length;
        document.getElementById('priorityCount').textContent = this.tasks.filter(t=>t.priority && !t.done).length;
        document.getElementById('doneCount').textContent = this.tasks.filter(t=>t.done).length;
    }

    closeModal() {}
    saveEdit(e){e.preventDefault();}
    deleteCurrentTask(){}
}

document.addEventListener('DOMContentLoaded', () => {
    window.todo = new ToDoList();
});