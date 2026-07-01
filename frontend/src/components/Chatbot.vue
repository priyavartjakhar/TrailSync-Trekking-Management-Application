<template>
  <div class="chatbot-container">
    <!-- Chat Trigger Button (Logo) -->
    <button 
      class="chat-trigger" 
      @click="toggleChat" 
      aria-label="Chat with Trail Mate"
      :class="{ 'pulse-active': !isOpen && unreadCount > 0 }"
    >
      <div class="custom-logo">
        <div class="mountain-peaks">
          <div class="peak back-peak"></div>
          <div class="peak front-peak"></div>
        </div>
        <div class="gold-trail"></div>
        <div class="chat-tail"></div>
      </div>
      <span class="unread-badge" v-if="!isOpen && unreadCount > 0">{{ unreadCount }}</span>
    </button>

    <!-- Chat Window -->
    <transition name="slide-fade">
      <div class="chat-window" v-if="isOpen">
        <!-- Header -->
        <div class="chat-header">
          <div class="header-left">
            <div class="header-logo">
              <div class="mountain-peaks-mini">
                <div class="peak-mini back-peak"></div>
                <div class="peak-mini front-peak"></div>
              </div>
            </div>
            <div class="header-info">
              <span class="bot-name">Trail Mate</span>
              <span class="bot-status">
                <span class="status-dot"></span> Online
              </span>
            </div>
          </div>
          <button class="close-btn" @click="toggleChat" aria-label="Close Chat">&times;</button>
        </div>

        <!-- Message History -->
        <div class="chat-messages" ref="messageBox">
          <div 
            v-for="(msg, index) in messages" 
            :key="index" 
            :class="['message-wrapper', msg.role === 'user' ? 'user-wrapper' : 'bot-wrapper']"
          >
            <div class="message-bubble" :class="msg.role">
              <!-- Render text with line breaks -->
              <span class="message-text" v-html="formatMessage(msg.text)"></span>
              <span class="message-time">{{ msg.time }}</span>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div class="message-wrapper bot-wrapper" v-if="isTyping">
            <div class="message-bubble model typing">
              <div class="dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Suggestion Chips -->
        <div class="suggestion-container" v-if="suggestions.length > 0 && !isTyping && leadState === 'idle'">
          <button 
            v-for="(s, index) in suggestions" 
            :key="index" 
            class="suggestion-chip"
            @click="selectSuggestion(s)"
          >
            {{ s }}
          </button>
        </div>

        <!-- Lead Collection Form (Conversational Overlay/Input context) -->
        <div class="lead-action-container" v-if="leadState !== 'idle'">
          <!-- If we are asking if they want the coupon/checklist -->
          <div v-if="leadState === 'ask_agree'" class="lead-agree-actions">
            <button class="btn-agree" @click="handleLeadAgree(true)">Yes, send it! 🎒</button>
            <button class="btn-deny" @click="handleLeadAgree(false)">No, thanks</button>
          </div>
        </div>

        <!-- Input Area -->
        <form class="chat-input-form" @submit.prevent="sendMessage" v-if="leadState !== 'ask_agree'">
          <input 
            v-model="inputMessage" 
            type="text" 
            :placeholder="inputPlaceholder" 
            class="chat-input"
            required
            ref="chatInputField"
          />
          <button type="submit" class="send-btn" :disabled="!inputMessage.trim() || isTyping">
            <i class="bi bi-send-fill"></i>
          </button>
        </form>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'Chatbot',
  data() {
    return {
      isOpen: false,
      isTyping: false,
      inputMessage: '',
      messages: [],
      unreadCount: 0,
      isAuthenticated: false,
      userProfile: null,
      messageCount: 0, // Count interactions for public lead gen hook
      
      // Lead Generation flow state machine
      // States: 'idle', 'ask_agree', 'ask_name', 'ask_email', 'ask_phone'
      leadState: 'idle',
      leadData: {
        name: '',
        email: '',
        phone: '',
        sourceTrek: ''
      },
      
      // Standard suggestions
      publicSuggestions: [
        '🌲 Tell me about Kedarnath Trek',
        '💀 What is Roopkund Lake Trek?',
        '🌸 Info on Valley of Flowers',
        '🎒 What packing gear do I need?'
      ],
      authSuggestions: [
        '📋 Check my booking status',
        '✅ Show my trek checklist',
        '🎫 Create a support ticket',
        '⚠️ How do I cancel a booking?'
      ]
    };
  },
  computed: {
    suggestions() {
      return this.isAuthenticated ? this.authSuggestions : this.publicSuggestions;
    },
    inputPlaceholder() {
      if (this.leadState === 'ask_name') return 'Enter your name...';
      if (this.leadState === 'ask_email') return 'Enter your email...';
      if (this.leadState === 'ask_phone') return 'Enter your mobile number...';
      return 'Ask Trail Mate...';
    }
  },
  mounted() {
    this.checkAuth();
    this.loadHistory();
    // Watch for authentication updates (local storage changes)
    window.addEventListener('storage', this.checkAuth);
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.checkAuth);
  },
  methods: {
    checkAuth() {
      const token = localStorage.getItem('ts_token') || this.getCookie('access_token');
      this.isAuthenticated = !!token;
    },
    getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return '';
    },
    loadHistory() {
      const stored = sessionStorage.getItem('ts_chat_history');
      if (stored) {
        this.messages = JSON.parse(stored);
        this.messageCount = parseInt(sessionStorage.getItem('ts_chat_msg_count') || '0');
      } else {
        // Welcoming messages
        setTimeout(() => {
          this.addWelcomeMessage();
        }, 1000);
      }
    },
    addWelcomeMessage() {
      let welcomeText = '';
      if (this.isAuthenticated) {
        welcomeText = "Hi there! I am **Trail Mate**, your personal trekking companion.\n\nI can help you list your bookings, verify your checklists, or file support tickets directly from here. What can I do for you today?";
      } else {
        welcomeText = "Greetings, explorer! I am **Trail Mate**, your TrailSync guide 🏔️\n\nAsk me anything about our upcoming treks (Kedarnath, Roopkund, Valley of Flowers), trek difficulty levels, or what gear to pack!";
      }
      this.messages.push({
        role: 'model',
        text: welcomeText,
        time: this.getCurrentTime()
      });
      this.saveHistory();
      if (!this.isOpen) {
        this.unreadCount++;
      }
    },
    saveHistory() {
      sessionStorage.setItem('ts_chat_history', JSON.stringify(this.messages));
      sessionStorage.setItem('ts_chat_msg_count', this.messageCount.toString());
    },
    getCurrentTime() {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    toggleChat() {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.unreadCount = 0;
        this.$nextTick(() => {
          this.scrollToBottom();
          if (this.$refs.chatInputField) {
            this.$refs.chatInputField.focus();
          }
        });
      }
    },
    scrollToBottom() {
      const container = this.$refs.messageBox;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    formatMessage(text) {
      if (!text) return '';
      // Escape HTML to prevent injection
      let clean = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
        
      // Bold Markdown conversion (**text** to <strong>text</strong>)
      clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Format lines
      return clean.replace(/\n/g, '<br/>');
    },
    selectSuggestion(suggestion) {
      // Strip emojis from text
      const cleanText = suggestion.replace(/[\u{1F300}-\u{1F6FF}]/gu, '').trim();
      this.inputMessage = cleanText;
      this.sendMessage();
    },
    async sendMessage() {
      const text = this.inputMessage.trim();
      if (!text) return;

      // Add user message to UI
      this.messages.push({
        role: 'user',
        text: text,
        time: this.getCurrentTime()
      });
      this.inputMessage = '';
      this.saveHistory();
      this.$nextTick(() => this.scrollToBottom());

      // If we are in the middle of lead generation, handle input in state machine
      if (this.leadState !== 'idle') {
        this.handleLeadInput(text);
        return;
      }

      this.isTyping = true;
      this.messageCount++;
      sessionStorage.setItem('ts_chat_msg_count', this.messageCount.toString());

      try {
        const token = localStorage.getItem('ts_token') || this.getCookie('access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Map messages history to backend schema
        const historyForBackend = this.messages.map(m => ({
          role: m.role,
          text: m.text
        }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ messages: historyForBackend })
        });

        const data = await response.json();
        this.isTyping = false;

        if (response.ok && data.response) {
          this.messages.push({
            role: 'model',
            text: data.response,
            time: this.getCurrentTime()
          });
          
          // Check for lead gen trigger (homepage only, after 2 interactions)
          if (!this.isAuthenticated && this.messageCount >= 2 && this.leadState === 'idle') {
            // Save potential trek interest from context
            const lowerHistory = this.messages.map(m => m.text.toLowerCase()).join(' ');
            if (lowerHistory.includes('kedarnath')) this.leadData.sourceTrek = 'Kedarnath';
            else if (lowerHistory.includes('roopkund')) this.leadData.sourceTrek = 'Roopkund';
            else if (lowerHistory.includes('valley')) this.leadData.sourceTrek = 'Valley of Flowers';
            
            setTimeout(() => {
              this.triggerLeadHook();
            }, 1200);
          }
        } else {
          this.messages.push({
            role: 'model',
            text: "I couldn't contact the server. Please check your connection.",
            time: this.getCurrentTime()
          });
        }
      } catch (err) {
        console.error("Chat error:", err);
        this.isTyping = false;
        this.messages.push({
          role: 'model',
          text: "Oops, something went wrong. Let's try again in a bit.",
          time: this.getCurrentTime()
        });
      }

      this.saveHistory();
      this.$nextTick(() => this.scrollToBottom());
    },
    
    // Lead generation flow helper functions
    triggerLeadHook() {
      this.messages.push({
        role: 'model',
        text: "By the way! 🎒 Would you like me to send you our **TrailSync PDF packing checklist** and a **10% first-time trekker discount coupon** directly to your phone/email?",
        time: this.getCurrentTime()
      });
      this.leadState = 'ask_agree';
      this.saveHistory();
      this.$nextTick(() => this.scrollToBottom());
    },
    handleLeadAgree(agree) {
      if (agree) {
        this.messages.push({
          role: 'user',
          text: "Yes, send it!",
          time: this.getCurrentTime()
        });
        this.messages.push({
          role: 'model',
          text: "Awesome! What's your **name** so I know who I'm chatting with?",
          time: this.getCurrentTime()
        });
        this.leadState = 'ask_name';
      } else {
        this.messages.push({
          role: 'user',
          text: "No thanks.",
          time: this.getCurrentTime()
        });
        this.messages.push({
          role: 'model',
          text: "No worries at all! Let me know if you have any other questions about the trails.",
          time: this.getCurrentTime()
        });
        this.leadState = 'idle';
        // Reset count so we don't prompt them again immediately
        this.messageCount = -5; 
      }
      this.saveHistory();
      this.$nextTick(() => this.scrollToBottom());
    },
    handleLeadInput(text) {
      if (this.leadState === 'ask_name') {
        this.leadData.name = text;
        this.messages.push({
          role: 'model',
          text: `Nice to meet you, **${text}**! What **email address** should I send the PDF guide and discount code to?`,
          time: this.getCurrentTime()
        });
        this.leadState = 'ask_email';
      } else if (this.leadState === 'ask_email') {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(text)) {
          this.messages.push({
            role: 'model',
            text: "Hmm, that email doesn't look quite right. Could you please double check it?",
            time: this.getCurrentTime()
          });
          this.saveHistory();
          return;
        }
        this.leadData.email = text;
        this.messages.push({
          role: 'model',
          text: "Got it! And lastly, what **mobile number** can we use to send your 10% coupon SMS code?",
          time: this.getCurrentTime()
        });
        this.leadState = 'ask_phone';
      } else if (this.leadState === 'ask_phone') {
        // Basic phone validation (at least 8 digits)
        if (text.replace(/\D/g, '').length < 8) {
          this.messages.push({
            role: 'model',
            text: "Please enter a valid phone number so we can text you the code.",
            time: this.getCurrentTime()
          });
          this.saveHistory();
          return;
        }
        this.leadData.phone = text;
        
        // Save lead to backend
        this.saveLeadToBackend();
      }
      this.saveHistory();
      this.$nextTick(() => this.scrollToBottom());
    },
    async saveLeadToBackend() {
      this.isTyping = true;
      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.leadData)
        });
        
        this.isTyping = false;
        if (response.ok) {
          this.messages.push({
            role: 'model',
            text: `Perfect, **${this.leadData.name}**! I have registered your details. Check your email and phone for the packing list and 10% discount coupon code shortly!\n\nWhat other questions can I answer for you?`,
            time: this.getCurrentTime()
          });
        } else {
          this.messages.push({
            role: 'model',
            text: "Thanks! I've noted down your preferences. Let me know if you need anything else!",
            time: this.getCurrentTime()
          });
        }
      } catch (err) {
        console.error("Save lead error:", err);
        this.isTyping = false;
        this.messages.push({
          role: 'model',
          text: "Thank you! I've saved your details. Feel free to ask more trekking questions!",
          time: this.getCurrentTime()
        });
      }
      this.leadState = 'idle';
      this.messageCount = -10; // Prevent asking again
      this.saveHistory();
      this.$nextTick(() => this.scrollToBottom());
    }
  }
};
</script>

<style scoped>
/* Color variables mapped to style.css colors */
.chatbot-container {
  --c-forest: #1a2e1a;
  --c-forest-mid: #2d4a2d;
  --c-forest-light: #3d6b3d;
  --c-gold: #c8922a;
  --c-gold-light: #e8b84b;
  --c-cream: #f5f0e8;
  --c-stone: #8c8070;
  --c-snow: #fdfaf5;
  --c-mist: #a8c5a0;
  --c-shadow: rgba(26, 46, 26, 0.25);
  
  font-family: 'DM Sans', sans-serif;
}

/* Floating trigger button */
.chat-trigger {
  position: fixed;
  bottom: 25px;
  right: 25px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--c-forest-mid) 0%, var(--c-forest) 100%);
  border: 2px solid var(--c-gold);
  cursor: pointer;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(8, 18, 8, 0.4);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.chat-trigger:hover {
  transform: scale(1.08) translateY(-3px);
  border-color: var(--c-gold-light);
  box-shadow: 0 12px 40px rgba(200, 146, 42, 0.3);
}

/* Custom CSS Logo */
.custom-logo {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.mountain-peaks {
  position: relative;
  width: 32px;
  height: 20px;
}

.peak {
  position: absolute;
  bottom: 0;
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
}

.back-peak {
  left: 1px;
  border-bottom: 15px solid var(--c-mist);
  opacity: 0.7;
}

.front-peak {
  left: 7px;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 13px solid var(--c-gold-light);
  z-index: 2;
}

.gold-trail {
  position: absolute;
  bottom: 6px;
  left: 6px;
  width: 14px;
  height: 2px;
  background: var(--c-gold);
  transform: rotate(-15deg);
  border-radius: 2px;
  z-index: 3;
}

.chat-tail {
  position: absolute;
  bottom: 0px;
  right: 6px;
  width: 0;
  height: 0;
  border-top: 6px solid var(--c-gold);
  border-left: 6px solid transparent;
  transform: rotate(15deg);
}

.unread-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: var(--c-gold-light);
  color: var(--c-forest);
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--c-forest);
  animation: popBadge 0.3s ease both;
}

@keyframes popBadge {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

.pulse-active {
  animation: pulseButton 2s infinite;
}

@keyframes pulseButton {
  0% { box-shadow: 0 0 0 0 rgba(200, 146, 42, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(200, 146, 42, 0); }
  100% { box-shadow: 0 0 0 0 rgba(200, 146, 42, 0); }
}

/* Chat Window Frame */
.chat-window {
  position: fixed;
  bottom: 95px;
  right: 25px;
  width: 380px;
  height: 520px;
  border-radius: 8px;
  background: rgba(26, 46, 26, 0.96);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(200, 146, 42, 0.25);
  box-shadow: 0 12px 48px rgba(8, 18, 8, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}

/* Header */
.chat-header {
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, var(--c-forest) 0%, var(--c-forest-mid) 100%);
  border-bottom: 2px solid var(--c-gold);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-logo {
  width: 32px;
  height: 32px;
  background: rgba(200, 146, 42, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(200, 146, 42, 0.3);
}

.mountain-peaks-mini {
  position: relative;
  width: 22px;
  height: 14px;
}

.peak-mini {
  position: absolute;
  bottom: 0;
  width: 0;
  height: 0;
}

.peak-mini.back-peak {
  left: 0px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 10px solid var(--c-mist);
  opacity: 0.8;
}

.peak-mini.front-peak {
  left: 4px;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 9px solid var(--c-gold-light);
}

.header-info {
  display: flex;
  flex-direction: column;
}

.bot-name {
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.bot-status {
  color: var(--c-mist);
  font-size: 0.72rem;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 400;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #2ecc71;
  box-shadow: 0 0 8px #2ecc71;
  display: inline-block;
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.2s;
  line-height: 1;
}

.close-btn:hover {
  color: var(--c-gold-light);
}

/* Message History Window */
.chat-messages {
  flex: 1;
  padding: 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  scroll-behavior: smooth;
}

.chat-messages::-webkit-scrollbar {
  width: 5px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--c-forest-mid);
  border-radius: 3px;
}

/* Bubbles layout */
.message-wrapper {
  display: flex;
  width: 100%;
}

.user-wrapper {
  justify-content: flex-end;
}

.bot-wrapper {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  position: relative;
  font-size: 0.88rem;
  line-height: 1.45;
  box-shadow: 0 2px 8px rgba(8, 18, 8, 0.15);
}

.message-bubble.user {
  background-color: var(--c-forest-mid);
  color: var(--c-snow);
  border: 1px solid rgba(200, 146, 42, 0.2);
  border-bottom-right-radius: 1px;
}

.message-bubble.model {
  background-color: rgba(245, 240, 232, 0.08);
  color: #fff;
  border-bottom-left-radius: 1px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.message-bubble.model strong {
  color: var(--c-gold-light);
  font-weight: 600;
}

.message-time {
  display: block;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
  text-align: right;
  margin-top: 4px;
}

/* Suggestions Container */
.suggestion-container {
  padding: 0.5rem 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(8, 18, 8, 0.2);
}

.suggestion-chip {
  padding: 0.4rem 0.8rem;
  font-size: 0.75rem;
  background: transparent;
  color: var(--c-gold-light);
  border: 1px solid rgba(200, 146, 42, 0.4);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.suggestion-chip:hover {
  background: rgba(200, 146, 42, 0.15);
  border-color: var(--c-gold-light);
  transform: translateY(-1px);
}

/* Typing Dots Animation */
.typing {
  padding: 0.85rem 1.2rem;
}

.dots {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 10px;
}

.dots span {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c-mist);
  animation: typing 1.4s infinite both;
}

.dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1.1); opacity: 1; }
}

/* Lead generation overlay actions */
.lead-action-container {
  padding: 0.75rem 1.25rem;
  background: rgba(200, 146, 42, 0.05);
  border-top: 1px solid rgba(200, 146, 42, 0.15);
}

.lead-agree-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-agree {
  padding: 0.5rem 1.25rem;
  background: var(--c-gold);
  border: none;
  border-radius: 4px;
  color: var(--c-forest);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-agree:hover {
  background: var(--c-gold-light);
  transform: translateY(-1px);
}

.btn-deny {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-deny:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

/* Input Form */
.chat-input-form {
  padding: 0.75rem 1.25rem;
  background: rgba(8, 18, 8, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chat-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(200, 146, 42, 0.2);
  border-radius: 4px;
  padding: 0.6rem 0.85rem;
  color: #fff;
  font-size: 0.88rem;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.chat-input:focus {
  border-color: var(--c-gold-light);
  background: rgba(255, 255, 255, 0.08);
}

.send-btn {
  background: var(--c-gold);
  border: none;
  border-radius: 4px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-forest);
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:disabled {
  background: rgba(200, 146, 42, 0.3);
  color: rgba(26, 46, 26, 0.5);
  cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
  background: var(--c-gold-light);
  transform: scale(1.05);
}

/* Transition Animations */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.35s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px) scale(0.95);
  opacity: 0;
}

@media (max-width: 480px) {
  .chat-window {
    width: calc(100% - 30px);
    right: 15px;
    bottom: 85px;
    height: 480px;
  }
}
</style>