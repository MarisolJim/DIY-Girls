// ==============================================
// STUDENTS: This is where the AI magic happens!
// You don't need to modify this code, but you can
// read through it to understand how it works.
// ==============================================

// ==============================================
// CONNECTION SETTING — paste your proxy URL here once.
// The secret API key lives on the proxy server, never in
// this file, so nobody using the page can see it.
// ==============================================
const PROXY_URL = "https://diy-girls-bot.jimenezmarisol8884.workers.dev";

let conversationHistory = [];

// Initialize the chat with welcome message
function initialize() {
    const welcomeMsg = document.getElementById('welcomeMessage').value;
    addMessage('system', 'Assistant initialized! Click "Send" to start chatting.');
    addMessage('assistant', welcomeMsg);
}

// Add a message to the chat
function addMessage(type, content) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    if (type === 'assistant' && window.marked) {
        // Format the reply (bold, lists, etc.) if the markdown library loaded.
        messageDiv.innerHTML = marked.parse(content);
    } else {
        // Fallback: if the library didn't load (e.g. a blocked network),
        // just show the text plainly so the bot still works.
        messageDiv.textContent = content;
    }
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Send a message to the AI
async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();

    if (!message) return;

    // Make sure the proxy has been set up.
    if (!PROXY_URL) {
        addMessage('system', 'Not connected yet: paste your proxy URL into PROXY_URL near the top of the script.');
        return;
    }

    // Disable input while processing
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    input.disabled = true;

    // Add user message to chat
    addMessage('user', message);
    input.value = '';

    // Add to conversation history
    conversationHistory.push({
        role: 'user',
        content: message
    });

    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant';
    loadingDiv.innerHTML = '<span class="loading"></span> Thinking...';
    document.getElementById('messages').appendChild(loadingDiv);

    try {
        // Get the system prompt
        const systemPrompt = document.getElementById('systemPrompt').value;

        // Send the message to the proxy. The proxy adds the secret
        // API key on its end and forwards the request to Claude.
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 1000,
                system: systemPrompt,
                messages: conversationHistory
            })
        });

        // Remove loading indicator
        loadingDiv.remove();

        if (!response.ok) {
            let friendly = `Something went wrong (error ${response.status}).`;
            if (response.status === 401 || response.status === 403) {
                friendly = "The server couldn't sign in to Claude — check the API key on your proxy.";
            } else if (response.status === 429) {
                friendly = "Too many messages right now. Wait a few seconds and try again.";
            } else if (response.status >= 500) {
                friendly = "Claude is having trouble right now. Try again in a moment.";
            }
            throw new Error(friendly);
        }

        const data = await response.json();
        const assistantMessage = data.content[0].text;

        // Add assistant response to chat and history
        addMessage('assistant', assistantMessage);
        conversationHistory.push({
            role: 'assistant',
            content: assistantMessage
        });

    } catch (error) {
        loadingDiv.remove();
        const msg = /fetch/i.test(error.message)
            ? "Can't reach the server. Check your internet, or that the proxy URL is correct."
            : error.message;
        addMessage('system', msg);
        console.error('Error:', error);
    }

    // Re-enable input
    sendBtn.disabled = false;
    input.disabled = false;
    input.focus();
}

// Initialize when page loads
window.onload = initialize;
