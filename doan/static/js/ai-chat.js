// js/ai-chat.js - UPGRADED MI AI WIDGET

class AIChatWidget {
    constructor() {
        this.chatWindow = document.getElementById('chat-window');
        this.chatToggleButton = document.getElementById('chat-toggle-button');
        this.chatMessagesContainer = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatSendButton = document.getElementById('chat-send-button');
        this.chatCloseButton = document.getElementById('chat-close-button');
        
        this.isTyping = false;
        this.messageHistory = JSON.parse(localStorage.getItem('aiChatHistory')) || [];
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeChat();
        this.loadChatHistory();
        this.addWelcomeMessage();
        this.updateHeaderTitle();
    }
    
    updateHeaderTitle() {
        const titleSpan = this.chatWindow.querySelector('#chat-header span');
        if (titleSpan) {
            titleSpan.innerHTML = '<i class="fa fa-robot"></i> MI AI';
        }
    }

    setupEventListeners() {
        if (this.chatToggleButton) this.chatToggleButton.addEventListener('click', () => this.toggleChat());
        if (this.chatCloseButton) this.chatCloseButton.addEventListener('click', () => this.closeChat());
        if (this.chatSendButton) this.chatSendButton.addEventListener('click', () => this.sendMessage());
        
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            this.chatInput.addEventListener('input', () => this.handleInputChange());
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.chatWindow.classList.contains('hidden')) {
                this.closeChat();
            }
        });
    }
    
    initializeChat() {
        if (this.chatWindow && this.chatToggleButton) {
            this.chatWindow.classList.add('hidden');
            this.chatToggleButton.classList.remove('hidden');
        }
    }
    
    toggleChat() {
        if (this.chatWindow.classList.contains('hidden')) {
            this.openChat();
        } else {
            this.closeChat();
        }
    }
    
    openChat() {
        this.chatWindow.classList.remove('hidden');
        this.chatToggleButton.classList.add('hidden');
        setTimeout(() => { if (this.chatInput) this.chatInput.focus(); }, 300);
    }
    
    closeChat() {
        this.chatWindow.classList.add('hidden');
        this.chatToggleButton.classList.remove('hidden');
        this.saveChatHistory();
    }
    
    handleInputChange() {
        const isEmpty = this.chatInput.value.trim() === '';
        if (this.chatSendButton) {
            this.chatSendButton.disabled = isEmpty || this.isTyping;
            this.chatSendButton.style.opacity = isEmpty || this.isTyping ? '0.6' : '1';
        }
    }
    
    async sendMessage() {
        const messageText = this.chatInput.value.trim();
        if (messageText === "" || this.isTyping) return;
        
        this.setInputState(false);
        this.addMessage(messageText, 'user');
        this.chatInput.value = "";
        this.messageHistory.push({ type: 'user', content: messageText, timestamp: Date.now() });
        
        const typingId = this.showTypingIndicator();
        
        try {
            const response = await this.callAIAPI(messageText);
            this.removeTypingIndicator(typingId);
            this.addMessage(response, 'ai');
            this.messageHistory.push({ type: 'ai', content: response, timestamp: Date.now() });
        } catch (error) {
            this.removeTypingIndicator(typingId);
            this.addMessage("Xin lỗi, MI AI đang gặp chút sự cố kết nối. Thử lại sau nhé!", 'ai-error');
        } finally {
            this.setInputState(true);
        }
    }
    
    async callAIAPI(message) {
        try {
            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });
            const data = await response.json();
            return data.reply || 'Xin lỗi, tôi không thể trả lời lúc này.';
        } catch (e) { throw e; }
    }
    
    addMessage(message, type) {
        if (!this.chatMessagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type === 'user' ? 'user-message' : 'ai-message');
        
        if (type === 'ai') {
            messageDiv.innerHTML = this.formatAIMessage(message);
        } else {
            messageDiv.textContent = message;
        }
        
        this.chatMessagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatAIMessage(message) {
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }
    
    addWelcomeMessage() {
        if (this.messageHistory.length === 0) {
            const welcome = "Xin chào! Tôi là **MI AI** - Trợ lý mua sắm thông minh. Bạn cần tìm điện thoại hãng nào hay máy tầm giá bao nhiêu ạ?";
            this.addMessage(welcome, 'ai');
            this.messageHistory.push({ type: 'ai', content: welcome, timestamp: Date.now() });
            this.addQuickSuggests();
        }
    }

    addQuickSuggests() {
        const suggestDiv = document.createElement('div');
        suggestDiv.classList.add('quick-suggest');
        const suggests = [
            { text: "📱 iPhone", val: "Tìm iPhone" },
            { text: "🔥 Samsung", val: "Samsung hot" },
            { text: "💰 Máy rẻ", val: "Giá rẻ nhất" },
            { text: "📦 Đơn hàng", val: "Đơn hàng" }
        ];

        suggests.forEach(s => {
            const chip = document.createElement('div');
            chip.classList.add('suggest-chip');
            chip.textContent = s.text;
            chip.onclick = () => this.sendCustomMessage(s.val);
            suggestDiv.appendChild(chip);
        });

        this.chatMessagesContainer.appendChild(suggestDiv);
        this.scrollToBottom();
    }

    sendCustomMessage(msg) {
        this.chatInput.value = msg;
        this.sendMessage();
    }

    showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.classList.add('message', 'ai-message', 'typing-indicator');
        div.innerHTML = `<span class="typing-text">MI AI đang tìm kiếm...</span>`;
        this.chatMessagesContainer.appendChild(div);
        this.scrollToBottom();
        this.isTyping = true;
        return id;
    }
    
    removeTypingIndicator(id) {
        const div = document.getElementById(id);
        if (div) div.remove();
        this.isTyping = false;
    }
    
    setInputState(enabled) {
        if (this.chatInput) this.chatInput.disabled = !enabled;
        if (this.chatSendButton) this.chatSendButton.disabled = !enabled;
    }
    
    scrollToBottom() {
        if (this.chatMessagesContainer) {
            this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
        }
    }
    
    loadChatHistory() {
        this.messageHistory.slice(-10).forEach(msg => this.addMessage(msg.content, msg.type));
    }
    
    saveChatHistory() {
        localStorage.setItem('aiChatHistory', JSON.stringify(this.messageHistory.slice(-50)));
    }
}

window.initAIChatWidget = function () {
    if (window.aiChat || !document.getElementById('ai-chat-widget')) return;
    window.aiChat = new AIChatWidget();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initAIChatWidget);
} else {
    window.initAIChatWidget();
}
