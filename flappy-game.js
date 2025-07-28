// Flappy Bird Game
class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('flappyCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.startBtn = document.getElementById('startBtn');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('bestScore');
        
        // Game state
        this.gameRunning = false;
        this.score = 0;
        this.bestScore = localStorage.getItem('flappyBestScore') || 0;
        this.bestScoreElement.textContent = this.bestScore;
        
        // Bird properties
        this.bird = {
            x: 50,
            y: this.canvas.height / 2,
            radius: 20,
            velocity: 0,
            gravity: 0.4,  // Reduced from 0.6 - less fall speed
            jump: -8,      // Reduced from -10 - smaller jumps for better control
            color: '#FFD700'
        };
        
        // Pipe properties
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 200;     // Increased from 150 - bigger gap between pipes
        this.pipeSpeed = 2;     // Reduced from 3 - slower pipe movement
        this.pipeInterval = 120; // Increased from 90 - more space between pipes
        this.frameCount = 0;
        
        // Cloud properties
        this.clouds = [];
        this.initClouds();
        
        // Event listeners
        this.setupEventListeners();
        
        // Initial draw
        this.draw();
    }
    
    setupEventListeners() {
        // Start button
        this.startBtn.addEventListener('click', () => this.startGame());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameRunning) {
                e.preventDefault();
                this.flap();
            }
        });
        
        // Touch/click controls
        this.canvas.addEventListener('click', () => {
            if (this.gameRunning) {
                this.flap();
            }
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameRunning) {
                this.flap();
            }
        });
    }
    
    initClouds() {
        // Initialize some clouds
        for (let i = 0; i < 3; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height * 0.5),
                width: 80 + Math.random() * 40,
                height: 40,
                speed: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.score = 0;
        this.scoreElement.textContent = this.score;
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.pipes = [];
        this.frameCount = 0;
        this.startBtn.textContent = 'Restart';
        this.gameLoop();
    }
    
    flap() {
        this.bird.velocity = this.bird.jump;
    }
    
    update() {
        if (!this.gameRunning) return;
        
        // Update bird
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // Update pipes
        this.frameCount++;
        if (this.frameCount % this.pipeInterval === 0) {
            this.createPipe();
        }
        
        this.pipes = this.pipes.filter(pipe => {
            pipe.x -= this.pipeSpeed;
            
            // Score when pipe passes bird
            if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.passed = true;
                this.score++;
                this.scoreElement.textContent = this.score;
            }
            
            return pipe.x + this.pipeWidth > 0;
        });
        
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width;
                cloud.y = Math.random() * (this.canvas.height * 0.5);
            }
        });
        
        // Check collisions
        if (this.checkCollision()) {
            this.gameOver();
        }
    }
    
    createPipe() {
        const minHeight = 50;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight - 100; // Leave ground space
        const topHeight = minHeight + Math.random() * (maxHeight - minHeight);
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            passed: false
        });
    }
    
    checkCollision() {
        // Ground and ceiling collision
        if (this.bird.y - this.bird.radius < 0 || 
            this.bird.y + this.bird.radius > this.canvas.height - 70) {
            return true;
        }
        
        // Pipe collision
        for (let pipe of this.pipes) {
            if (this.bird.x + this.bird.radius > pipe.x && 
                this.bird.x - this.bird.radius < pipe.x + this.pipeWidth) {
                if (this.bird.y - this.bird.radius < pipe.topHeight || 
                    this.bird.y + this.bird.radius > pipe.bottomY) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreElement.textContent = this.bestScore;
            localStorage.setItem('flappyBestScore', this.bestScore);
        }
        
        // Show game over message
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 40);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        
        if (this.score > this.bestScore - this.score) {
            this.ctx.fillText('New Best Score!', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#87CEEB');
        gradient.addColorStop(0.7, '#98D98E');
        gradient.addColorStop(1, '#98D98E');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw clouds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(cloud => {
            this.drawCloud(cloud.x, cloud.y, cloud.width, cloud.height);
        });
        
        // Draw ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.canvas.height - 70, this.canvas.width, 70);
        
        // Draw grass
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.canvas.height - 70, this.canvas.width, 20);
        
        // Draw pipes
        this.ctx.fillStyle = '#2E7D32';
        this.pipes.forEach(pipe => {
            // Top pipe
            this.drawPipe(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            // Bottom pipe
            this.drawPipe(pipe.x, pipe.bottomY, this.pipeWidth, this.canvas.height - pipe.bottomY - 70);
        });
        
        // Draw bird
        this.drawBird();
    }
    
    drawCloud(x, y, width, height) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, height / 2, 0, Math.PI * 2);
        this.ctx.arc(x + width / 3, y - height / 4, height / 2.5, 0, Math.PI * 2);
        this.ctx.arc(x + width / 1.5, y, height / 2.2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawPipe(x, y, width, height) {
        // Pipe body
        this.ctx.fillRect(x, y, width, height);
        
        // Pipe cap
        this.ctx.fillStyle = '#1B5E20';
        if (y === 0) {
            // Top pipe cap
            this.ctx.fillRect(x - 5, height - 30, width + 10, 30);
        } else {
            // Bottom pipe cap
            this.ctx.fillRect(x - 5, y, width + 10, 30);
        }
        this.ctx.fillStyle = '#2E7D32';
    }
    
    drawBird() {
        this.ctx.save();
        this.ctx.translate(this.bird.x, this.bird.y);
        
        // Rotate bird based on velocity
        const rotation = Math.min(Math.max(this.bird.velocity * 0.08, -0.5), 0.5);
        this.ctx.rotate(rotation);
        
        // Bird body
        this.ctx.fillStyle = this.bird.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.bird.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird eye
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(8, -5, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(10, -5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird beak
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(25, 3);
        this.ctx.lineTo(15, 6);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Bird wing
        this.ctx.fillStyle = '#FFB700';
        this.ctx.beginPath();
        this.ctx.ellipse(-5, 5, 12, 8, -0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        if (this.gameRunning) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Game will be initialized by GameManager when selected