
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatWidget = document.getElementById('bruno-chat-widget');
    const chatWindow = document.getElementById('bruno-chat-window');
    const toggleBtn = document.getElementById('bruno-chat-toggle');
    const closeBtn = document.getElementById('close-chat-btn');
    const chatBody = document.getElementById('chat-body');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');

    if (!chatWidget) return;

    // --- Toggle Logic ---
    function toggleChat() {
        chatWindow.classList.toggle('open');
        if (chatWindow.classList.contains('open')) {
            userInput.focus();
        }
    }

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    // --- Chat Logic ---

    // Integration Service
    class IntegrationService {
        constructor() {
            // Webhook para n8n específico da AI Connect
            this.n8nWebhook = "https://agente-n8n.qy9sqv.easypanel.host/webhook/chat-ai-connect";
        }

        async sendToN8n(message, sessionId) {
            console.log("Sending message to n8n:", message);

            try {
                const response = await fetch(this.n8nWebhook, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message: message, sessionId: sessionId })
                });

                if (response.ok) {
                    const jsonResponse = await response.json();
                    return jsonResponse.output || jsonResponse.text || "Desculpe, não entendi.";
                } else {
                    console.error(`HTTP Error: ${response.status}`);
                    return "Erro de conexão com o servidor.";
                }
            } catch (error) {
                console.error(`Connection Error:`, error);
                return "Erro de conexão. Verifique sua internet.";
            }
        }
    }

    const integration = new IntegrationService();

    let isTyping = false;
    // Generate a simple session ID
    const sessionId = 'session-' + Math.random().toString(36).substr(2, 9);

    function addMessage(text, sender = 'system') {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        // Security note: innerHTML used for bold formatting, ensure backend sanitizes if needed
        msgDiv.innerHTML = text;
        chatBody.appendChild(msgDiv);
        scrollToBottom();
    }

    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'system', 'typing-indicator');
        typingDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        typingDiv.id = 'typing-indicator';
        chatBody.appendChild(typingDiv);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const typingDiv = document.getElementById('typing-indicator');
        if (typingDiv) typingDiv.remove();
    }

    function scrollToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Event Listeners
    async function sendMessage() {
        const text = userInput.value.trim();
        if (text && !isTyping) {
            userInput.value = '';
            addMessage(text, 'user');

            isTyping = true;
            addTypingIndicator();

            // Send to n8n
            const reply = await integration.sendToN8n(text, sessionId);

            removeTypingIndicator();
            addMessage(reply, 'system');
            isTyping = false;
        }
    }

    // Initial Greeting
    setTimeout(() => {
        // Check if we haven't interacted yet
        if (chatBody.querySelectorAll('.message.user').length === 0) {
            // Ensure Greeting is visible if not static in HTML
            const systemMsgs = chatBody.querySelectorAll('.message.system');
            if (systemMsgs.length === 0) {
                addMessage("Olá! Sou a IA da AI Connect. Como posso ajudar você hoje?", "system");
            }
        }
    }, 500);

    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

});
