// script.js
// StudyMind AI - Full Frontend Application

// --- DOM Elements ---
const authContainer = document.getElementById('auth-container');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authTabs = document.querySelectorAll('.auth-tab');
const logoutBtn = document.getElementById('logout-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const clearChatsBtn = document.getElementById('clear-chats-btn');
const profileBtn = document.getElementById('profile-btn');
const profileModal = document.getElementById('profile-modal');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const toolModal = document.getElementById('tool-modal');
const chatMessagesDiv = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-message-btn');
const chatsListDiv = document.getElementById('chats-list');
const backToDashboard = document.getElementById('back-to-dashboard');
const dashboardView = document.getElementById('dashboard-view');
const chatView = document.getElementById('chat-view');
const userNameSpan = document.getElementById('user-name-display');
const recentActivityDiv = document.getElementById('recent-activity-list');
const dashboardQuestion = document.getElementById('dashboard-question');
const dashboardAskBtn = document.getElementById('dashboard-ask-btn');
const heroNewChatBtn = document.getElementById('hero-new-chat-btn');
const heroFocusBtn = document.getElementById('hero-focus-btn');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const clearAllDataBtn = document.getElementById('clear-all-data-btn');
const chatSearchInput = document.getElementById('chat-search');
const exportChatBtn = document.getElementById('export-chat-btn');
const exportDataBtn = document.getElementById('export-data-btn');
const importDataInput = document.getElementById('import-data-input');
const statChats = document.getElementById('stat-chats');
const statMessages = document.getElementById('stat-messages');
const statTools = document.getElementById('stat-tools');
const profileForm = document.getElementById('profile-form');
const profileAvatar = document.getElementById('profile-avatar');
const profileNameDisplay = document.getElementById('profile-name-display');
const profileEmailDisplay = document.getElementById('profile-email-display');
const profileNameInput = document.getElementById('profile-name-input');
const profileEmailInput = document.getElementById('profile-email-input');
const profileChatCount = document.getElementById('profile-chat-count');
const profileMessageCount = document.getElementById('profile-message-count');
const profileToolCount = document.getElementById('profile-tool-count');
const profileLastActive = document.getElementById('profile-last-active');

// --- State ---
let currentUser = null;           // Stores { email, name }
let currentChatId = null;
let chats = [];                   // Array of chat objects { id, title, messages, updatedAt }
let isLoading = false;
let typingTimeout = null;
let toolRuns = 0;
let focusTimer = null;
let focusSecondsLeft = 25 * 60;

// Helper: Toast notification
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// Save/Load from localStorage
function saveUserData() {
    if (!currentUser) return;
    const data = {
        user: currentUser,
        chats: chats,
        settings: { darkMode: darkModeToggle.checked },
        toolRuns: toolRuns
    };
    localStorage.setItem(`studymind_${currentUser.email}`, JSON.stringify(data));
}

function loadUserData() {
    if (!currentUser) return;
    const raw = localStorage.getItem(`studymind_${currentUser.email}`);
    if (raw) {
        try {
            const data = JSON.parse(raw);
            chats = data.chats || [];
            toolRuns = Number(data.toolRuns || 0);
            if (data.settings && data.settings.darkMode !== undefined) {
                darkModeToggle.checked = data.settings.darkMode;
                applyDarkMode();
            }
        } catch(e) { console.error(e); }
    }
    if (!chats.length) {
        // create default chat
        const defaultChat = {
            id: Date.now(),
            title: "New Chat",
            messages: [{ role: 'assistant', content: "Hello! I'm StudyMind AI. Ask me anything about your studies, or use the tools from the dashboard!", timestamp: new Date().toISOString() }],
            updatedAt: new Date().toISOString()
        };
        chats = [defaultChat];
        currentChatId = defaultChat.id;
        saveUserData();
    } else {
        currentChatId = chats[0]?.id || null;
    }
    renderChatsList();
    renderCurrentChat();
    renderRecentActivity();
    renderStudyStats();
}

function applyDarkMode() {
    if (darkModeToggle.checked) {
        document.body.style.background = "radial-gradient(circle at 20% 30%, #0a0f1e, #03050b)";
        document.body.style.color = "#eef2ff";
    } else {
        document.body.style.background = "radial-gradient(circle at 20% 30%, #e0e7ff, #f1f5f9)";
        document.body.style.color = "#0f172a";
    }
}

function renderStudyStats() {
    if (!statChats || !statMessages || !statTools) return;
    const messageCount = chats.reduce((total, chat) => total + (chat.messages?.length || 0), 0);
    statChats.textContent = chats.length;
    statMessages.textContent = messageCount;
    statTools.textContent = toolRuns;
    renderProfileDetails();
}

function renderProfileDetails() {
    if (!currentUser || !profileModal) return;
    const messageCount = chats.reduce((total, chat) => total + (chat.messages?.length || 0), 0);
    const latestChat = [...chats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    const lastActive = latestChat?.updatedAt ? new Date(latestChat.updatedAt).toLocaleDateString() : "Today";
    const initial = (currentUser.name || currentUser.email || "S").trim().charAt(0).toUpperCase();

    if (profileAvatar) profileAvatar.textContent = initial;
    if (profileNameDisplay) profileNameDisplay.textContent = currentUser.name || "Student";
    if (profileEmailDisplay) profileEmailDisplay.textContent = currentUser.email || "";
    if (profileNameInput) profileNameInput.value = currentUser.name || "";
    if (profileEmailInput) profileEmailInput.value = currentUser.email || "";
    if (profileChatCount) profileChatCount.textContent = chats.length;
    if (profileMessageCount) profileMessageCount.textContent = messageCount;
    if (profileToolCount) profileToolCount.textContent = toolRuns;
    if (profileLastActive) profileLastActive.textContent = lastActive;
}

function openProfile() {
    renderProfileDetails();
    profileModal.style.display = 'flex';
}

function saveProfile(e) {
    e.preventDefault();
    if (!currentUser) return;
    const newName = profileNameInput.value.trim();
    if (!newName) return showToast("Name cannot be empty");

    currentUser.name = newName;
    userNameSpan.textContent = newName;

    const storedUser = JSON.parse(localStorage.getItem(`user_${currentUser.email}`) || "{}");
    localStorage.setItem(`user_${currentUser.email}`, JSON.stringify({
        ...storedUser,
        name: newName,
        email: currentUser.email,
        password: storedUser.password || ""
    }));

    saveUserData();
    renderProfileDetails();
    showToast("Profile updated");
}

function trackToolRun() {
    toolRuns += 1;
    saveUserData();
    renderStudyStats();
}

function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
}

function getStoredUserRecord(email) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedKey = `user_${normalizedEmail}`;
    const directRecord = localStorage.getItem(normalizedKey);
    if (directRecord) return { key: normalizedKey, user: JSON.parse(directRecord) };

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('user_')) continue;
        try {
            const user = JSON.parse(localStorage.getItem(key));
            if (normalizeEmail(user?.email) === normalizedEmail) {
                return { key, user };
            }
        } catch (error) {
            console.warn("Skipping invalid user record", key, error);
        }
    }
    return null;
}

function migrateUserRecord(record, normalizedEmail) {
    if (!record) return null;
    const normalizedKey = `user_${normalizedEmail}`;
    const migratedUser = { ...record.user, email: normalizedEmail };
    localStorage.setItem(normalizedKey, JSON.stringify(migratedUser));
    if (record.key !== normalizedKey) localStorage.removeItem(record.key);

    const oldDataKey = `studymind_${record.user.email}`;
    const newDataKey = `studymind_${normalizedEmail}`;
    if (oldDataKey !== newDataKey && localStorage.getItem(oldDataKey) && !localStorage.getItem(newDataKey)) {
        localStorage.setItem(newDataKey, localStorage.getItem(oldDataKey));
        localStorage.removeItem(oldDataKey);
    }
    return migratedUser;
}

// Auth Logic
function handleLogin(email, password) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
        showToast("Enter your email and password", 2000);
        return false;
    }
    const record = getStoredUserRecord(normalizedEmail);
    if (record) {
        const user = migrateUserRecord(record, normalizedEmail);
        if (user.password === password) {
            currentUser = { email: normalizedEmail, name: user.name || "Student" };
            userNameSpan.textContent = currentUser.name;
            loadUserData();
            showApp();
            showToast(`Welcome back, ${currentUser.name}!`);
            return true;
        }
        showToast("Wrong password. Please try again.");
        return false;
    }
    showToast("Account not found. Please sign up first.");
    return false;
}

function handleSignup(name, email, password) {
    const normalizedEmail = normalizeEmail(email);
    const cleanName = name.trim();
    if (!cleanName || !normalizedEmail || password.length < 6) {
        showToast("Name, valid email, password min 6 chars");
        return false;
    }
    if (getStoredUserRecord(normalizedEmail)) {
        showToast("User already exists. Login instead.");
        return false;
    }
    const newUser = { name: cleanName, email: normalizedEmail, password };
    localStorage.setItem(`user_${normalizedEmail}`, JSON.stringify(newUser));
    currentUser = { email: normalizedEmail, name: cleanName };
    userNameSpan.textContent = cleanName;
    // Initialize empty chats
    chats = [];
    toolRuns = 0;
    const defaultChat = {
        id: Date.now(),
        title: "New Chat",
        messages: [{ role: 'assistant', content: "Hello! I'm StudyMind AI. How can I help you study today?", timestamp: new Date().toISOString() }],
        updatedAt: new Date().toISOString()
    };
    chats = [defaultChat];
    currentChatId = defaultChat.id;
    saveUserData();
    showApp();
    showToast("Account created! Start learning with AI.");
    return true;
}

function showApp() {
    authContainer.classList.remove('active');
    mainApp.classList.add('active');
    renderChatsList();
    renderCurrentChat();
    renderRecentActivity();
    renderStudyStats();
}

function logout() {
    if (currentUser) saveUserData();
    currentUser = null;
    currentChatId = null;
    chats = [];
    toolRuns = 0;
    authContainer.classList.add('active');
    mainApp.classList.remove('active');
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
    showToast("Logged out successfully");
}

// Chat Functions
function renderChatsList() {
    if (!chatsListDiv) return;
    chatsListDiv.innerHTML = '';
    chats.forEach(chat => {
        const chatDiv = document.createElement('div');
        chatDiv.className = `chat-item ${currentChatId === chat.id ? 'active' : ''}`;
        chatDiv.innerHTML = `
            <span class="chat-title">${escapeHtml(chat.title.substring(0, 25))}</span>
            <button class="delete-chat" data-id="${chat.id}"><i class="fas fa-trash"></i></button>
        `;
        chatDiv.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-chat')) {
                currentChatId = chat.id;
                renderChatsList();
                renderCurrentChat();
                showDashboardView(false);
            }
        });
        const delBtn = chatDiv.querySelector('.delete-chat');
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChatById(chat.id);
        });
        chatsListDiv.appendChild(chatDiv);
    });
}

function deleteChatById(id) {
    chats = chats.filter(c => c.id !== id);
    if (chats.length === 0) {
        const newId = Date.now();
        chats.push({ id: newId, title: "New Chat", messages: [{ role: 'assistant', content: "Welcome! Ask me anything.", timestamp: new Date().toISOString() }], updatedAt: new Date().toISOString() });
        currentChatId = newId;
    } else {
        if (currentChatId === id) currentChatId = chats[0].id;
    }
    saveUserData();
    renderChatsList();
    renderCurrentChat();
    renderRecentActivity();
    showToast("Chat deleted");
}

function renderCurrentChat() {
    if (!chatMessagesDiv) return;
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;
    const query = chatSearchInput?.value.trim().toLowerCase() || '';
    chatMessagesDiv.innerHTML = '';
    chat.messages
        .filter(msg => !query || msg.content.toLowerCase().includes(query))
        .forEach(msg => {
        appendMessageToDOM(msg.role, msg.content, msg.timestamp);
    });
    if (query && !chatMessagesDiv.children.length) {
        chatMessagesDiv.innerHTML = '<div class="empty-state">No messages match your search.</div>';
    }
    autoScrollChat();
    renderStudyStats();
}

function appendMessageToDOM(role, content, timestamp) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString();
    msgDiv.innerHTML = `
        <div class="avatar"><i class="fas ${role === 'user' ? 'fa-user' : 'fa-robot'}"></i></div>
        <div class="content">${escapeHtml(content)} <button class="copy-btn" title="Copy message"><i class="fas fa-copy"></i></button></div>
        <div class="timestamp">${timeStr}</div>
    `;
    msgDiv.querySelector('.copy-btn')?.addEventListener('click', () => copyText(content));
    chatMessagesDiv.appendChild(msgDiv);
    autoScrollChat();
}

function autoScrollChat() {
    if (chatMessagesDiv) chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

async function sendUserMessage(text) {
    if (!text.trim() || isLoading) return;
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;
    // Add user message
    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    chat.messages.push(userMsg);
    chat.updatedAt = new Date().toISOString();
    // Update title if first message
    if (chat.messages.length === 2 && chat.title === "New Chat") {
        chat.title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
    }
    saveUserData();
    renderCurrentChat();
    chatInput.value = '';
    isLoading = true;
    showTypingIndicator(true);
    // Simulate AI response (mock intelligence)
    setTimeout(() => {
        const aiReply = generateAIReply(text);
        const assistantMsg = { role: 'assistant', content: aiReply, timestamp: new Date().toISOString() };
        chat.messages.push(assistantMsg);
        saveUserData();
        showTypingIndicator(false);
        renderCurrentChat();
        renderRecentActivity();
        isLoading = false;
    }, 800 + Math.random() * 700);
}

function generateAIReply(userInput) {
    const lower = userInput.toLowerCase();
    if (lower.includes('summarize') || lower.includes('summary')) return "To summarize your notes, go to the Dashboard and click 'Notes Summarizer'. Paste your text and I'll generate a concise summary.";
    if (lower.includes('quiz')) return "Great! Use the Quiz Generator tool from the dashboard. Choose a topic and difficulty level to create custom quizzes.";
    if (lower.includes('homework') || lower.includes('help')) return "I can help with homework! Please share your question and I'll explain step by step.";
    if (lower.includes('code') || lower.includes('coding')) return "Coding Assistant is ready. Share your code snippet or error, and I'll help debug or explain concepts.";
    if (lower.includes('flashcard')) return "Open Flashcards on the dashboard, paste your notes, and I will split them into quick question-and-answer review cards.";
    if (lower.includes('focus') || lower.includes('timer') || lower.includes('pomodoro')) return "Try the Focus Timer from the dashboard. It helps you run a timed study sprint and logs it in your tool stats.";
    if (lower.includes('study plan')) return "Use Study Planner tool to create a personalized study schedule based on your subjects and available time.";
    return `I'm StudyMind AI. You asked: "${userInput.substring(0, 100)}". I can help with summarizing notes, generating quizzes, homework help, study plans, and coding. Try the tools on the dashboard or ask me anything!`;
}

function showTypingIndicator(show) {
    const existing = document.querySelector('.typing-indicator');
    if (show && !existing) {
        const div = document.createElement('div');
        div.className = 'message assistant typing-indicator';
        div.innerHTML = `<div class="avatar"><i class="fas fa-robot"></i></div><div class="content"><span class="loading-spinner"></span> Thinking...</div>`;
        chatMessagesDiv.appendChild(div);
        autoScrollChat();
    } else if (!show && existing) existing.remove();
}

function newChat() {
    const newId = Date.now();
    const newChatObj = {
        id: newId,
        title: "New Chat",
        messages: [{ role: 'assistant', content: "Hello! I'm StudyMind AI. How can I assist your studies today?", timestamp: new Date().toISOString() }],
        updatedAt: new Date().toISOString()
    };
    chats.unshift(newChatObj);
    currentChatId = newId;
    saveUserData();
    renderChatsList();
    renderCurrentChat();
    showDashboardView(false);
    showToast("New conversation started");
}

function clearAllChats() {
    const newId = Date.now();
    chats = [{ id: newId, title: "New Chat", messages: [{ role: 'assistant', content: "Chat history cleared. I'm here to help!", timestamp: new Date().toISOString() }], updatedAt: new Date().toISOString() }];
    currentChatId = newId;
    saveUserData();
    renderChatsList();
    renderCurrentChat();
    renderRecentActivity();
    showToast("All chats cleared");
}

function renderRecentActivity() {
    if (!recentActivityDiv) return;
    recentActivityDiv.innerHTML = '';
    const recent = [...chats].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0,5);
    recent.forEach(chat => {
        const lastMsg = chat.messages[chat.messages.length-1]?.content.substring(0, 50) || "Chat";
        const div = document.createElement('div');
        div.className = 'activity-item';
        div.innerHTML = `<span><i class="fas fa-comment"></i> ${escapeHtml(chat.title)}</span><small>${new Date(chat.updatedAt).toLocaleDateString()}</small>`;
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
            currentChatId = chat.id;
            renderChatsList();
            renderCurrentChat();
            showDashboardView(false);
        });
        recentActivityDiv.appendChild(div);
    });
}

function showDashboardView(show) {
    if (show) {
        dashboardView.classList.add('active');
        chatView.classList.remove('active');
        renderRecentActivity();
    } else {
        dashboardView.classList.remove('active');
        chatView.classList.add('active');
    }
}

function askFromDashboard() {
    const question = dashboardQuestion?.value.trim();
    if (!question) {
        showToast("Write a question first");
        return;
    }
    showDashboardView(false);
    sendUserMessage(question);
    dashboardQuestion.value = '';
}

// Student Tools Modal Logic
document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', () => {
        const tool = card.dataset.tool;
        openToolModal(tool);
    });
});

function openToolModal(tool) {
    const modal = toolModal;
    const titleElem = document.getElementById('tool-title');
    const bodyElem = document.getElementById('tool-body');
    if (!tool) return;
    let contentHtml = '';
    switch(tool) {
        case 'summarizer':
            titleElem.innerText = 'Notes Summarizer';
            contentHtml = `<textarea id="summarizer-input" placeholder="Paste your notes here..." rows="6" style="width:100%; background:#1e293b; color:white; border-radius:16px; padding:12px;"></textarea>
                           <button id="do-summarize" class="btn-primary" style="margin-top:12px;">Summarize</button>
                           <div id="summary-result" class="result-area"></div>`;
            break;
        case 'quiz':
            titleElem.innerText = 'Quiz Generator';
            contentHtml = `<input id="quiz-topic" placeholder="Topic (e.g., World War II)" style="width:100%; padding:10px; border-radius:40px; margin-bottom:12px;">
                           <button id="gen-quiz" class="btn-primary">Generate Quiz</button>
                           <div id="quiz-output" class="result-area"></div>`;
            break;
        case 'homework':
            titleElem.innerText = 'Homework Helper';
            contentHtml = `<textarea id="hw-question" placeholder="Enter your homework question..." rows="4" style="width:100%; padding:12px; border-radius:16px;"></textarea>
                           <button id="solve-hw" class="btn-primary">Get Help</button>
                           <div id="hw-answer" class="result-area"></div>`;
            break;
        case 'planner':
            titleElem.innerText = 'Study Planner';
            contentHtml = `<input id="subjects" placeholder="Subjects (comma separated)" style="width:100%; margin-bottom:8px;">
                           <input id="hours" placeholder="Hours available per day" type="number">
                           <button id="create-plan" class="btn-primary" style="margin-top:12px;">Generate Plan</button>
                           <div id="plan-output" class="result-area"></div>`;
            break;
        case 'coding':
            titleElem.innerText = 'Coding Assistant';
            contentHtml = `<textarea id="code-input" placeholder="Paste your code or describe problem..." rows="6" style="width:100%; border-radius:16px; padding:12px;"></textarea>
                           <button id="explain-code" class="btn-primary">Explain / Debug</button>
                           <div id="code-output" class="result-area"></div>`;
            break;
        case 'flashcards':
            titleElem.innerText = 'Flashcards';
            contentHtml = `<textarea id="flashcard-input" placeholder="Paste class notes, definitions, or a chapter outline..." rows="6" class="tool-input"></textarea>
                           <button id="make-flashcards" class="btn-primary">Create Flashcards</button>
                           <div id="flashcard-output" class="result-area flashcard-grid"></div>`;
            break;
        case 'focus':
            titleElem.innerText = 'Focus Timer';
            contentHtml = `<div class="timer-panel">
                               <div id="timer-display">25:00</div>
                               <div class="timer-controls">
                                   <button id="start-focus" class="btn-primary">Start</button>
                                   <button id="pause-focus" class="sidebar-btn compact-btn">Pause</button>
                                   <button id="reset-focus" class="sidebar-btn compact-btn">Reset</button>
                               </div>
                               <label class="timer-label">Minutes <input id="focus-minutes" type="number" min="5" max="90" value="25"></label>
                           </div>`;
            break;
    }
    bodyElem.innerHTML = contentHtml;
    modal.style.display = 'flex';
    attachToolEventListeners(tool);
}

function attachToolEventListenersLegacy(tool) {
    if (tool === 'summarizer') {
        document.getElementById('do-summarize')?.addEventListener('click', () => {
            const input = document.getElementById('summarizer-input').value;
            const output = document.getElementById('summary-result');
            if (!input) return output.innerHTML = '<p style="color:#f87171;">Please paste notes.</p>';
            output.innerHTML = `<div class="loading-spinner"></div> Generating summary...`;
            setTimeout(() => {
                const summary = `📝 Summary: ${input.substring(0, 150)}... (Truncated). Key points: Focus on main ideas. Use AI tools to expand.`;
                output.innerHTML = `<div class="glass-card" style="padding:12px;">${escapeHtml(summary)}</div>`;
            }, 500);
        });
    }
    if (tool === 'quiz') {
        document.getElementById('gen-quiz')?.addEventListener('click', () => {
            const topic = document.getElementById('quiz-topic').value;
            const out = document.getElementById('quiz-output');
            if (!topic) return out.innerHTML = '<p>Enter topic</p>';
            out.innerHTML = `<div class="loading-spinner"></div> Generating quiz...`;
            setTimeout(() => {
                out.innerHTML = `<div><strong>Quiz on ${escapeHtml(topic)}</strong><br>1. What is the most important fact about ${escapeHtml(topic)}?<br>2. Explain its significance.<br><br><em>(Sample quiz - upgrade to full version)</em></div>`;
            }, 600);
        });
    }
    if (tool === 'homework') {
        document.getElementById('solve-hw')?.addEventListener('click', () => {
            const q = document.getElementById('hw-question').value;
            const outDiv = document.getElementById('hw-answer');
            if (!q) return outDiv.innerHTML = '<p>Ask a question</p>';
            outDiv.innerHTML = `<div class="loading-spinner"></div> Solving...`;
            setTimeout(() => {
                outDiv.innerHTML = `<div>💡 Here's a step-by-step approach: ${escapeHtml(q.substring(0,100))}... Break it into smaller parts. Use reliable resources. I can elaborate further in chat!</div>`;
            }, 700);
        });
    }
    if (tool === 'planner') {
        document.getElementById('create-plan')?.addEventListener('click', () => {
            const subjects = document.getElementById('subjects').value;
            const hours = document.getElementById('hours').value;
            const out = document.getElementById('plan-output');
            if (!subjects) return out.innerHTML = '<p>Enter subjects</p>';
            out.innerHTML = `<div class="loading-spinner"></div> Creating plan...`;
            setTimeout(() => {
                out.innerHTML = `<div>📅 Study Plan: Allocate ${hours || 2} hours daily. Subjects: ${escapeHtml(subjects)}. Use Pomodoro technique. Weekly review recommended.</div>`;
            }, 500);
        });
    }
    if (tool === 'coding') {
        document.getElementById('explain-code')?.addEventListener('click', () => {
            const code = document.getElementById('code-input').value;
            const out = document.getElementById('code-output');
            if (!code) return out.innerHTML = '<p>Enter code or question.</p>';
            out.innerHTML = `<div class="loading-spinner"></div> Analyzing code...`;
            setTimeout(() => {
                out.innerHTML = `<div>🤖 Explanation: This code snippet ${escapeHtml(code.substring(0, 80))}... suggests a ${code.includes('function') ? 'function definition' : 'algorithm'}. I can help refactor or debug. Want me to explain in chat?</div>`;
            }, 800);
        });
    }
}

function attachToolEventListeners(tool) {
    if (tool === 'summarizer') {
        document.getElementById('do-summarize')?.addEventListener('click', () => {
            const input = document.getElementById('summarizer-input').value.trim();
            const output = document.getElementById('summary-result');
            if (!input) return output.innerHTML = '<p style="color:#f87171;">Please paste notes.</p>';
            output.innerHTML = `<div class="loading-spinner"></div> Generating summary...`;
            setTimeout(() => {
                const sentences = input.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean).slice(0, 4);
                const summary = sentences.length ? sentences.join('. ') + '.' : input.substring(0, 180);
                output.innerHTML = `<div class="glass-card result-card"><strong>Summary</strong><p>${escapeHtml(summary)}</p><small>Next step: convert this into a quiz or flashcards.</small></div>`;
                trackToolRun();
            }, 500);
        });
    }
    if (tool === 'quiz') {
        document.getElementById('gen-quiz')?.addEventListener('click', () => {
            const topic = document.getElementById('quiz-topic').value.trim();
            const out = document.getElementById('quiz-output');
            if (!topic) return out.innerHTML = '<p>Enter topic</p>';
            out.innerHTML = `<div class="loading-spinner"></div> Generating quiz...`;
            setTimeout(() => {
                out.innerHTML = `<div class="result-card"><strong>Quiz on ${escapeHtml(topic)}</strong><br>1. What is a core definition or fact related to ${escapeHtml(topic)}?<br>2. Why does it matter?<br>3. Give one example and explain it.<br>4. What is a common misconception?<br><br><em>Tip: answer first, then ask chat to grade your response.</em></div>`;
                trackToolRun();
            }, 600);
        });
    }
    if (tool === 'homework') {
        document.getElementById('solve-hw')?.addEventListener('click', () => {
            const q = document.getElementById('hw-question').value.trim();
            const outDiv = document.getElementById('hw-answer');
            if (!q) return outDiv.innerHTML = '<p>Ask a question</p>';
            outDiv.innerHTML = `<div class="loading-spinner"></div> Solving...`;
            setTimeout(() => {
                outDiv.innerHTML = `<div class="result-card">Step-by-step approach: identify what is given, name what is being asked, choose the relevant rule or formula, solve one small part at a time, then check your result. For this question: ${escapeHtml(q.substring(0,100))}...</div>`;
                trackToolRun();
            }, 700);
        });
    }
    if (tool === 'planner') {
        document.getElementById('create-plan')?.addEventListener('click', () => {
            const subjects = document.getElementById('subjects').value.trim();
            const hours = document.getElementById('hours').value;
            const out = document.getElementById('plan-output');
            if (!subjects) return out.innerHTML = '<p>Enter subjects</p>';
            out.innerHTML = `<div class="loading-spinner"></div> Creating plan...`;
            setTimeout(() => {
                const subjectList = subjects.split(',').map(s => s.trim()).filter(Boolean);
                out.innerHTML = `<div class="result-card"><strong>Study Plan</strong><br>${subjectList.map((subject, index) => `${index + 1}. ${escapeHtml(subject)} - ${hours || 2} focused hour(s), 10-minute review, 5 practice questions`).join('<br>')}<br><br>End each week with a mixed review session.</div>`;
                trackToolRun();
            }, 500);
        });
    }
    if (tool === 'coding') {
        document.getElementById('explain-code')?.addEventListener('click', () => {
            const code = document.getElementById('code-input').value.trim();
            const out = document.getElementById('code-output');
            if (!code) return out.innerHTML = '<p>Enter code or question.</p>';
            out.innerHTML = `<div class="loading-spinner"></div> Analyzing code...`;
            setTimeout(() => {
                out.innerHTML = `<div class="result-card">Explanation: this looks like ${code.includes('function') ? 'a function or reusable block' : 'an algorithm or code fragment'}. Start by checking inputs, expected output, and any error line. Snippet: ${escapeHtml(code.substring(0, 80))}...</div>`;
                trackToolRun();
            }, 800);
        });
    }
    if (tool === 'flashcards') {
        document.getElementById('make-flashcards')?.addEventListener('click', () => {
            const notes = document.getElementById('flashcard-input').value.trim();
            const out = document.getElementById('flashcard-output');
            if (!notes) return out.innerHTML = '<p>Paste notes first.</p>';
            const cards = notes.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean).slice(0, 6);
            out.innerHTML = (cards.length ? cards : [notes.substring(0, 120)]).map((text, index) => `
                <div class="flashcard">
                    <strong>Q${index + 1}. What should you remember?</strong>
                    <span>${escapeHtml(text)}</span>
                </div>
            `).join('');
            trackToolRun();
        });
    }
    if (tool === 'focus') {
        const display = document.getElementById('timer-display');
        const minutesInput = document.getElementById('focus-minutes');
        const updateDisplay = () => {
            const minutes = Math.floor(focusSecondsLeft / 60).toString().padStart(2, '0');
            const seconds = (focusSecondsLeft % 60).toString().padStart(2, '0');
            display.textContent = `${minutes}:${seconds}`;
        };
        const resetTimer = () => {
            clearInterval(focusTimer);
            focusTimer = null;
            focusSecondsLeft = Math.max(5, Number(minutesInput.value || 25)) * 60;
            updateDisplay();
        };
        resetTimer();
        document.getElementById('start-focus')?.addEventListener('click', () => {
            if (focusTimer) return;
            focusTimer = setInterval(() => {
                focusSecondsLeft -= 1;
                updateDisplay();
                if (focusSecondsLeft <= 0) {
                    clearInterval(focusTimer);
                    focusTimer = null;
                    trackToolRun();
                    showToast("Focus session complete!");
                }
            }, 1000);
        });
        document.getElementById('pause-focus')?.addEventListener('click', () => {
            clearInterval(focusTimer);
            focusTimer = null;
        });
        document.getElementById('reset-focus')?.addEventListener('click', resetTimer);
        minutesInput?.addEventListener('change', resetTimer);
    }
}

function createBilingualChatReply(userInput) {
    const topic = userInput.trim();
    const lower = topic.toLowerCase();
    let focus = "study question";
    let guidance = "break the topic into smaller parts, understand the main idea, then practice with examples.";

    if (lower.includes('summary') || lower.includes('summarize')) {
        focus = "summarizing notes";
        guidance = "read the text once, underline the central idea, remove repeated details, and keep only the definitions, causes, effects, formulas, dates, or examples that matter.";
    } else if (lower.includes('quiz')) {
        focus = "quiz practice";
        guidance = "start with easy recall questions, then move to why/how questions, and finally test yourself with examples or past-paper style questions.";
    } else if (lower.includes('homework') || lower.includes('help')) {
        focus = "homework solving";
        guidance = "write what is given, identify what is being asked, choose the correct rule or method, solve step by step, and check the final answer.";
    } else if (lower.includes('code') || lower.includes('coding') || lower.includes('error')) {
        focus = "coding help";
        guidance = "read the error carefully, check inputs and outputs, isolate the smallest failing part, then fix one issue at a time.";
    } else if (lower.includes('plan') || lower.includes('schedule')) {
        focus = "study planning";
        guidance = "divide your subjects by difficulty, give more time to weak areas, use short focused sessions, and revise the same topic after one day and one week.";
    }

    return `English:
You asked about: "${topic.substring(0, 160)}"

Here is a clear way to handle this ${focus}. First, understand the main idea instead of memorizing blindly. Then ${guidance} After that, explain the answer in your own words. If you can explain it simply, it means your understanding is becoming strong.

Step-by-step:
1. Identify the topic and the exact question.
2. Write the important points only.
3. Connect each point with a reason or example.
4. Review the answer once and improve weak parts.

Urdu:
آپ نے پوچھا: "${topic.substring(0, 160)}"

اس ${focus} کو سمجھنے کا بہتر طریقہ یہ ہے کہ پہلے اصل خیال کو سمجھیں، صرف رٹہ نہ لگائیں۔ پھر اہم نکات کو چھوٹے حصوں میں تقسیم کریں، ہر نکتے کے ساتھ وجہ یا مثال شامل کریں، اور آخر میں جواب کو اپنے الفاظ میں دہرائیں۔ جب آپ کسی بات کو آسان الفاظ میں سمجھا سکیں تو اس کا مطلب ہے کہ آپ کی سمجھ مضبوط ہو رہی ہے۔

طریقہ کار:
1. پہلے موضوع اور سوال کو واضح کریں۔
2. صرف ضروری نکات لکھیں۔
3. ہر نکتے کے ساتھ مثال یا وجہ دیں۔
4. آخر میں جواب دوبارہ پڑھ کر بہتر بنائیں۔`;
}

function createEnglishChatReply(userInput) {
    return createBilingualChatReply(userInput).replace(/^English:\n/, '').split('\n\nUrdu:')[0];
}

function wantsUrdu(userInput) {
    const lower = userInput.toLowerCase();
    return lower.includes('urdu') || lower.includes('both') || lower.includes('translation') || /[اآبپتٹثجچحخدڈذرڑزژسشصضطظعغفقکگلمنوہیے]/.test(userInput);
}

function createBilingualToolAnswer(tool, input, extra = {}) {
    const cleanInput = input.trim();
    if (tool === 'summarizer') {
        const points = cleanInput.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean).slice(0, 5);
        const summary = points.length ? points.join('. ') + '.' : cleanInput.substring(0, 220);
        return {
            english: `Summary:\n${summary}\n\nDetailed explanation:\nThese notes are mainly about the ideas written above. To study them properly, first learn the key terms, then connect them with examples. Do not try to memorize every line. Focus on what the topic means, why it matters, and how it can appear in a question.\n\nImportant points:\n${points.map((point, index) => `${index + 1}. ${point}`).join('\n') || '1. Main idea\n2. Supporting detail\n3. Example or use'}`,
            urdu: `خلاصہ:\n${summary}\n\nتفصیلی وضاحت:\nان نوٹس کا اصل مقصد اوپر دیے گئے اہم خیالات کو سمجھنا ہے۔ بہتر پڑھائی کے لیے پہلے اہم اصطلاحات سمجھیں، پھر انہیں مثالوں کے ساتھ جوڑیں۔ ہر لائن رٹنے کی ضرورت نہیں۔ یہ دیکھیں کہ موضوع کا مطلب کیا ہے، یہ کیوں اہم ہے، اور امتحان میں کس طرح پوچھا جا سکتا ہے۔`
        };
    }
    if (tool === 'quiz') {
        return {
            english: `Practice quiz on "${cleanInput}":\n1. Define ${cleanInput} in simple words.\n2. Why is ${cleanInput} important?\n3. Explain one real example of ${cleanInput}.\n4. What mistake do students usually make in this topic?\n5. Write a short answer that connects definition, reason, and example.\n\nHow to use it:\nAnswer without looking at notes first. Then check your notes and improve the weak answers.`,
            urdu: `"${cleanInput}" پر پریکٹس کوئز:\n1. ${cleanInput} کو آسان الفاظ میں بیان کریں۔\n2. ${cleanInput} کیوں اہم ہے؟\n3. اس کی ایک حقیقی مثال لکھیں۔\n4. اس موضوع میں طلبہ عام طور پر کون سی غلطی کرتے ہیں؟\n5. ایک مختصر جواب لکھیں جس میں تعریف، وجہ اور مثال شامل ہو۔\n\nطریقہ:\nپہلے نوٹس دیکھے بغیر جواب دیں، پھر نوٹس سے ملا کر کمزور حصے بہتر کریں۔`
        };
    }
    if (tool === 'homework') {
        return {
            english: `Homework help:\nQuestion: ${cleanInput}\n\nStep-by-step method:\n1. Read the question slowly and underline what is being asked.\n2. Write the given information separately.\n3. Choose the correct concept, formula, rule, or chapter idea.\n4. Solve only one step at a time.\n5. Check whether your final answer actually answers the question.\n\nExplanation:\nMost homework becomes easier when you separate "given information" from "required answer". If it is math, write the formula first. If it is theory, write definition, explanation, and example.`,
            urdu: `ہوم ورک مدد:\nسوال: ${cleanInput}\n\nمرحلہ وار طریقہ:\n1. سوال آرام سے پڑھیں اور دیکھیں کہ پوچھا کیا گیا ہے۔\n2. دی گئی معلومات الگ لکھیں۔\n3. درست اصول، فارمولا یا تصور منتخب کریں۔\n4. ایک وقت میں صرف ایک قدم حل کریں۔\n5. آخر میں دیکھیں کہ جواب واقعی سوال کا جواب دے رہا ہے یا نہیں۔\n\nوضاحت:\nزیادہ تر ہوم ورک اس وقت آسان ہو جاتا ہے جب آپ "دی گئی معلومات" اور "مطلوبہ جواب" کو الگ کر لیتے ہیں۔`
        };
    }
    if (tool === 'planner') {
        const subjects = cleanInput.split(',').map(s => s.trim()).filter(Boolean);
        const hours = extra.hours || 2;
        return {
            english: `Study plan:\n${subjects.map((subject, index) => `${index + 1}. ${subject}: ${hours} hour(s), 45 minutes learning, 15 minutes practice/revision`).join('\n')}\n\nBest routine:\nStart with the hardest subject while your mind is fresh. After every session, write three things you learned and one thing you still do not understand.`,
            urdu: `اسٹڈی پلان:\n${subjects.map((subject, index) => `${index + 1}. ${subject}: ${hours} گھنٹے، 45 منٹ پڑھائی، 15 منٹ پریکٹس/دہرائی`).join('\n')}\n\nبہترین طریقہ:\nمشکل مضمون پہلے پڑھیں کیونکہ اس وقت ذہن تازہ ہوتا ہے۔ ہر سیشن کے بعد تین سیکھی ہوئی باتیں اور ایک کمزور بات لکھیں۔`
        };
    }
    if (tool === 'coding') {
        return {
            english: `Coding explanation:\nYour input/code:\n${cleanInput.substring(0, 700)}\n\nHow to debug it properly:\n1. Identify what the code should do.\n2. Check the input values.\n3. Check the output you expected.\n4. Read the error message or wrong result carefully.\n5. Test a smaller version of the code.\n\nIf this is an error, the best next step is to share the exact error line and expected output.`,
            urdu: `کوڈنگ وضاحت:\nآپ کا کوڈ/سوال:\n${cleanInput.substring(0, 700)}\n\nصحیح ڈیبگ کرنے کا طریقہ:\n1. پہلے سمجھیں کہ کوڈ کو کیا کرنا چاہیے۔\n2. input values چیک کریں۔\n3. expected output دیکھیں۔\n4. error message یا غلط نتیجہ غور سے پڑھیں۔\n5. کوڈ کا چھوٹا حصہ الگ چلا کر ٹیسٹ کریں۔\n\nاگر error ہے تو اگلا بہترین قدم exact error line اور expected output دینا ہے۔`
        };
    }
    if (tool === 'flashcards') {
        const cards = cleanInput.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean).slice(0, 6);
        return {
            english: `Flashcards:\n${cards.map((card, index) => `Q${index + 1}. What is the key idea?\nA${index + 1}. ${card}`).join('\n\n')}\n\nReview method:\nRead the question side first. Try to answer from memory. Then check the answer and repeat weak cards after 10 minutes.`,
            urdu: `فلیش کارڈز:\n${cards.map((card, index) => `سوال ${index + 1}: اہم خیال کیا ہے؟\nجواب ${index + 1}: ${card}`).join('\n\n')}\n\nدہرائی کا طریقہ:\nپہلے سوال پڑھیں، جواب یاد سے دینے کی کوشش کریں، پھر جواب دیکھیں اور کمزور کارڈز 10 منٹ بعد دوبارہ کریں۔`
        };
    }
    return {
        english: createBilingualChatReply(cleanInput),
        urdu: "براہ کرم اپنا سوال مزید واضح لکھیں تاکہ بہتر جواب دیا جا سکے۔"
    };
}

function renderToolLoading(toolName) {
    const titleElem = document.getElementById('tool-title');
    const bodyElem = document.getElementById('tool-body');
    titleElem.innerText = `${toolName} Result`;
    bodyElem.innerHTML = `
        <div class="tool-result-page loading-page">
            <div class="loading-spinner"></div>
            <h4>Preparing a detailed answer...</h4>
            <p>Your English explanation is being generated.</p>
        </div>
    `;
}

function renderToolResultPage(tool, toolName, question, answer) {
    const bodyElem = document.getElementById('tool-body');
    bodyElem.innerHTML = `
        <div class="tool-result-page">
            <div class="result-toolbar">
                <button class="sidebar-btn compact-btn" id="tool-back-btn"><i class="fas fa-arrow-left"></i> Back</button>
                <button class="sidebar-btn compact-btn" id="copy-result-btn"><i class="fas fa-copy"></i> Copy</button>
            </div>
            <div class="question-card">
                <small>Your input</small>
                <p>${escapeHtml(question)}</p>
            </div>
            <section class="bilingual-section">
                <h4>English Explanation</h4>
                <p>${escapeHtml(answer.english)}</p>
            </section>
            <div class="translation-toggle-row">
                <button class="sidebar-btn compact-btn" id="toggle-urdu-btn"><i class="fas fa-language"></i> Show Urdu translation</button>
            </div>
            <section class="bilingual-section urdu-text" id="urdu-translation-section" hidden>
                <h4>اردو وضاحت</h4>
                <p>${escapeHtml(answer.urdu)}</p>
            </section>
        </div>
    `;
    document.getElementById('tool-back-btn')?.addEventListener('click', () => openToolModal(tool));
    document.getElementById('copy-result-btn')?.addEventListener('click', () => {
        const urduSection = document.getElementById('urdu-translation-section');
        const includeUrdu = urduSection && !urduSection.hidden;
        copyText(includeUrdu ? `English:\n${answer.english}\n\nUrdu:\n${answer.urdu}` : answer.english);
    });
    document.getElementById('toggle-urdu-btn')?.addEventListener('click', (event) => {
        const section = document.getElementById('urdu-translation-section');
        if (!section) return;
        section.hidden = !section.hidden;
        event.currentTarget.innerHTML = section.hidden
            ? '<i class="fas fa-language"></i> Show Urdu translation'
            : '<i class="fas fa-language"></i> Hide Urdu translation';
    });
}

function generateAIReply(userInput) {
    return wantsUrdu(userInput) ? createBilingualChatReply(userInput) : createEnglishChatReply(userInput);
}

function attachToolEventListeners(tool) {
    const runTool = (buttonId, inputGetter, toolName, extraGetter = () => ({})) => {
        const handleSubmit = () => {
            const input = inputGetter().trim();
            if (!input) {
                showToast("Please write something first");
                return;
            }
            renderToolLoading(toolName);
            setTimeout(() => {
                const answer = createBilingualToolAnswer(tool, input, extraGetter());
                renderToolResultPage(tool, toolName, input, answer);
                trackToolRun();
            }, 500);
        };
        document.getElementById(buttonId)?.addEventListener('click', handleSubmit);
        document.getElementById('tool-body')?.querySelectorAll('input, textarea').forEach(field => {
            field.addEventListener('keydown', (event) => {
                const isTextarea = field.tagName.toLowerCase() === 'textarea';
                if (event.key === 'Enter' && (!isTextarea || event.ctrlKey)) {
                    event.preventDefault();
                    handleSubmit();
                }
            });
        });
    };

    if (tool === 'summarizer') {
        runTool('do-summarize', () => document.getElementById('summarizer-input').value, 'Notes Summarizer');
    }
    if (tool === 'quiz') {
        runTool('gen-quiz', () => document.getElementById('quiz-topic').value, 'Quiz Generator');
    }
    if (tool === 'homework') {
        runTool('solve-hw', () => document.getElementById('hw-question').value, 'Homework Helper');
    }
    if (tool === 'planner') {
        runTool('create-plan', () => document.getElementById('subjects').value, 'Study Planner', () => ({
            hours: document.getElementById('hours').value || 2
        }));
    }
    if (tool === 'coding') {
        runTool('explain-code', () => document.getElementById('code-input').value, 'Coding Assistant');
    }
    if (tool === 'flashcards') {
        runTool('make-flashcards', () => document.getElementById('flashcard-input').value, 'Flashcards');
    }
    if (tool === 'focus') {
        const display = document.getElementById('timer-display');
        const minutesInput = document.getElementById('focus-minutes');
        const updateDisplay = () => {
            const minutes = Math.floor(focusSecondsLeft / 60).toString().padStart(2, '0');
            const seconds = (focusSecondsLeft % 60).toString().padStart(2, '0');
            display.textContent = `${minutes}:${seconds}`;
        };
        const resetTimer = () => {
            clearInterval(focusTimer);
            focusTimer = null;
            focusSecondsLeft = Math.max(5, Number(minutesInput.value || 25)) * 60;
            updateDisplay();
        };
        resetTimer();
        document.getElementById('start-focus')?.addEventListener('click', () => {
            if (focusTimer) return;
            focusTimer = setInterval(() => {
                focusSecondsLeft -= 1;
                updateDisplay();
                if (focusSecondsLeft <= 0) {
                    clearInterval(focusTimer);
                    focusTimer = null;
                    trackToolRun();
                    showToast("Focus session complete!");
                }
            }, 1000);
        });
        document.getElementById('pause-focus')?.addEventListener('click', () => {
            clearInterval(focusTimer);
            focusTimer = null;
        });
        document.getElementById('reset-focus')?.addEventListener('click', resetTimer);
        minutesInput?.addEventListener('change', resetTimer);
    }
}

// Utility
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c;
    });
}

window.copyText = function(text) {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
};

function exportCurrentChat() {
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return showToast("No chat selected");
    downloadTextFile(`${chat.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'chat'}.json`, JSON.stringify(chat, null, 2));
    showToast("Chat exported");
}

function exportAllData() {
    if (!currentUser) return;
    const payload = {
        user: currentUser,
        chats,
        toolRuns,
        exportedAt: new Date().toISOString()
    };
    downloadTextFile(`studymind-backup-${currentUser.email}.json`, JSON.stringify(payload, null, 2));
    showToast("Backup exported");
}

function importAllData(file) {
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            if (!Array.isArray(data.chats)) throw new Error("Missing chats array");
            chats = data.chats.map(chat => ({
                id: chat.id || Date.now() + Math.random(),
                title: chat.title || "Imported Chat",
                messages: Array.isArray(chat.messages) ? chat.messages : [],
                updatedAt: chat.updatedAt || new Date().toISOString()
            }));
            if (!chats.length) {
                chats = [{
                    id: Date.now(),
                    title: "Imported Chat",
                    messages: [{ role: 'assistant', content: "Backup imported. Start a new study chat when you're ready.", timestamp: new Date().toISOString() }],
                    updatedAt: new Date().toISOString()
                }];
            }
            toolRuns = Number(data.toolRuns || toolRuns || 0);
            currentChatId = chats[0]?.id || null;
            saveUserData();
            renderChatsList();
            renderCurrentChat();
            renderRecentActivity();
            renderStudyStats();
            settingsModal.style.display = 'none';
            showToast("Backup imported");
        } catch (error) {
            showToast("Could not import that backup");
            console.error(error);
        }
    };
    reader.readAsText(file);
}

// Event Listeners
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.getElementById('login-form').classList.toggle('active', target === 'login');
        document.getElementById('signup-form').classList.toggle('active', target === 'signup');
    });
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pwd = document.getElementById('login-password').value;
    handleLogin(email, pwd);
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const pwd = document.getElementById('signup-password').value;
    handleSignup(name, email, pwd);
});

logoutBtn.addEventListener('click', logout);
newChatBtn.addEventListener('click', newChat);
clearChatsBtn.addEventListener('click', clearAllChats);
profileBtn?.addEventListener('click', openProfile);
profileForm?.addEventListener('submit', saveProfile);
settingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
document.querySelector('.close-profile')?.addEventListener('click', () => profileModal.style.display = 'none');
document.querySelector('.close-settings')?.addEventListener('click', () => settingsModal.style.display = 'none');
document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => toolModal.style.display = 'none'));
clearAllDataBtn?.addEventListener('click', () => {
    if (confirm("Delete all your data? This will log you out.")) {
        if (currentUser) localStorage.removeItem(`studymind_${currentUser.email}`);
        localStorage.removeItem(`user_${currentUser?.email}`);
        logout();
        showToast("All data reset.");
    }
});
sendBtn.addEventListener('click', () => sendUserMessage(chatInput.value));
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendUserMessage(chatInput.value);
    }
});
backToDashboard.addEventListener('click', () => showDashboardView(true));
dashboardAskBtn?.addEventListener('click', askFromDashboard);
dashboardQuestion?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        askFromDashboard();
    }
});
heroNewChatBtn?.addEventListener('click', newChat);
heroFocusBtn?.addEventListener('click', () => openToolModal('focus'));
chatSearchInput?.addEventListener('input', renderCurrentChat);
exportChatBtn?.addEventListener('click', exportCurrentChat);
exportDataBtn?.addEventListener('click', exportAllData);
importDataInput?.addEventListener('change', (e) => {
    importAllData(e.target.files?.[0]);
    e.target.value = '';
});
darkModeToggle.addEventListener('change', () => {
    applyDarkMode();
    if (currentUser) saveUserData();
});

// Initial auto-check demo mode
window.addEventListener('load', () => {
    applyDarkMode();
    // If no session, show auth
    authContainer.classList.add('active');
    // Demo hint
});
