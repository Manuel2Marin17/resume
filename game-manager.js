// Game Manager - Handles game selection and switching
class GameManager {
    constructor() {
        this.gameSelector = document.querySelector('.game-selector');
        this.gameArea = document.getElementById('gameArea');
        this.backBtn = document.querySelector('.btn-back');
        this.gameCards = document.querySelectorAll('.game-card-select');
        this.gameContents = document.querySelectorAll('.game-content');
        
        this.currentGame = null;
        this.flappyBird = null;
        this.soccerGame = null;
        this.tetrisGame = null;
        
        this.init();
    }
    
    init() {
        // Add click listeners to game cards
        this.gameCards.forEach(card => {
            card.addEventListener('click', () => {
                const gameName = card.dataset.game;
                this.selectGame(gameName);
            });
        });
        
        // Back button listener
        this.backBtn.addEventListener('click', () => {
            this.showGameSelector();
        });
    }
    
    selectGame(gameName) {
        // Hide game selector
        this.gameSelector.style.display = 'none';
        this.gameArea.classList.remove('hidden');
        
        // Hide all game contents
        this.gameContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Show selected game
        const gameElement = document.getElementById(`${gameName}Game`);
        if (gameElement) {
            gameElement.classList.add('active');
            this.currentGame = gameName;
            
            // Initialize the specific game
            if (gameName === 'flappy' && !this.flappyBird) {
                this.flappyBird = new FlappyBird();
            } else if (gameName === 'soccer' && !this.soccerGame) {
                this.soccerGame = new SoccerGame();
            } else if (gameName === 'tetris' && !this.tetrisGame) {
                this.tetrisGame = new TetrisGame();
            }
        }
    }
    
    showGameSelector() {
        // Show game selector
        this.gameSelector.style.display = 'grid';
        this.gameArea.classList.add('hidden');
        
        // Stop current game if needed
        if (this.currentGame === 'flappy' && this.flappyBird) {
            this.flappyBird.gameRunning = false;
        } else if (this.currentGame === 'soccer' && this.soccerGame) {
            this.soccerGame.gameRunning = false;
        } else if (this.currentGame === 'tetris' && this.tetrisGame) {
            this.tetrisGame.gameRunning = false;
        }
        
        this.currentGame = null;
    }
}

// Initialize game manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GameManager();
});