// Tetris Game
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('tetrisCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('tetrisNext');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.startBtn = document.getElementById('tetrisStartBtn');
        this.scoreElement = document.getElementById('tetrisScore');
        this.linesElement = document.getElementById('tetrisLines');
        this.levelElement = document.getElementById('tetrisLevel');
        
        // Game constants
        this.COLS = 10;
        this.ROWS = 20;
        this.BLOCK_SIZE = 30;
        
        // Game state
        this.gameRunning = false;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        
        // Game board
        this.board = this.createBoard();
        
        // Current piece
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        
        // Next piece
        this.nextPiece = null;
        
        // Tetromino shapes
        this.shapes = {
            I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
            O: [[1,1], [1,1]],
            T: [[0,1,0], [1,1,1], [0,0,0]],
            S: [[0,1,1], [1,1,0], [0,0,0]],
            Z: [[1,1,0], [0,1,1], [0,0,0]],
            J: [[1,0,0], [1,1,1], [0,0,0]],
            L: [[0,0,1], [1,1,1], [0,0,0]]
        };
        
        // Piece colors
        this.colors = {
            I: '#00FFFF',
            O: '#FFFF00',
            T: '#800080',
            S: '#00FF00',
            Z: '#FF0000',
            J: '#0000FF',
            L: '#FFA500'
        };
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial draw
        this.drawBoard();
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.dropPiece();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case ' ':
                    e.preventDefault();
                    this.hardDrop();
                    break;
            }
        });
    }
    
    createBoard() {
        const board = [];
        for (let row = 0; row < this.ROWS; row++) {
            board.push(new Array(this.COLS).fill(0));
        }
        return board;
    }
    
    startGame() {
        this.gameRunning = true;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.board = this.createBoard();
        this.updateScore();
        
        // Generate first pieces
        this.nextPiece = this.randomPiece();
        this.spawnPiece();
        
        this.startBtn.textContent = 'Restart';
        this.lastTime = 0;
        this.gameLoop(0);
    }
    
    randomPiece() {
        const pieces = Object.keys(this.shapes);
        const piece = pieces[Math.floor(Math.random() * pieces.length)];
        return {
            shape: this.shapes[piece],
            color: this.colors[piece],
            type: piece
        };
    }
    
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.randomPiece();
        this.currentX = Math.floor((this.COLS - this.currentPiece.shape[0].length) / 2);
        this.currentY = 0;
        
        // Draw next piece preview
        this.drawNextPiece();
        
        // Check game over
        if (!this.isValidPosition(this.currentPiece.shape, this.currentX, this.currentY)) {
            this.gameOver();
        }
    }
    
    isValidPosition(piece, x, y) {
        for (let row = 0; row < piece.length; row++) {
            for (let col = 0; col < piece[row].length; col++) {
                if (piece[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.COLS || newY >= this.ROWS) {
                        return false;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    movePiece(dx, dy) {
        const newX = this.currentX + dx;
        const newY = this.currentY + dy;
        
        if (this.isValidPosition(this.currentPiece.shape, newX, newY)) {
            this.currentX = newX;
            this.currentY = newY;
            return true;
        }
        return false;
    }
    
    rotatePiece() {
        const rotated = this.rotate(this.currentPiece.shape);
        if (this.isValidPosition(rotated, this.currentX, this.currentY)) {
            this.currentPiece.shape = rotated;
        }
    }
    
    rotate(piece) {
        const N = piece.length;
        const rotated = Array(N).fill().map(() => Array(N).fill(0));
        
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                rotated[j][N - 1 - i] = piece[i][j];
            }
        }
        
        return rotated;
    }
    
    dropPiece() {
        if (!this.movePiece(0, 1)) {
            this.lockPiece();
        }
    }
    
    hardDrop() {
        while (this.movePiece(0, 1)) {
            this.score += 2;
        }
        this.lockPiece();
    }
    
    lockPiece() {
        // Add piece to board
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const boardY = this.currentY + row;
                    const boardX = this.currentX + col;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // Check for completed lines
        this.checkLines();
        
        // Spawn next piece
        this.spawnPiece();
    }
    
    checkLines() {
        let linesCleared = 0;
        
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                // Remove line
                this.board.splice(row, 1);
                // Add empty line at top
                this.board.unshift(new Array(this.COLS).fill(0));
                linesCleared++;
                row++; // Check same row again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.updateLevel();
            this.updateScore();
        }
    }
    
    calculateScore(lines) {
        const baseScores = [0, 100, 300, 500, 800];
        return baseScores[lines] * this.level;
    }
    
    updateLevel() {
        this.level = Math.floor(this.lines / 10) + 1;
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        this.linesElement.textContent = this.lines;
        this.levelElement.textContent = this.level;
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Draw game over screen
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 30);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.fillText(`Lines: ${this.lines}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
    
    update(deltaTime) {
        if (!this.gameRunning) return;
        
        this.dropCounter += deltaTime;
        
        if (this.dropCounter > this.dropInterval) {
            this.dropPiece();
            this.dropCounter = 0;
        }
    }
    
    drawBoard() {
        // Clear canvas
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                this.ctx.strokeRect(
                    col * this.BLOCK_SIZE,
                    row * this.BLOCK_SIZE,
                    this.BLOCK_SIZE,
                    this.BLOCK_SIZE
                );
            }
        }
        
        // Draw board pieces
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(col, row, this.board[row][col]);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            for (let row = 0; row < this.currentPiece.shape.length; row++) {
                for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                    if (this.currentPiece.shape[row][col]) {
                        this.drawBlock(
                            this.currentX + col,
                            this.currentY + row,
                            this.currentPiece.color
                        );
                    }
                }
            }
        }
    }
    
    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.BLOCK_SIZE,
            y * this.BLOCK_SIZE,
            this.BLOCK_SIZE - 2,
            this.BLOCK_SIZE - 2
        );
        
        // Add highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(
            x * this.BLOCK_SIZE,
            y * this.BLOCK_SIZE,
            this.BLOCK_SIZE - 2,
            4
        );
    }
    
    drawNextPiece() {
        // Clear next piece canvas
        this.nextCtx.fillStyle = '#222';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
        const blockSize = 25;
        const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
        
        for (let row = 0; row < this.nextPiece.shape.length; row++) {
            for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                if (this.nextPiece.shape[row][col]) {
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(
                        offsetX + col * blockSize,
                        offsetY + row * blockSize,
                        blockSize - 2,
                        blockSize - 2
                    );
                    
                    // Add highlight
                    this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    this.nextCtx.fillRect(
                        offsetX + col * blockSize,
                        offsetY + row * blockSize,
                        blockSize - 2,
                        4
                    );
                }
            }
        }
    }
    
    gameLoop(time) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.update(deltaTime);
        this.drawBoard();
        
        if (this.gameRunning) {
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }
}