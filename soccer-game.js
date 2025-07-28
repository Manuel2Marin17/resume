// Soccer Penalty Kick Game
class SoccerGame {
    constructor() {
        this.canvas = document.getElementById('soccerCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.startBtn = document.getElementById('soccerStartBtn');
        this.goalsElement = document.getElementById('soccerGoals');
        this.missesElement = document.getElementById('soccerMisses');
        
        // Game state
        this.gameRunning = false;
        this.goals = 0;
        this.misses = 0;
        this.shotInProgress = false;
        
        // Ball properties
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            radius: 10,
            vx: 0,
            vy: 0,
            startX: this.canvas.width / 2,
            startY: this.canvas.height - 100
        };
        
        // Goal properties
        this.goal = {
            x: this.canvas.width / 2 - 100,
            y: 50,
            width: 200,
            height: 120,
            postWidth: 10
        };
        
        // Goalkeeper properties
        this.keeper = {
            x: this.canvas.width / 2,
            y: this.goal.y + this.goal.height - 40,
            width: 40,
            height: 60,
            speed: 2,
            direction: 1,
            diveRange: 60,
            diving: false,
            diveDirection: 0
        };
        
        // Aiming properties
        this.aiming = false;
        this.aimStart = { x: 0, y: 0 };
        this.aimEnd = { x: 0, y: 0 };
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial draw
        this.draw();
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        
        // Mouse controls for aiming
        this.canvas.addEventListener('mousedown', (e) => this.startAim(e));
        this.canvas.addEventListener('mousemove', (e) => this.updateAim(e));
        this.canvas.addEventListener('mouseup', (e) => this.shoot(e));
        
        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.startAim(mouseEvent);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.updateAim(mouseEvent);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.shoot();
        });
    }
    
    startGame() {
        this.gameRunning = true;
        this.goals = 0;
        this.misses = 0;
        this.goalsElement.textContent = this.goals;
        this.missesElement.textContent = this.misses;
        this.resetBall();
        this.startBtn.textContent = 'Restart';
        this.gameLoop();
    }
    
    startAim(e) {
        if (!this.gameRunning || this.shotInProgress) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.aiming = true;
        this.aimStart.x = e.clientX - rect.left;
        this.aimStart.y = e.clientY - rect.top;
        this.aimEnd.x = this.aimStart.x;
        this.aimEnd.y = this.aimStart.y;
    }
    
    updateAim(e) {
        if (!this.aiming) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.aimEnd.x = e.clientX - rect.left;
        this.aimEnd.y = e.clientY - rect.top;
    }
    
    shoot() {
        if (!this.aiming || this.shotInProgress) return;
        
        this.aiming = false;
        this.shotInProgress = true;
        
        // Calculate shot power and direction
        const dx = this.aimStart.x - this.aimEnd.x;
        const dy = this.aimStart.y - this.aimEnd.y;
        
        // Limit maximum power
        const maxPower = 20;
        const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, maxPower);
        
        this.ball.vx = (dx / 10) * power / maxPower;
        this.ball.vy = (dy / 10) * power / maxPower;
        
        // Make goalkeeper react
        if (Math.random() < 0.7) { // 70% chance keeper tries to save
            this.keeper.diving = true;
            this.keeper.diveDirection = this.ball.vx > 0 ? 1 : -1;
        }
    }
    
    update() {
        if (!this.gameRunning) return;
        
        // Update goalkeeper movement
        if (!this.keeper.diving && !this.shotInProgress) {
            this.keeper.x += this.keeper.speed * this.keeper.direction;
            
            // Bounce off goal posts
            if (this.keeper.x <= this.goal.x + this.goal.postWidth + this.keeper.width / 2 ||
                this.keeper.x >= this.goal.x + this.goal.width - this.goal.postWidth - this.keeper.width / 2) {
                this.keeper.direction *= -1;
            }
        }
        
        // Update keeper dive
        if (this.keeper.diving) {
            const diveSpeed = 5;
            const targetX = this.keeper.x + (this.keeper.diveDirection * this.keeper.diveRange);
            
            if (Math.abs(this.keeper.x - targetX) > diveSpeed) {
                this.keeper.x += diveSpeed * this.keeper.diveDirection;
            } else {
                this.keeper.diving = false;
            }
        }
        
        // Update ball
        if (this.shotInProgress) {
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            
            // Add gravity effect
            this.ball.vy += 0.3;
            
            // Ball friction
            this.ball.vx *= 0.99;
            this.ball.vy *= 0.99;
            
            // Check for goal
            if (this.ball.y < this.goal.y + this.goal.height && 
                this.ball.x > this.goal.x && 
                this.ball.x < this.goal.x + this.goal.width &&
                this.ball.y > this.goal.y) {
                
                // Check if keeper saves it
                const keeperLeft = this.keeper.x - this.keeper.width / 2;
                const keeperRight = this.keeper.x + this.keeper.width / 2;
                const keeperTop = this.keeper.y;
                const keeperBottom = this.keeper.y + this.keeper.height;
                
                if (this.ball.x > keeperLeft && this.ball.x < keeperRight &&
                    this.ball.y > keeperTop && this.ball.y < keeperBottom) {
                    // Saved!
                    this.ball.vx *= -0.5;
                    this.ball.vy *= -0.5;
                } else if (this.ball.y < this.goal.y + 20) {
                    // Goal!
                    this.goals++;
                    this.goalsElement.textContent = this.goals;
                    setTimeout(() => this.resetBall(), 1500);
                }
            }
            
            // Check if ball is out of bounds
            if (this.ball.x < -50 || this.ball.x > this.canvas.width + 50 ||
                this.ball.y < -50 || this.ball.y > this.canvas.height + 50) {
                this.misses++;
                this.missesElement.textContent = this.misses;
                setTimeout(() => this.resetBall(), 1000);
            }
            
            // Stop ball if it's moving very slowly
            if (Math.abs(this.ball.vx) < 0.1 && Math.abs(this.ball.vy) < 0.1 && this.ball.y > this.canvas.height - 110) {
                this.resetBall();
            }
        }
    }
    
    resetBall() {
        this.ball.x = this.ball.startX;
        this.ball.y = this.ball.startY;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.shotInProgress = false;
        this.keeper.diving = false;
        this.keeper.x = this.canvas.width / 2;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw field
        this.drawField();
        
        // Draw goal
        this.drawGoal();
        
        // Draw goalkeeper
        this.drawKeeper();
        
        // Draw ball
        this.drawBall();
        
        // Draw aiming line
        if (this.aiming) {
            this.drawAimLine();
        }
    }
    
    drawField() {
        // Green field
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Field lines
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        
        // Penalty box
        const boxWidth = 300;
        const boxHeight = 150;
        this.ctx.strokeRect(
            this.canvas.width / 2 - boxWidth / 2,
            0,
            boxWidth,
            boxHeight
        );
        
        // Penalty spot
        this.ctx.beginPath();
        this.ctx.arc(this.ball.startX, this.ball.startY, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
    }
    
    drawGoal() {
        this.ctx.fillStyle = 'white';
        
        // Goal posts
        this.ctx.fillRect(this.goal.x, this.goal.y, this.goal.postWidth, this.goal.height);
        this.ctx.fillRect(this.goal.x + this.goal.width - this.goal.postWidth, this.goal.y, this.goal.postWidth, this.goal.height);
        
        // Crossbar
        this.ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.postWidth);
        
        // Goal net
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        
        // Vertical net lines
        for (let x = this.goal.x + 20; x < this.goal.x + this.goal.width; x += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.goal.y);
            this.ctx.lineTo(x, this.goal.y + this.goal.height);
            this.ctx.stroke();
        }
        
        // Horizontal net lines
        for (let y = this.goal.y + 20; y < this.goal.y + this.goal.height; y += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.goal.x, y);
            this.ctx.lineTo(this.goal.x + this.goal.width, y);
            this.ctx.stroke();
        }
    }
    
    drawKeeper() {
        this.ctx.fillStyle = '#FF6B35';
        
        // Body
        this.ctx.fillRect(
            this.keeper.x - this.keeper.width / 2,
            this.keeper.y,
            this.keeper.width,
            this.keeper.height
        );
        
        // Head
        this.ctx.beginPath();
        this.ctx.arc(this.keeper.x, this.keeper.y - 10, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Gloves
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(
            this.keeper.x - this.keeper.width / 2 - 5,
            this.keeper.y + 20,
            10,
            15
        );
        this.ctx.fillRect(
            this.keeper.x + this.keeper.width / 2 - 5,
            this.keeper.y + 20,
            10,
            15
        );
    }
    
    drawBall() {
        // Ball shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(this.ball.x, this.canvas.height - 90, this.ball.radius * 1.5, this.ball.radius * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ball
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ball pattern
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawAimLine() {
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.ball.x, this.ball.y);
        
        // Draw predicted path
        const dx = this.aimStart.x - this.aimEnd.x;
        const dy = this.aimStart.y - this.aimEnd.y;
        const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, 20);
        
        this.ctx.lineTo(this.ball.x + dx * 2, this.ball.y + dy * 2);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
    
    gameLoop() {
        this.update();
        this.draw();
        
        if (this.gameRunning) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}