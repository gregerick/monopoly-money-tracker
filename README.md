# Money Transfer Game

A simple static web application for managing money transfers between players.

## Project Structure

```
momoney/
├── README.md           # Project documentation (this file)
├── .gitignore         # Git ignore file for version control
├── index.html         # Main HTML page structure
├── css/
│   └── style.css      # CSS styling for the interface
├── js/
│   └── app.js         # JavaScript application logic
└── assets/            # Static assets (images, icons, etc.)
```

## Features

- **Player Cards**: 4 player profiles with starting balance of $1000
- **Money Transfer**: Click a player card to initiate transfer, select "Pays" or "Receives", then select target player
- **Persistent Storage**: Game state saved in browser localStorage
- **Save/Load System**: Download game state as file, upload to restore sessions
- **Reset Functionality**: Reset all players to starting balance

## Local Development

Since this is a static website, you can run it locally using any of these methods:

### Method 1: Using Python (Recommended)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Method 2: Using Node.js
```bash
npx serve .
```

### Method 3: Using VS Code Live Server
If you're using VS Code, install the "Live Server" extension and right-click `index.html` → "Open with Live Server"

After starting any of these servers, open your browser to `http://localhost:8000`

## Deployment to Netlify

This project is optimized for Netlify deployment using Windsurf App Deploys:

1. **Connect Repository**: Link your Git repository to Netlify
2. **Build Settings**: No build step needed (static site)
3. **Publish Directory**: `.` (root directory)
4. **Deploy**: Netlify will automatically deploy when you push changes

## Browser Compatibility

- Modern browsers with ES6+ support
- localStorage support required for persistence
- Responsive design works on mobile and desktop

## Game Rules

- Each player starts with $1000
- Click a player card to start a transfer
- Choose whether they "Pay" or "Receive" money
- Click the second player to complete the transfer
- All transfers are instant
- Game state persists between sessions
