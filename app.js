lucide.createIcons();

// --- State ---
let currentUser = null;

// --- Navigation ---
window.switchTab = (tabId) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.m-nav').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`page-${tabId}`).classList.add('active');
    
    // Update Active State
    document.querySelectorAll(`.nav-item`).forEach(btn => {
        if(btn.onclick.toString().includes(tabId)) btn.classList.add('active');
    });
    document.querySelectorAll(`.m-nav`).forEach(btn => {
        if(btn.onclick.toString().includes(tabId)) btn.classList.add('active');
    });

    const titles = { dashboard: 'Dashboard', notes: 'Notes', tasks: 'Tasks', expenses: 'Expenses', ai: 'AI Agent', settings: 'Settings' };
    document.getElementById('page-title').textContent = titles[tabId];
};

// --- Authentication (Simulated for now, needs Backend) ---
document.getElementById('btn-login').addEventListener('click', () => {
    const email = document.getElementById('auth-email').value;
    if(email) {
        currentUser = { email, uid: 'user_123' }; // Mock User
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('app-screen').classList.add('active');
        document.getElementById('user-email-display').textContent = email;
        loadData();
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    location.reload();
});

// --- Data Logic (Fetches from API) ---
const API_URL = '/api'; // This will point to your Vercel API

async function loadData() {
    // In real scenario: fetch(`${API_URL}/notes`)
    // For demo, we clear lists
    document.getElementById('notes-list').innerHTML = '<p class="text-muted" style="text-align:center; padding:20px;">No notes found.</p>';
    document.getElementById('tasks-list').innerHTML = '<p class="text-muted" style="text-align:center; padding:20px;">No tasks found.</p>';
    document.getElementById('expenses-list').innerHTML = '<p class="text-muted" style="text-align:center; padding:20px;">No expenses found.</p>';
}

// --- AI Chat ---
document.getElementById('btn-send-ai').addEventListener('click', async () => {
    const input = document.getElementById('ai-input');
    const msg = input.value;
    if(!msg) return;

    const history = document.getElementById('chat-history');
    history.innerHTML += `<div class="msg user">${msg}</div>`;
    input.value = '';

    // Call API
    try {
        const res = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        history.innerHTML += `<div class="msg bot">${data.response}</div>`;
    } catch(e) {
        history.innerHTML += `<div class="msg bot" style="color:red">Error connecting to AI</div>`;
    }
    history.scrollTop = history.scrollHeight;
});

// --- Modals ---
window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

// Save Actions
document.getElementById('btn-save-note').onclick = () => {
    const title = document.getElementById('note-title').value;
    if(title) {
        // API Call: POST /api/notes
        alert('Note Saved (API Integration Needed)');
        closeModal('modal-note');
    }
};