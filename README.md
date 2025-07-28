# Manuel Marin - Personal Portfolio Website

A modern, responsive portfolio website showcasing my professional experience, technical skills, and interactive game demos built with vanilla JavaScript, HTML, and CSS.

🌐 **Live Demo**: [View Portfolio](https://manuel2marin17.github.io/resume/) *(Update with your GitHub Pages URL)*

![Portfolio Preview](preview.png) *(Add a screenshot of your website)*

## ✨ Features

- **Responsive Design**: Fully responsive layout that works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between dark and light modes with persistent preference storage
- **Interactive Games Section**: Playable browser games demonstrating JavaScript skills
  - Flappy Bird
  - Penalty Kicks (Soccer)
  - Tetris
- **Smooth Animations**: CSS animations and transitions for enhanced user experience
- **Modern UI/UX**: Clean, professional design with intuitive navigation

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Icons**: Font Awesome 6.4.0
- **Fonts**: Google Fonts (Inter)
- **Games**: Canvas API for 2D graphics
- **Storage**: LocalStorage for theme and game high scores

## 📂 Project Structure

```
portfolio-website/
├── index.html          # Main HTML file
├── styles.css          # CSS styles with custom properties
├── script.js           # Main JavaScript for site functionality
├── flappy-game.js      # Flappy Bird game logic
├── soccer-game.js      # Penalty Kicks game logic
├── tetris-game.js      # Tetris game logic
├── game-manager.js     # Game selection and management
└── README.md           # Project documentation
```

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/portfolio-website.git
   cd portfolio-website
   ```

2. **Open in browser**
   - Simply open `index.html` in your web browser
   - Or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```

3. **Deploy to GitHub Pages**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Initial portfolio website"
   git push origin main
   
   # Enable GitHub Pages in repository settings
   # Select source: Deploy from branch (main)
   ```

## 🎮 Game Controls

### Flappy Bird
- **Space/Click**: Flap wings
- **Start Button**: Begin/Restart game

### Penalty Kicks
- **Mouse/Touch**: Click and drag to aim
- **Release**: Shoot the ball

### Tetris
- **Arrow Keys**: Move pieces left/right
- **Up Arrow**: Rotate piece
- **Down Arrow**: Soft drop
- **Space**: Hard drop

## 🎨 Customization

### Updating Content
- Edit the HTML in `index.html` to update:
  - Personal information
  - Work experience
  - Skills
  - Projects
  - Education

### Styling
- Modify CSS custom properties in `styles.css`:
  ```css
  :root {
    --primary-color: #2563eb;
    --secondary-color: #7c3aed;
    --accent-color: #06b6d4;
    /* ... more variables */
  }
  ```

### Adding New Games
1. Create a new game JavaScript file
2. Add game HTML structure in `index.html`
3. Register the game in `game-manager.js`

## 📱 Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contact

Manuel Marin
- Email: m2marin91@gmail.com
- Phone: 512-514-4525
- LinkedIn: [Manuel Marin](https://www.linkedin.com/in/manuel-marin-b45aa8181/)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

*Built with ❤️ by Manuel Marin*