// Game state management
class MoneyTransferGame {
    constructor() {
        this.players = [
            { id: 1, name: 'Player 1', balance: 1500, color: '#ff6b6b' },
            { id: 2, name: 'Player 2', balance: 1500, color: '#4ecdc4' },
            { id: 3, name: 'Player 3', balance: 1500, color: '#45b7d1' },
            { id: 4, name: 'Player 4', balance: 1500, color: '#f9ca24' }
        ];
        
        this.selectedPlayer = null;
        this.transferType = null;
        this.transferAmount = 0;
        this.currentTarget = null;
        this.freeParkingBalance = 0;
        this.transactionHistory = [];
        
        this.initializeEventListeners();
        this.loadGameState();
        this.updateUI();
    }
    
    // Initialize all event listeners
    initializeEventListeners() {
        // Player card clicks
        document.querySelectorAll('.player-card').forEach(card => {
            card.addEventListener('click', (e) => this.handlePlayerClick(e));
        });
        
        // Control buttons
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveGame());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadGameFile());
        document.getElementById('loadFile').addEventListener('change', (e) => this.handleFileLoad(e));
        
        // New action buttons
        document.getElementById('editPlayersBtn').addEventListener('click', () => this.showEditPlayersModal());
        document.getElementById('historyBtn').addEventListener('click', () => this.showHistoryModal());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoLastTransaction());
        document.getElementById('passGoBtn').addEventListener('click', () => this.passGo());
        
        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => this.closeTransferModal());
        document.getElementById('closeEditModal').addEventListener('click', () => this.closeEditPlayersModal());
        document.getElementById('closeHistoryModal').addEventListener('click', () => this.closeHistoryModal());
        
        // Edit players modal controls
        document.getElementById('savePlayerNames').addEventListener('click', () => this.savePlayerNames());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeEditPlayersModal());
        
        // History modal controls
        document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());
        document.getElementById('closeHistory').addEventListener('click', () => this.closeHistoryModal());
        
        // Transfer type buttons
        document.getElementById('paysBtn').addEventListener('click', () => this.selectTransferType('pays'));
        document.getElementById('receivesBtn').addEventListener('click', () => this.selectTransferType('receives'));
        
        // Amount confirmation
        document.getElementById('confirmAmount').addEventListener('click', () => this.confirmAmount());
        
        // Back button
        document.getElementById('backBtn').addEventListener('click', () => this.goBackToTransferType());
        
        // Keypad buttons
        document.querySelectorAll('.keypad-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleKeypadPress(e));
        });
        
        // Close modal on outside click
        document.getElementById('transferModal').addEventListener('click', (e) => {
            if (e.target.id === 'transferModal') this.closeTransferModal();
        });
        
        // Amount input enter key - removed since input is now readonly
    }
    
    // Handle player card clicks
    handlePlayerClick(e) {
        const card = e.currentTarget;
        const playerId = parseInt(card.dataset.playerId);
        const player = this.players.find(p => p.id === playerId);
        
        if (document.getElementById('transferModal').classList.contains('show') && 
            document.getElementById('targetSection').style.display !== 'none') {
            // We're in target selection mode
            this.handleTargetSelection(player);
        } else {
            // Start new transfer
            this.selectedPlayer = player;
            this.showTransferModal();
        }
    }
    
    // Show transfer modal
    showTransferModal() {
        const modal = document.getElementById('transferModal');
        const playerName = document.getElementById('selectedPlayerName');
        
        playerName.textContent = this.selectedPlayer.name;
        modal.classList.add('show');
        
        // Reset modal state to step 1
        this.resetModalSteps();
        
        // Highlight selected player
        document.querySelectorAll('.player-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-player-id="${this.selectedPlayer.id}"]`).classList.add('selected');
    }
    
    // Close transfer modal
    closeTransferModal() {
        document.getElementById('transferModal').classList.remove('show');
        document.querySelectorAll('.player-card').forEach(card => {
            card.classList.remove('selected', 'target-mode');
        });
        this.resetModalSteps();
        this.selectedPlayer = null;
        this.transferType = null;
        this.currentTarget = null;
    }
    
    resetModalSteps() {
        // Hide all sections and show step 1
        document.getElementById('transferTypeSection').style.display = 'block';
        document.getElementById('amountSection').style.display = 'none';
        document.getElementById('targetSection').style.display = 'none';
        document.getElementById('backBtn').style.display = 'none';
        this.transferType = null;
        this.currentTarget = null;
    }
    
    // Select transfer type
    selectTransferType(type) {
        this.transferType = type;
        // Move to step 2: amount input
        document.getElementById('transferTypeSection').style.display = 'none';
        document.getElementById('amountSection').style.display = 'block';
        document.getElementById('backBtn').style.display = 'inline-block';
        document.getElementById('passGoBtn').style.display = 'inline-block';
        // Reset amount input
        document.getElementById('transferAmount').value = '0';
    }
    
    // Go back to transfer type selection
    goBackToTransferType() {
        document.getElementById('amountSection').style.display = 'none';
        document.getElementById('transferTypeSection').style.display = 'block';
        document.getElementById('backBtn').style.display = 'none';
        document.getElementById('passGoBtn').style.display = 'none';
        this.transferType = null;
    }
    
    // Handle keypad button presses
    handleKeypadPress(e) {
        const btn = e.target;
        const amountInput = document.getElementById('transferAmount');
        const currentValue = amountInput.value;
        
        if (btn.dataset.action === 'clear') {
            // Clear the input
            amountInput.value = '0';
        } else if (btn.dataset.value) {
            // Append the digit
            const newValue = currentValue === '0' ? btn.dataset.value : currentValue + btn.dataset.value;
            // Prevent extremely large numbers
            if (parseInt(newValue) <= 99999) {
                amountInput.value = newValue;
            }
        }
    }
    
    // Confirm transfer amount
    confirmAmount() {
        const amountInput = document.getElementById('transferAmount');
        this.transferAmount = parseInt(amountInput.value);
        
        if (isNaN(this.transferAmount) || this.transferAmount < 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        if (this.transferAmount === 0) {
            alert('Please enter an amount greater than 0');
            return;
        }
        
        // Check if player has enough balance for paying (but not when paying bank)
        if (this.transferType === 'pays' && this.selectedPlayer.balance < this.transferAmount) {
            alert(`${this.selectedPlayer.name} doesn't have enough balance to pay $${this.transferAmount}`);
            return;
        }
        
        // Move to step 3: target selection
        this.showTargetSelection();
    }
    
    showTargetSelection() {
        const targetPrompt = document.getElementById('targetPrompt');
        const targetContainer = document.getElementById('targetPlayersContainer');
        
        // Set prompt based on transfer type
        if (this.transferType === 'pays') {
            targetPrompt.textContent = `${this.selectedPlayer.name} pays $${this.transferAmount} to:`;
        } else {
            targetPrompt.textContent = `${this.selectedPlayer.name} receives $${this.transferAmount} from:`;
        }
        
        // Clear and populate targets
        targetContainer.innerHTML = '';
        
        // Add bank option
        const bankCard = document.createElement('div');
        bankCard.className = 'target-player-card';
        bankCard.innerHTML = `
            <div class="bank-icon">🏦</div>
            <div>Bank</div>
            <div>∞</div>
        `;
        bankCard.addEventListener('click', () => this.handleTargetSelection(null)); // null represents bank
        targetContainer.appendChild(bankCard);
        
        // Add Free Parking option
        const freeParkingCard = document.createElement('div');
        freeParkingCard.className = 'target-player-card';
        freeParkingCard.innerHTML = `
            <div class="free-parking-icon">🅿️</div>
            <div>Free Parking</div>
            <div>$${this.freeParkingBalance}</div>
        `;
        freeParkingCard.addEventListener('click', () => this.handleTargetSelection('freeParking'));
        targetContainer.appendChild(freeParkingCard);
        
        // Add other players
        this.players.filter(p => p.id !== this.selectedPlayer.id).forEach(player => {
            const targetCard = document.createElement('div');
            targetCard.className = 'target-player-card';
            targetCard.innerHTML = `
                <img src="https://picsum.photos/seed/player${player.id}/60/60.jpg" alt="${player.name}">
                <div>${player.name}</div>
                <div>$${player.balance}</div>
            `;
            targetCard.addEventListener('click', () => this.handleTargetSelection(player));
            targetContainer.appendChild(targetCard);
        });
        
        // Move to step 3
        document.getElementById('amountSection').style.display = 'none';
        document.getElementById('targetSection').style.display = 'block';
        
        // Add target mode styling to player cards
        document.querySelectorAll('.player-card').forEach(card => {
            const playerId = parseInt(card.dataset.playerId);
            if (playerId !== this.selectedPlayer.id) {
                card.classList.add('target-mode');
            }
        });
    }
    
    
    handleTargetSelection(targetPlayer) {
        this.currentTarget = targetPlayer;
        this.executeTransfer();
        this.closeTransferModal();
    }
    
    executeTransfer() {
        let transactionDescription = '';
        
        if (this.currentTarget === null) {
            // Transfer with bank
            if (this.transferType === 'pays') {
                // Player pays bank (money disappears)
                this.selectedPlayer.balance -= this.transferAmount;
                transactionDescription = `${this.selectedPlayer.name} paid $${this.transferAmount} to the bank`;
            } else {
                // Player receives from bank (money appears)
                this.selectedPlayer.balance += this.transferAmount;
                transactionDescription = `${this.selectedPlayer.name} received $${this.transferAmount} from the bank`;
            }
        } else if (this.currentTarget === 'freeParking') {
            // Transfer with Free Parking
            if (this.transferType === 'pays') {
                // Player pays Free Parking
                this.selectedPlayer.balance -= this.transferAmount;
                this.freeParkingBalance += this.transferAmount;
                transactionDescription = `${this.selectedPlayer.name} paid $${this.transferAmount} to Free Parking`;
            } else {
                // Player receives from Free Parking
                if (this.freeParkingBalance >= this.transferAmount) {
                    this.freeParkingBalance -= this.transferAmount;
                    this.selectedPlayer.balance += this.transferAmount;
                    transactionDescription = `${this.selectedPlayer.name} received $${this.transferAmount} from Free Parking`;
                } else {
                    alert('Free Parking does not have enough money!');
                    return;
                }
            }
        } else {
            // Transfer between players
            if (this.transferType === 'pays') {
                this.selectedPlayer.balance -= this.transferAmount;
                this.currentTarget.balance += this.transferAmount;
                transactionDescription = `${this.selectedPlayer.name} paid $${this.transferAmount} to ${this.currentTarget.name}`;
            } else {
                this.currentTarget.balance -= this.transferAmount;
                this.selectedPlayer.balance += this.transferAmount;
                transactionDescription = `${this.selectedPlayer.name} received $${this.transferAmount} from ${this.currentTarget.name}`;
            }
        }
        
        // Add to transaction history
        this.addTransactionToHistory(transactionDescription);
        
        // Update UI and save state
        this.updateUI();
        this.saveGameState();
    }
    
    // Update UI with current game state
    updateUI() {
        this.players.forEach(player => {
            const card = document.querySelector(`[data-player-id="${player.id}"]`);
            const balanceElement = card.querySelector('.balance-amount');
            balanceElement.textContent = player.balance;
        });
        
        // Update Free Parking display
        document.getElementById('freeParkingBalance').textContent = this.freeParkingBalance;
    }
    
    // Reset game to initial state
    resetGame() {
        if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
            this.players.forEach(player => {
                player.balance = 1500;
            });
            this.freeParkingBalance = 0;
            this.transactionHistory = [];
            this.updateUI();
            this.saveGameState();
        }
    }
    
    // Save game state to localStorage
    saveGameState() {
        const gameState = {
            players: this.players,
            freeParkingBalance: this.freeParkingBalance,
            transactionHistory: this.transactionHistory,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('moneyTransferGame', JSON.stringify(gameState));
    }
    
    // Load game state from localStorage
    loadGameState() {
        const saved = localStorage.getItem('moneyTransferGame');
        if (saved) {
            try {
                const gameState = JSON.parse(saved);
                this.players = gameState.players;
                this.freeParkingBalance = gameState.freeParkingBalance || 0;
                this.transactionHistory = gameState.transactionHistory || [];
                console.log('Game state loaded from localStorage');
            } catch (error) {
                console.error('Error loading game state:', error);
            }
        }
    }
    
    // Save game to file
    saveGame() {
        const gameState = {
            players: this.players,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(gameState, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `money-game-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        console.log('Game saved to file');
    }
    
    // Load game from file
    loadGameFile() {
        document.getElementById('loadFile').click();
    }
    
    // Handle file load
    handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const gameState = JSON.parse(e.target.result);
                
                // Validate game state
                if (!gameState.players || !Array.isArray(gameState.players)) {
                    throw new Error('Invalid game file format');
                }
                
                this.players = gameState.players;
                this.updateUI();
                this.saveGameState();
                
                console.log('Game loaded from file successfully');
                alert('Game loaded successfully!');
                
            } catch (error) {
                console.error('Error loading game file:', error);
                alert('Error loading game file. Please check the file format.');
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }
    
    // Pass Go - give player $200 from bank
    passGo() {
        if (this.selectedPlayer) {
            this.selectedPlayer.balance += 200;
            const transactionDescription = `${this.selectedPlayer.name} passed Go and received $200 from the bank`;
            this.addTransactionToHistory(transactionDescription);
            this.updateUI();
            this.saveGameState();
            this.closeTransferModal();
        }
    }
    
    // Show edit players modal
    showEditPlayersModal() {
        const modal = document.getElementById('editPlayersModal');
        const container = document.getElementById('editPlayersContainer');
        
        // Clear and populate edit fields
        container.innerHTML = '';
        this.players.forEach(player => {
            const editField = document.createElement('div');
            editField.className = 'player-edit-field';
            editField.innerHTML = `
                <div class="player-color-indicator" style="background-color: ${player.color}"></div>
                <input type="text" id="playerName${player.id}" value="${player.name}" maxlength="20">
            `;
            container.appendChild(editField);
        });
        
        modal.classList.add('show');
    }
    
    // Close edit players modal
    closeEditPlayersModal() {
        document.getElementById('editPlayersModal').classList.remove('show');
    }
    
    // Save player names
    savePlayerNames() {
        let namesChanged = false;
        this.players.forEach(player => {
            const input = document.getElementById(`playerName${player.id}`);
            const newName = input.value.trim();
            if (newName && newName !== player.name) {
                player.name = newName;
                namesChanged = true;
            }
        });
        
        if (namesChanged) {
            this.updateUI();
            this.saveGameState();
        }
        
        this.closeEditPlayersModal();
    }
    
    // Add transaction to history
    addTransactionToHistory(description) {
        const transaction = {
            description: description,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };
        this.transactionHistory.unshift(transaction); // Add to beginning for newest first
    }
    
    // Show history modal
    showHistoryModal() {
        const modal = document.getElementById('historyModal');
        const container = document.getElementById('historyContainer');
        
        // Clear and populate history
        container.innerHTML = '';
        
        if (this.transactionHistory.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No transactions yet</p>';
        } else {
            this.transactionHistory.forEach(transaction => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                
                const date = new Date(transaction.timestamp);
                const formattedTime = date.toLocaleString();
                
                // Parse description to add color and formatting
                let formattedDescription = transaction.description;
                
                // Add player colors and bold formatting
                this.players.forEach(player => {
                    const regex = new RegExp(`\\b${player.name}\\b`, 'g');
                    formattedDescription = formattedDescription.replace(regex, 
                        `<span class="player-name-in-history" style="color: ${player.color}">${player.name}</span>`);
                });
                
                historyItem.innerHTML = `
                    <div class="timestamp">${formattedTime}</div>
                    <div class="description">${formattedDescription}</div>
                `;
                container.appendChild(historyItem);
            });
        }
        
        modal.classList.add('show');
    }
    
    // Close history modal
    closeHistoryModal() {
        document.getElementById('historyModal').classList.remove('show');
    }
    
    // Clear history
    clearHistory() {
        if (confirm('Are you sure you want to clear all transaction history?')) {
            this.transactionHistory = [];
            this.saveGameState();
            this.closeHistoryModal();
        }
    }
    
    // Undo last transaction
    undoLastTransaction() {
        if (this.transactionHistory.length === 0) {
            alert('No transactions to undo');
            return;
        }
        
        if (confirm('Are you sure you want to undo the last transaction?')) {
            // For now, we'll just remove the last transaction from history
            // In a full implementation, we'd need to reverse the actual transaction
            this.transactionHistory.shift(); // Remove the first (newest) transaction
            this.saveGameState();
            
            // Show confirmation
            alert('Last transaction removed from history. Note: Player balances were not automatically adjusted - you may need to manually correct them.');
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new MoneyTransferGame();
    
    // Make game instance globally available for debugging
    window.moneyGame = game;
    
    console.log('Money Transfer Game initialized');
});
