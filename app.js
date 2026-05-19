// Initialize Lucide Icons
lucide.createIcons();

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyAy8tuXOyGrdSEaJ6pfUfD00pvWCqlv5oU",
  authDomain: "hc-agent-3050a.firebaseapp.com",
  projectId: "hc-agent-3050a",
  storageBucket: "hc-agent-3050a.firebasestorage.app",
  messagingSenderId: "230682956952",
  appId: "1:230682956952:web:de0cae362a012c31a42ced"
};

// Initialize Firebase v8 Compat
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- UI Navigation ---
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  
  document.getElementById(`tab-${tabId}`).classList.add('active');
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tabId = e.currentTarget.getAttribute('data-tab');
    switchTab(tabId);
  });
});

// --- Authentication ---
auth.onAuthStateChanged(user => {
  if (user) {
    switchPage('page-dashboard');
    document.getElementById('user-email-display').textContent = user.email;
    loadData(user.uid);
  } else {
    switchPage('page-login');
  }
});

document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('auth-email').value;
  const pass = document.getElementById('auth-pass').value;
  const errEl = document.getElementById('auth-error');
  
  if(!email || !pass) return;

  try {
    // Try login first
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (error) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        // If not found, try register
        await auth.createUserWithEmailAndPassword(email, pass);
      } catch (err2) {
        errEl.style.display = 'block';
        errEl.textContent = err2.message;
      }
    } else {
      errEl.style.display = 'block';
      errEl.textContent = error.message;
    }
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  auth.signOut();
});

// --- Data Loading & Operations ---
function loadData(uid) {
  // Setup real-time listeners for instant updates!
  
  // Expenses
  db.collection('users').doc(uid).collection('expenses').onSnapshot(snap => {
    const list = document.getElementById('expenses-list');
    list.innerHTML = '';
    let total = 0;
    snap.forEach(doc => {
      const data = doc.data();
      total += data.amount;
      list.innerHTML += `
        <div class="glass-card list-item">
          <div style="flex: 1">
            <h4 style="font-size: 15px;">${data.title}</h4>
            <p style="font-size: 12px; color: #64748b;">৳${data.amount}</p>
          </div>
          <button class="icon-btn" onclick="deleteDoc('expenses', '${doc.id}')" style="color: #ef4444;"><i data-lucide="trash-2"></i></button>
        </div>
      `;
    });
    document.getElementById('dash-expenses').textContent = `৳${total}`;
    lucide.createIcons();
  });

  // Notes
  db.collection('users').doc(uid).collection('notes').onSnapshot(snap => {
    const list = document.getElementById('notes-list');
    list.innerHTML = '';
    let count = 0;
    snap.forEach(doc => {
      count++;
      const data = doc.data();
      list.innerHTML += `
        <div class="glass-card" style="padding: 20px;">
          <h3 style="font-size: 16px; margin-bottom: 8px;">${data.title}</h3>
          <p style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;">${data.content}</p>
          <button class="icon-btn" onclick="deleteDoc('notes', '${doc.id}')" style="color: #ef4444;"><i data-lucide="trash-2"></i></button>
        </div>
      `;
    });
    document.getElementById('dash-notes').textContent = count;
    lucide.createIcons();
  });

  // Tasks
  db.collection('users').doc(uid).collection('tasks').onSnapshot(snap => {
    const list = document.getElementById('tasks-list');
    list.innerHTML = '';
    let pendingCount = 0;
    snap.forEach(doc => {
      const data = doc.data();
      if (!data.isCompleted) pendingCount++;
      list.innerHTML += `
        <div class="glass-card list-item" style="opacity: ${data.isCompleted ? '0.5' : '1'}">
          <input type="checkbox" ${data.isCompleted ? 'checked' : ''} onchange="toggleTask('${doc.id}', this.checked)" style="width: 18px; height: 18px; cursor: pointer;">
          <div style="flex: 1; text-decoration: ${data.isCompleted ? 'line-through' : 'none'}; margin-left: 12px;">
            <h4 style="font-size: 15px;">${data.taskName}</h4>
            <p style="font-size: 12px; color: #64748b;">${data.dueDate}</p>
          </div>
          <button class="icon-btn" onclick="deleteDoc('tasks', '${doc.id}')" style="color: #ef4444;"><i data-lucide="trash-2"></i></button>
        </div>
      `;
    });
    document.getElementById('dash-tasks').textContent = pendingCount;
    lucide.createIcons();
  });

  // Settings
  db.collection('users').doc(uid).collection('settings').doc('profile').get().then(doc => {
    if(doc.exists && doc.data().apiKey) {
      document.getElementById('setting-apikey').value = doc.data().apiKey;
    }
  });
}

// Global functions for inline HTML event handlers
window.deleteDoc = (collection, id) => {
  db.collection('users').doc(auth.currentUser.uid).collection(collection).doc(id).delete();
};

window.toggleTask = (id, isCompleted) => {
  db.collection('users').doc(auth.currentUser.uid).collection('tasks').doc(id).update({ isCompleted });
};

// --- Modals Add Logic ---
document.getElementById('btn-add-expense').addEventListener('click', () => {
  const title = document.getElementById('exp-title').value;
  const amount = document.getElementById('exp-amount').value;
  if(title && amount) {
    db.collection('users').doc(auth.currentUser.uid).collection('expenses').add({
      title, amount: parseFloat(amount), createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('exp-title').value = '';
    document.getElementById('exp-amount').value = '';
    document.getElementById('modal-expense').style.display = 'none';
  }
});

window.openNoteModal = () => {
  document.getElementById('note-title').value = '';
  document.getElementById('note-content').value = '';
  document.getElementById('modal-note').style.display = 'block';
};

document.getElementById('btn-save-note').addEventListener('click', () => {
  const title = document.getElementById('note-title').value;
  const content = document.getElementById('note-content').value;
  if(title) {
    db.collection('users').doc(auth.currentUser.uid).collection('notes').add({
      title, content, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('modal-note').style.display = 'none';
  }
});

document.getElementById('btn-add-task').addEventListener('click', () => {
  const title = document.getElementById('task-title').value;
  const date = document.getElementById('task-date').value;
  if(title) {
    db.collection('users').doc(auth.currentUser.uid).collection('tasks').add({
      taskName: title, dueDate: date || new Date().toISOString().split('T')[0], isCompleted: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('task-title').value = '';
    document.getElementById('modal-task').style.display = 'none';
  }
});

// Settings Save
document.getElementById('btn-save-settings').addEventListener('click', () => {
  const apiKey = document.getElementById('setting-apikey').value;
  db.collection('users').doc(auth.currentUser.uid).collection('settings').doc('profile').set({
    apiKey
  }, { merge: true }).then(() => {
    alert('Settings Saved Successfully!');
  });
});
