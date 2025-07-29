// AI Showcase Interactive Demos

// Fraud Detection Demo
class FraudDetectionDemo {
    constructor() {
        this.model = null;
        this.features = {
            amount: 0,
            hour: 0,
            day: 0,
            merchant_risk: 0,
            distance_from_home: 0,
            unusual_category: false
        };
    }

    calculateFraudProbability() {
        // Simplified fraud detection logic based on your model
        let riskScore = 0;
        
        // Amount-based risk
        if (this.features.amount > 500) riskScore += 0.2;
        if (this.features.amount > 1000) riskScore += 0.3;
        
        // Time-based risk
        if (this.features.hour < 6 || this.features.hour > 22) riskScore += 0.15;
        
        // Weekend transactions
        if (this.features.day === 0 || this.features.day === 6) riskScore += 0.1;
        
        // Merchant risk
        riskScore += this.features.merchant_risk * 0.25;
        
        // Distance from home
        if (this.features.distance_from_home > 100) riskScore += 0.15;
        
        // Unusual category
        if (this.features.unusual_category) riskScore += 0.2;
        
        // Normalize to 0-1
        return Math.min(Math.max(riskScore, 0), 1);
    }

    updateVisualization(probability) {
        const gauge = document.getElementById('fraudGauge');
        const percentText = document.getElementById('fraudPercent');
        const riskLevel = document.getElementById('riskLevel');
        
        if (!gauge || !percentText || !riskLevel) return;
        
        const percent = Math.round(probability * 100);
        percentText.textContent = percent + '%';
        
        // Update gauge
        const rotation = probability * 180;
        gauge.style.transform = `rotate(${rotation}deg)`;
        
        // Update risk level
        let level, color;
        if (probability < 0.3) {
            level = 'Low Risk';
            color = '#10b981';
        } else if (probability < 0.7) {
            level = 'Medium Risk';
            color = '#f59e0b';
        } else {
            level = 'High Risk';
            color = '#ef4444';
        }
        
        riskLevel.textContent = level;
        riskLevel.style.color = color;
        gauge.style.backgroundColor = color;
    }
}

// LLM Chatbot Demo
class ChatbotDemo {
    constructor() {
        this.messages = [];
        this.responses = {
            greeting: [
                "Hello! I'm an AI assistant trained to help with mental health conversations. How are you feeling today?",
                "Hi there! I'm here to listen and support you. What's on your mind?",
                "Welcome! I'm your AI companion. Feel free to share what you're experiencing."
            ],
            sad: [
                "I hear that you're feeling sad. That's a valid emotion. Would you like to talk about what's causing these feelings?",
                "I'm sorry you're going through a difficult time. Sometimes talking about it can help. What's been weighing on you?",
                "It takes courage to acknowledge sadness. I'm here to listen without judgment. What's been happening?"
            ],
            anxious: [
                "Anxiety can be overwhelming. Let's work through this together. Can you describe what you're anxious about?",
                "I understand you're feeling anxious. Sometimes breaking down our worries can help. What specific thoughts are troubling you?",
                "Anxiety is challenging, but you're not alone. What situations tend to trigger these feelings for you?"
            ],
            default: [
                "Thank you for sharing that with me. Can you tell me more about how this is affecting you?",
                "I appreciate you opening up. How long have you been experiencing these feelings?",
                "That sounds challenging. What kind of support would be most helpful for you right now?"
            ]
        };
    }

    generateResponse(input) {
        const lowerInput = input.toLowerCase();
        
        if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
            return this.getRandomResponse('greeting');
        } else if (lowerInput.includes('sad') || lowerInput.includes('depressed') || lowerInput.includes('down')) {
            return this.getRandomResponse('sad');
        } else if (lowerInput.includes('anxious') || lowerInput.includes('worried') || lowerInput.includes('stress')) {
            return this.getRandomResponse('anxious');
        } else {
            return this.getRandomResponse('default');
        }
    }

    getRandomResponse(category) {
        const responses = this.responses[category];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    addMessage(content, isUser = true) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                ${content}
            </div>
            <div class="message-time">
                ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Reinforcement Learning Visualization
class RLVisualization {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.cartX = 200;
        this.cartY = 300;
        this.poleAngle = 0;
        this.poleLength = 100;
        this.animationId = null;
        this.episode = 0;
        this.timestep = 0;
        this.scores = [];
    }

    draw() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.strokeStyle = '#64748b';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 350);
        this.ctx.lineTo(400, 350);
        this.ctx.stroke();
        
        // Draw cart
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.fillRect(this.cartX - 30, this.cartY, 60, 40);
        
        // Draw wheels
        this.ctx.fillStyle = '#1e293b';
        this.ctx.beginPath();
        this.ctx.arc(this.cartX - 20, this.cartY + 40, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(this.cartX + 20, this.cartY + 40, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw pole
        const poleEndX = this.cartX + Math.sin(this.poleAngle) * this.poleLength;
        const poleEndY = this.cartY - Math.cos(this.poleAngle) * this.poleLength;
        
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(this.cartX, this.cartY);
        this.ctx.lineTo(poleEndX, poleEndY);
        this.ctx.stroke();
        
        // Draw pole end
        this.ctx.fillStyle = '#dc2626';
        this.ctx.beginPath();
        this.ctx.arc(poleEndX, poleEndY, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw stats
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = '16px Inter';
        this.ctx.fillText(`Episode: ${this.episode}`, 10, 30);
        this.ctx.fillText(`Timestep: ${this.timestep}`, 10, 50);
        
        if (this.scores.length > 0) {
            const avgScore = this.scores.slice(-10).reduce((a, b) => a + b, 0) / Math.min(this.scores.length, 10);
            this.ctx.fillText(`Avg Score (10 ep): ${avgScore.toFixed(1)}`, 10, 70);
        }
    }

    simulate() {
        // Simple physics simulation
        const gravity = 0.5;
        const cartMass = 1.0;
        const poleMass = 0.1;
        const poleLength = 1.0;
        
        // Random action (left or right)
        const action = Math.random() > 0.5 ? 1 : -1;
        const force = action * 10;
        
        // Update cart position
        this.cartX += force * 0.1;
        
        // Update pole angle (simplified physics)
        const angleAccel = (gravity * Math.sin(this.poleAngle)) / poleLength;
        this.poleAngle += angleAccel * 0.02;
        
        // Add some control to keep it somewhat balanced
        if (Math.abs(this.poleAngle) > 0.1) {
            this.poleAngle *= 0.98;
        }
        
        // Bounds checking
        if (this.cartX < 30) this.cartX = 30;
        if (this.cartX > 370) this.cartX = 370;
        
        this.timestep++;
        
        // Reset if pole falls or cart goes out of bounds
        if (Math.abs(this.poleAngle) > Math.PI / 4 || this.timestep > 500) {
            this.scores.push(this.timestep);
            this.episode++;
            this.timestep = 0;
            this.cartX = 200;
            this.poleAngle = (Math.random() - 0.5) * 0.1;
        }
    }

    start() {
        if (this.animationId) return;
        
        const animate = () => {
            this.simulate();
            this.draw();
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Initialize demos when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize fraud detection demo
    const fraudDemo = new FraudDetectionDemo();
    
    // Set up fraud detection inputs
    const fraudInputs = document.querySelectorAll('.fraud-input');
    fraudInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const field = e.target.dataset.field;
            const value = e.target.type === 'checkbox' ? e.target.checked : parseFloat(e.target.value);
            fraudDemo.features[field] = value;
            
            const probability = fraudDemo.calculateFraudProbability();
            fraudDemo.updateVisualization(probability);
        });
    });
    
    // Initialize chatbot demo
    const chatbot = new ChatbotDemo();
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    
    if (chatInput && chatSend) {
        chatSend.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message) {
                chatbot.addMessage(message, true);
                chatInput.value = '';
                
                // Simulate typing delay
                setTimeout(() => {
                    const response = chatbot.generateResponse(message);
                    chatbot.addMessage(response, false);
                }, 1000);
            }
        });
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                chatSend.click();
            }
        });
        
        // Send initial greeting
        setTimeout(() => {
            chatbot.addMessage(chatbot.getRandomResponse('greeting'), false);
        }, 500);
    }
    
    // Initialize RL visualization
    const rlViz = new RLVisualization('rlCanvas');
    const rlToggle = document.getElementById('rlToggle');
    
    if (rlToggle) {
        rlToggle.addEventListener('click', () => {
            if (rlToggle.textContent === 'Start Training') {
                rlViz.start();
                rlToggle.textContent = 'Stop Training';
                rlToggle.classList.remove('btn-primary');
                rlToggle.classList.add('btn-secondary');
            } else {
                rlViz.stop();
                rlToggle.textContent = 'Start Training';
                rlToggle.classList.remove('btn-secondary');
                rlToggle.classList.add('btn-primary');
            }
        });
    }
});