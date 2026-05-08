// Game state management
class MoneyTransferGame {
    constructor() {
        // Default player configuration
        this.defaultPlayers = [
            { id: 1, name: 'Player 1', balance: 1500, color: '#e74c3c' },
            { id: 2, name: 'Player 2', balance: 1500, color: '#27ae60' },
            { id: 3, name: 'Player 3', balance: 1500, color: '#3498db' },
            { id: 4, name: 'Player 4', balance: 1500, color: '#f39c12' }
        ];
        
        // Initialize players with default values, then load customizations
        this.players = JSON.parse(JSON.stringify(this.defaultPlayers));
        
        this.selectedPlayer = null;
        this.transferType = null;
        this.transferAmount = 0;
        this.currentTarget = null;
        this.freeParkingBalance = 0;
        this.transactionHistory = [];
        
        // Modal promise resolvers
        this.confirmResolver = null;
        this.alertResolver = null;
        this.nameConflictResolver = null;
        
        this.initializeEventListeners();
        this.loadPlayerCustomizations();
        this.loadGameState();
        this.initializeTheme();
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
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('editPlayersBtn').addEventListener('click', () => this.showEditPlayersModal());
        document.getElementById('historyBtn').addEventListener('click', () => this.showHistoryModal());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoLastTransaction());
        document.getElementById('passGoBtn').addEventListener('click', () => this.passGo());
        document.getElementById('freeParkingBtn').addEventListener('click', () => this.showFreeParkingModal());
        
        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => this.closeTransferModal());
        document.getElementById('closeEditModal').addEventListener('click', () => this.closeEditPlayersModal());
        document.getElementById('closeHistoryModal').addEventListener('click', () => this.closeHistoryModal());
        document.getElementById('closeHistory').addEventListener('click', () => this.closeHistoryModal());
        
        // Name conflict modal controls
        document.getElementById('closeNameConflictModal').addEventListener('click', () => this.closeNameConflictModal(false));
        document.getElementById('useCurrentName').addEventListener('click', () => this.closeNameConflictModal(false));
        document.getElementById('useIncomingName').addEventListener('click', () => this.closeNameConflictModal(true));
        document.getElementById('nameConflictModal').addEventListener('click', (e) => {
            if (e.target.id === 'nameConflictModal') this.closeNameConflictModal(false);
        });
        
        // Free Parking modal controls
        document.getElementById('closeFreeParkingModal').addEventListener('click', () => this.closeFreeParkingModal());
        document.getElementById('closeFreeParking').addEventListener('click', () => this.closeFreeParkingModal());
        document.getElementById('payOutBtn').addEventListener('click', () => this.showFreeParkingPayoutModal());
        document.getElementById('closeFreeParkingPayoutModal').addEventListener('click', () => this.closeFreeParkingPayoutModal());
        document.getElementById('cancelPayout').addEventListener('click', () => this.closeFreeParkingPayoutModal());
        
        // Edit players modal controls
        document.getElementById('savePlayerNames').addEventListener('click', () => this.savePlayerNames());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeEditPlayersModal());
        document.getElementById('resetPlayersBtn').addEventListener('click', () => this.resetPlayers());
        
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
        
        // Confirmation modal event listeners
        document.getElementById('closeConfirmModal').addEventListener('click', () => this.closeConfirmModal(false));
        document.getElementById('confirmCancel').addEventListener('click', () => this.closeConfirmModal(false));
        document.getElementById('confirmOk').addEventListener('click', () => this.closeConfirmModal(true));
        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target.id === 'confirmModal') this.closeConfirmModal(false);
        });
        
        // Alert modal event listeners
        document.getElementById('closeAlertModal').addEventListener('click', () => this.closeAlertModal());
        document.getElementById('alertOk').addEventListener('click', () => this.closeAlertModal());
        document.getElementById('alertModal').addEventListener('click', (e) => {
            if (e.target.id === 'alertModal') this.closeAlertModal();
        });
        
        // Amount input enter key - removed since input is now readonly
    }
    
    // Extract initials from player name
    getPlayerInitials(name) {
        if (!name || typeof name !== 'string') {
            return '?';
        }
        
        const trimmedName = name.trim();
        if (!trimmedName) {
            return '?';
        }
        
        // Split by spaces to handle multi-word names
        const words = trimmedName.split(/\s+/);
        
        if (words.length === 1) {
            // Single name - just use first letter
            return words[0].charAt(0).toUpperCase();
        } else {
            // Multiple words - use first letter of first and last word
            const firstWord = words[0];
            const lastWord = words[words.length - 1];
            
            // Handle hyphenated names (treat as single word)
            const firstInitial = firstWord.charAt(0).toUpperCase();
            const lastInitial = lastWord.charAt(0).toUpperCase();
            
            return firstInitial + lastInitial;
        }
    }
    
    // Create player initials element
    createPlayerInitials(player, size = 'large') {
        const initials = this.getPlayerInitials(player.name);
        const div = document.createElement('div');
        div.className = `player-initials player-initials-${size}`;
        div.textContent = initials;
        div.style.color = player.color;
        div.style.backgroundColor = this.makeColorPale(player.color);
        div.style.borderColor = player.color;
        div.title = player.name;
        return div;
    }
    
    // Make a color paler/lighter for background
    makeColorPale(color) {
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Make it very pale by blending with white (30% color, 70% white)
        const paleR = Math.round(r * 0.3 + 255 * 0.7);
        const paleG = Math.round(g * 0.3 + 255 * 0.7);
        const paleB = Math.round(b * 0.3 + 255 * 0.7);
        
        return `rgb(${paleR}, ${paleG}, ${paleB})`;
    }
    
    // Initialize theme
    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }
    
    // Toggle theme
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
    
    // Set theme
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme toggle button icon
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
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
        // Reset amount input
        document.getElementById('transferAmount').value = '0';
    }
    
    // Go back to transfer type selection
    goBackToTransferType() {
        document.getElementById('amountSection').style.display = 'none';
        document.getElementById('transferTypeSection').style.display = 'block';
        document.getElementById('backBtn').style.display = 'none';
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
    async confirmAmount() {
        const amountInput = document.getElementById('transferAmount');
        this.transferAmount = parseInt(amountInput.value);
        
        if (isNaN(this.transferAmount) || this.transferAmount < 0) {
            await this.showAlert('Please enter a valid amount');
            return;
        }
        
        if (this.transferAmount === 0) {
            await this.showAlert('Please enter an amount greater than 0');
            return;
        }
        
        // Check if player has enough balance for paying (but not when paying bank)
        if (this.transferType === 'pays' && this.selectedPlayer.balance < this.transferAmount) {
            await this.showAlert(`${this.selectedPlayer.name} doesn't have enough balance to pay $${this.transferAmount}`);
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
            
            // Create initials element
            const initialsElement = this.createPlayerInitials(player, 'small');
            
            targetCard.innerHTML = '';
            targetCard.appendChild(initialsElement);
            
            const nameDiv = document.createElement('div');
            nameDiv.textContent = player.name;
            targetCard.appendChild(nameDiv);
            
            const balanceDiv = document.createElement('div');
            balanceDiv.textContent = `$${player.balance}`;
            targetCard.appendChild(balanceDiv);
            
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
    
    
    async handleTargetSelection(targetPlayer) {
        this.currentTarget = targetPlayer;
        await this.executeTransfer();
        this.closeTransferModal();
    }
    
    async executeTransfer() {
        let transactionDescription = '';
        
        // Capture previous state before making changes
        const previousState = {
            players: JSON.parse(JSON.stringify(this.players)),
            freeParkingBalance: this.freeParkingBalance
        };
        
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
                    await this.showAlert('Free Parking does not have enough money!');
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
        
        // Add to transaction history with previous state
        this.addTransactionToHistory(transactionDescription, previousState);
        
        // Update UI and save state
        this.updateUI();
        this.saveGameState();
    }
    
    // Update UI with current game state
    updateUI() {
        this.players.forEach(player => {
            const card = document.querySelector(`[data-player-id="${player.id}"]`);
            const balanceElement = card.querySelector('.balance-amount');
            const nameElement = card.querySelector('.player-name');
            const initialsElement = card.querySelector('.player-initials-large');
            
            balanceElement.textContent = player.balance;
            nameElement.textContent = player.name;
            
            // Update initials with new name and color
            if (initialsElement) {
                initialsElement.textContent = this.getPlayerInitials(player.name);
                initialsElement.style.color = player.color;
                initialsElement.style.backgroundColor = this.makeColorPale(player.color);
                initialsElement.style.borderColor = player.color;
                initialsElement.title = player.name;
            }
            
            // Update card border and shadow colors
            card.style.border = `4px solid ${player.color}`;
            card.style.boxShadow = `0 0 10px ${player.color}40`;
        });
        
        // Update Free Parking display
        document.getElementById('freeParkingBalance').textContent = this.freeParkingBalance;
    }
    
    // Save player customizations (names and colors) to localStorage
    savePlayerCustomizations() {
        const customizations = {
            players: this.players.map(player => ({
                id: player.id,
                name: player.name !== this.defaultPlayers.find(p => p.id === player.id).name ? player.name : null,
                color: player.color !== this.defaultPlayers.find(p => p.id === player.id).color ? player.color : null
            }))
        };
        localStorage.setItem('moneyGamePlayerCustomizations', JSON.stringify(customizations));
    }
    
    // Load player customizations from localStorage
    loadPlayerCustomizations() {
        const saved = localStorage.getItem('moneyGamePlayerCustomizations');
        if (saved) {
            try {
                const customizations = JSON.parse(saved);
                if (customizations.players && Array.isArray(customizations.players)) {
                    customizations.players.forEach(customPlayer => {
                        const player = this.players.find(p => p.id === customPlayer.id);
                        if (player) {
                            if (customPlayer.name) player.name = customPlayer.name;
                            if (customPlayer.color) player.color = customPlayer.color;
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading player customizations:', error);
            }
        }
    }
    
    // Save game state to localStorage (balances and history only)
    saveGameState() {
        const gameState = {
            players: this.players.map(player => ({
                id: player.id,
                balance: player.balance
            })),
            freeParkingBalance: this.freeParkingBalance,
            transactionHistory: this.transactionHistory,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('moneyTransferGame', JSON.stringify(gameState));
    }
    
    // Load game state from localStorage (balances and history only)
    loadGameState() {
        const saved = localStorage.getItem('moneyTransferGame');
        if (saved) {
            try {
                const gameState = JSON.parse(saved);
                
                // Load player balances only
                if (gameState.players && Array.isArray(gameState.players)) {
                    gameState.players.forEach(savedPlayer => {
                        const player = this.players.find(p => p.id === savedPlayer.id);
                        if (player && savedPlayer.balance !== undefined) {
                            player.balance = savedPlayer.balance;
                        }
                    });
                }
                
                this.freeParkingBalance = gameState.freeParkingBalance || 0;
                this.transactionHistory = gameState.transactionHistory || [];
                console.log('Game state loaded from localStorage');
            } catch (error) {
                console.error('Error loading game state:', error);
            }
        }
    }
    
    // Save game to file (only non-default names and colors)
    saveGame() {
        const gameState = {
            players: this.players.map(player => {
                const defaultPlayer = this.defaultPlayers.find(p => p.id === player.id);
                return {
                    id: player.id,
                    name: player.name !== defaultPlayer.name ? player.name : null,
                    color: player.color !== defaultPlayer.color ? player.color : null,
                    balance: player.balance
                };
            }),
            freeParkingBalance: this.freeParkingBalance,
            transactionHistory: this.transactionHistory,
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
    
    // Handle file load with name conflict resolution
    async handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const gameState = JSON.parse(e.target.result);
                
                // Validate game state
                if (!gameState.players || !Array.isArray(gameState.players)) {
                    throw new Error('Invalid game file format');
                }
                
                // Process name conflicts
                const nameConflicts = [];
                gameState.players.forEach(incomingPlayer => {
                    const currentPlayer = this.players.find(p => p.id === incomingPlayer.id);
                    if (currentPlayer && incomingPlayer.name && currentPlayer.name !== incomingPlayer.name) {
                        const currentDefault = this.defaultPlayers.find(p => p.id === incomingPlayer.id);
                        // Only show conflict if both names are non-default and different
                        if (currentPlayer.name !== currentDefault.name && incomingPlayer.name !== currentDefault.name) {
                            nameConflicts.push({
                                playerId: incomingPlayer.id,
                                currentName: currentPlayer.name,
                                incomingName: incomingPlayer.name
                            });
                        }
                    }
                });
                
                // Resolve conflicts
                const resolvedNames = {};
                for (const conflict of nameConflicts) {
                    const useIncoming = await this.showNameConflictModal(conflict.currentName, conflict.incomingName);
                    resolvedNames[conflict.playerId] = useIncoming ? conflict.incomingName : conflict.currentName;
                }
                
                // Apply game state with resolved conflicts
                gameState.players.forEach(incomingPlayer => {
                    const currentPlayer = this.players.find(p => p.id === incomingPlayer.id);
                    if (currentPlayer) {
                        // Apply balance
                        if (incomingPlayer.balance !== undefined) {
                            currentPlayer.balance = incomingPlayer.balance;
                        }
                        
                        // Apply name with conflict resolution
                        if (incomingPlayer.name) {
                            const currentDefault = this.defaultPlayers.find(p => p.id === incomingPlayer.id);
                            if (incomingPlayer.name !== currentDefault.name) {
                                // Non-default incoming name
                                if (currentPlayer.name === currentDefault.name) {
                                    // Current is default, automatically apply incoming
                                    currentPlayer.name = incomingPlayer.name;
                                } else if (resolvedNames[incomingPlayer.id]) {
                                    // Use resolved name
                                    currentPlayer.name = resolvedNames[incomingPlayer.id];
                                }
                                // If no resolution, keep current (conflict resolved to keep current)
                            }
                            // If incoming is default, don't change current
                        }
                        
                        // Apply color with similar logic
                        if (incomingPlayer.color) {
                            const currentDefault = this.defaultPlayers.find(p => p.id === incomingPlayer.id);
                            if (incomingPlayer.color !== currentDefault.color) {
                                // Non-default incoming color, apply if current is default or if it's different
                                if (currentPlayer.color === currentDefault.color || currentPlayer.color !== incomingPlayer.color) {
                                    currentPlayer.color = incomingPlayer.color;
                                }
                            }
                            // If incoming is default, don't change current
                        }
                    }
                });
                
                this.freeParkingBalance = gameState.freeParkingBalance || 0;
                this.transactionHistory = gameState.transactionHistory || [];
                
                // Update UI and save to localStorage
                this.updateUI();
                this.saveGameState();
                this.savePlayerCustomizations();
                
                console.log('Game loaded from file successfully');
                await this.showAlert('Game loaded successfully!');
                
            } catch (error) {
                console.error('Error loading game file:', error);
                await this.showAlert('Error loading game file. Please check the file format.');
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }
    
    // Pass Go - give player $200 from bank
    async passGo() {
        if (this.selectedPlayer) {
            // Capture previous state before making changes
            const previousState = {
                players: JSON.parse(JSON.stringify(this.players)),
                freeParkingBalance: this.freeParkingBalance
            };
            
            this.selectedPlayer.balance += 200;
            const transactionDescription = `${this.selectedPlayer.name} received $200 from the bank`;
            this.addTransactionToHistory(transactionDescription, previousState);
            this.updateUI();
            this.saveGameState();
            this.closeTransferModal();
        } else {
            await this.showAlert('Please select a player first by clicking on their card, then click Pass Go.');
        }
    }
    
    // Show edit players modal
    showEditPlayersModal() {
        const modal = document.getElementById('editPlayersModal');
        const container = document.getElementById('editPlayersContainer');
        
        // Define predefined colors
        const predefinedColors = [
            '#e74c3c', '#3498db', '#27ae60', '#f39c12',
            '#9b59b6', '#e67e22', '#e91e63', '#00bcd4',
            '#009688', '#3f51b5', '#8bc34a', '#ffc107',
            '#10b981', '#f43f5e', '#0ea5e9', '#8b5cf6'
        ];
        
        // Clear and populate edit fields
        container.innerHTML = '';
        this.players.forEach(player => {
            const editField = document.createElement('div');
            editField.className = 'player-edit-field';
            editField.innerHTML = `
                <div class="player-color-indicator clickable" id="colorIndicator${player.id}" 
                     style="background-color: ${player.color}" 
                     data-player-id="${player.id}" 
                     title="Click to change color"></div>
                <input type="text" id="playerName${player.id}" value="${player.name}" class="name-input" placeholder="Player name">
            `;
            container.appendChild(editField);
        });
        
        // Add event listeners for color indicator clicks
        this.players.forEach(player => {
            const colorIndicator = document.getElementById(`colorIndicator${player.id}`);
            colorIndicator.addEventListener('click', (e) => {
                this.showColorPicker(e.target, player, predefinedColors);
            });
        });
        
        modal.classList.add('show');
    }
    
    // Show color picker popup
    showColorPicker(colorIndicator, player, predefinedColors) {
        // Remove any existing color picker
        this.removeColorPicker();
        
        // Create color picker popup
        const picker = document.createElement('div');
        picker.className = 'color-picker-popup';
        picker.id = 'colorPickerPopup';
        
        // Create color options
        const colorOptionsHtml = predefinedColors.map((color, index) => {
            const colorClass = this.getColorClass(color);
            const isSelected = player.color === color;
            return `<div class="color-option ${colorClass} ${isSelected ? 'selected' : ''}" 
                     data-color="${color}" title="${color}"></div>`;
        }).join('');
        
        picker.innerHTML = `
            <div class="color-picker-header">
                <span>Choose Color for ${player.name}</span>
                <button class="close-picker-btn" id="closeColorPicker">&times;</button>
            </div>
            <div class="predefined-colors">
                ${colorOptionsHtml}
            </div>
        `;
        
        // Position the picker near the color indicator
        const rect = colorIndicator.getBoundingClientRect();
        picker.style.position = 'fixed';
        picker.style.left = `${rect.left + rect.width + 10}px`;
        picker.style.top = `${rect.top}px`;
        picker.style.zIndex = '10000';
        
        // Add to DOM
        document.body.appendChild(picker);
        
        // Store reference to closePicker function for proper removal
        this.currentClosePicker = () => this.removeColorPicker();
        
        // Add event listeners
        const colorOptions = picker.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const selectedColor = e.target.dataset.color;
                
                // Remove selected class from all options
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                e.target.classList.add('selected');
                
                // Update color indicator
                colorIndicator.style.backgroundColor = selectedColor;
                
                // Update player color immediately
                player.color = selectedColor;
                
                // Save the color change to localStorage
                this.savePlayerCustomizations();
                
                // Update player card border color
                const playerCard = document.querySelector(`[data-player-id="${player.id}"]`);
                if (playerCard) {
                    playerCard.style.border = `4px solid ${selectedColor}`;
                    playerCard.style.boxShadow = `0 0 10px ${selectedColor}40`;
                    
                    // Update initials circle color
                    const initialsElement = playerCard.querySelector('.player-initials-large');
                    if (initialsElement) {
                        initialsElement.style.color = selectedColor;
                        initialsElement.style.backgroundColor = this.makeColorPale(selectedColor);
                        initialsElement.style.borderColor = selectedColor;
                    }
                }
            });
        });
        
        // Close picker when clicking outside or on close button
        picker.querySelector('#closeColorPicker').addEventListener('click', this.currentClosePicker);
        setTimeout(() => {
            document.addEventListener('click', this.currentClosePicker);
        }, 100);
        
        // Prevent picker from closing when clicking inside it
        picker.addEventListener('click', (e) => e.stopPropagation());
    }
    
    // Remove color picker popup
    removeColorPicker() {
        const picker = document.getElementById('colorPickerPopup');
        if (picker) {
            picker.remove();
        }
        if (this.currentClosePicker) {
            document.removeEventListener('click', this.currentClosePicker);
            this.currentClosePicker = null;
        }
    }
    
    // Get color class for predefined colors
    getColorClass(color) {
        const colorMap = {
            '#e74c3c': 'color-red',
            '#3498db': 'color-blue', 
            '#27ae60': 'color-green',
            '#f39c12': 'color-yellow',
            '#9b59b6': 'color-purple',
            '#e67e22': 'color-orange',
            '#e91e63': 'color-pink',
            '#00bcd4': 'color-cyan',
            '#009688': 'color-teal',
            '#3f51b5': 'color-indigo',
            '#8bc34a': 'color-lime',
            '#ffc107': 'color-amber',
            '#10b981': 'color-emerald',
            '#f43f5e': 'color-rose',
            '#0ea5e9': 'color-sky',
            '#8b5cf6': 'color-violet'
        };
        return colorMap[color] || '';
    }
    
    // Close edit players modal
    closeEditPlayersModal() {
        this.removeColorPicker();
        document.getElementById('editPlayersModal').classList.remove('show');
    }
    
    // Save player names
    savePlayerNames() {
        let changesMade = false;
        this.players.forEach(player => {
            const nameInput = document.getElementById(`playerName${player.id}`);
            const newName = nameInput.value.trim();
            
            if (newName && newName !== player.name) {
                player.name = newName;
                changesMade = true;
            }
        });
        
        if (changesMade) {
            this.updateUI();
            this.savePlayerCustomizations();
        }
        
        this.closeEditPlayersModal();
    }
    
    // Add transaction to history
    addTransactionToHistory(description, previousState) {
        // Parse the description to extract structured data
        const transactionData = this.parseTransactionDescription(description);
        
        const transaction = {
            description: description, // Keep original for backward compatibility
            timestamp: new Date().toISOString(),
            id: Date.now(),
            previousState: previousState, // Store state before transaction for undo
            ...transactionData // Add structured transaction data
        };
        this.transactionHistory.unshift(transaction); // Add to beginning for newest first
    }
    
    // Parse transaction description to extract structured data
    parseTransactionDescription(description) {
        const data = {
            type: 'unknown',
            fromPlayerId: null,
            toPlayerId: null,
            amount: 0,
            entity: null // For bank, freeParking, etc.
        };
        
        // Extract amount
        const amountMatch = description.match(/\$(\d+)/);
        if (amountMatch) {
            data.amount = parseInt(amountMatch[1]);
        }
        
        // Parse different transaction types
        if (description.includes('paid') && description.includes('to')) {
            data.type = 'payment';
            const parts = description.split(' paid $');
            if (parts.length === 2) {
                const fromName = parts[0].trim();
                const toParts = parts[1].split(' to ');
                if (toParts.length === 2) {
                    const toName = toParts[1].trim();
                    data.fromPlayerId = this.findPlayerIdByName(fromName);
                    data.toPlayerId = this.findPlayerIdByName(toName);
                    if (data.toPlayerId === null) {
                        data.entity = toName; // bank, Free Parking, etc.
                    }
                }
            }
        } else if (description.includes('received') && description.includes('from')) {
            data.type = 'receipt';
            const parts = description.split(' received $');
            if (parts.length === 2) {
                const toName = parts[0].trim();
                const fromParts = parts[1].split(' from ');
                if (fromParts.length === 2) {
                    const fromName = fromParts[1].trim();
                    data.toPlayerId = this.findPlayerIdByName(toName);
                    data.fromPlayerId = this.findPlayerIdByName(fromName);
                    if (data.fromPlayerId === null) {
                        data.entity = fromName; // bank, Free Parking, etc.
                    }
                }
            }
        }
        
        return data;
    }
    
    // Find player ID by name
    findPlayerIdByName(name) {
        const player = this.players.find(p => p.name === name);
        return player ? player.id : null;
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
                
                // Generate dynamic description based on current player data
                let formattedDescription = this.generateTransactionDescription(transaction);
                
                historyItem.innerHTML = `
                    <div class="timestamp">${formattedTime}</div>
                    <div class="description">${formattedDescription}</div>
                `;
                container.appendChild(historyItem);
            });
        }
        
        modal.classList.add('show');
    }
    
    // Generate transaction description with current player names and colors
    generateTransactionDescription(transaction) {
        // If transaction has structured data, use it to generate dynamic description
        if (transaction.type && transaction.type !== 'unknown') {
            let description = '';
            
            const fromPlayer = transaction.fromPlayerId ? this.players.find(p => p.id === transaction.fromPlayerId) : null;
            const toPlayer = transaction.toPlayerId ? this.players.find(p => p.id === transaction.toPlayerId) : null;
            
            switch (transaction.type) {
                case 'payment':
                    if (fromPlayer && toPlayer) {
                        description = `${this.formatPlayerName(fromPlayer)} paid $${transaction.amount} to ${this.formatPlayerName(toPlayer)}`;
                    } else if (fromPlayer && transaction.entity) {
                        description = `${this.formatPlayerName(fromPlayer)} paid $${transaction.amount} to ${transaction.entity}`;
                    }
                    break;
                case 'receipt':
                    if (toPlayer && fromPlayer) {
                        description = `${this.formatPlayerName(toPlayer)} received $${transaction.amount} from ${this.formatPlayerName(fromPlayer)}`;
                    } else if (toPlayer && transaction.entity) {
                        description = `${this.formatPlayerName(toPlayer)} received $${transaction.amount} from ${transaction.entity}`;
                    }
                    break;
                                default:
                    // Fallback to original description
                    description = transaction.description;
                    break;
            }
            
            return description;
        } else {
            // Fallback for old transactions without structured data
            let formattedDescription = transaction.description;
            
            // Add player colors and bold formatting
            this.players.forEach(player => {
                const regex = new RegExp(`\\b${player.name}\\b`, 'g');
                formattedDescription = formattedDescription.replace(regex, 
                    `<span class="player-name-in-history" style="color: ${player.color}; font-weight: bold;">${player.name}</span>`);
            });
            
            return formattedDescription;
        }
    }
    
    // Format player name with color
    formatPlayerName(player) {
        return `<span class="player-name-in-history" style="color: ${player.color}; font-weight: bold;">${player.name}</span>`;
    }
    
    // Close history modal
    closeHistoryModal() {
        document.getElementById('historyModal').classList.remove('show');
    }
    
    // Show Free Parking modal
    showFreeParkingModal() {
        const modal = document.getElementById('freeParkingModal');
        const balanceElement = document.getElementById('freeParkingModalBalance');
        const payOutBtn = document.getElementById('payOutBtn');
        
        balanceElement.textContent = this.freeParkingBalance;
        payOutBtn.disabled = this.freeParkingBalance === 0;
        
        modal.classList.add('show');
    }
    
    // Close Free Parking modal
    closeFreeParkingModal() {
        document.getElementById('freeParkingModal').classList.remove('show');
    }
    
    // Show Free Parking payout modal
    showFreeParkingPayoutModal() {
        const modal = document.getElementById('freeParkingPayoutModal');
        const payoutAmountElement = document.getElementById('payoutAmount');
        const container = document.getElementById('payoutPlayersContainer');
        
        payoutAmountElement.textContent = this.freeParkingBalance;
        
        // Clear and populate players
        container.innerHTML = '';
        this.players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'payout-player-card';
            
            // Create initials element
            const initialsElement = this.createPlayerInitials(player, 'small');
            
            playerCard.innerHTML = '';
            playerCard.appendChild(initialsElement);
            
            const nameDiv = document.createElement('div');
            nameDiv.textContent = player.name;
            playerCard.appendChild(nameDiv);
            
            const balanceDiv = document.createElement('div');
            balanceDiv.textContent = `$${player.balance}`;
            playerCard.appendChild(balanceDiv);
            
            playerCard.addEventListener('click', () => this.handleFreeParkingPayout(player));
            container.appendChild(playerCard);
        });
        
        modal.classList.add('show');
    }
    
    // Close Free Parking payout modal
    closeFreeParkingPayoutModal() {
        document.getElementById('freeParkingPayoutModal').classList.remove('show');
    }
    
    // Handle Free Parking payout to player
    async handleFreeParkingPayout(player) {
        const amount = this.freeParkingBalance;
        
        if (amount === 0) {
            await this.showAlert('No money in Free Parking to pay out!');
            return;
        }
        
        // Capture previous state before making changes
        const previousState = {
            players: JSON.parse(JSON.stringify(this.players)),
            freeParkingBalance: this.freeParkingBalance
        };
        
        // Transfer money from Free Parking to player
        this.freeParkingBalance = 0;
        player.balance += amount;
        
        // Add to transaction history
        const transactionDescription = `${player.name} received $${amount} from Free Parking`;
        this.addTransactionToHistory(transactionDescription, previousState);
        
        // Update UI and save state
        this.updateUI();
        this.saveGameState();
        
        // Close modals and show confirmation
        this.closeFreeParkingPayoutModal();
        this.closeFreeParkingModal();
        
        await this.showAlert(`${player.name} received $${amount} from Free Parking!`);
    }
    
    // Reset players to default names and colors only
    async resetPlayers() {
        const shouldReset = await this.showConfirm('Are you sure you want to reset all player names and colors to default values?');
        if (shouldReset) {
            this.players.forEach(player => {
                const defaultPlayer = this.defaultPlayers.find(p => p.id === player.id);
                if (defaultPlayer) {
                    player.name = defaultPlayer.name;
                    player.color = defaultPlayer.color;
                }
            });
            
            // Clear customizations from localStorage
            localStorage.removeItem('moneyGamePlayerCustomizations');
            
            // Update UI and save
            this.updateUI();
            this.savePlayerCustomizations();
            
            // Close the edit modal
            this.closeEditPlayersModal();
            
            await this.showAlert('Player names and colors have been reset to defaults!');
        }
    }
    
    // Reset game (clears balances and history only, preserves customizations)
    async resetGame() {
        const shouldReset = await this.showConfirm('Are you sure you want to reset the game? This will clear all balances and history, but keep player names and colors.');
        if (shouldReset) {
            // Reset player balances only
            this.players.forEach(player => {
                player.balance = 1500;
            });
            
            // Reset other game state
            this.selectedPlayer = null;
            this.transferType = null;
            this.transferAmount = 0;
            this.currentTarget = null;
            this.freeParkingBalance = 0;
            this.transactionHistory = [];
            
            // Update UI and save
            this.updateUI();
            this.saveGameState();
            
            await this.showAlert('Game has been reset! Balances and history cleared, but player names and colors preserved.');
        }
    }
    
        
    // Undo last transaction
    async undoLastTransaction() {
        if (this.transactionHistory.length === 0) {
            await this.showAlert('No transactions to undo');
            return;
        }
        
        const shouldUndo = await this.showConfirm('Are you sure you want to undo the last transaction?');
        if (shouldUndo) {
            const lastTransaction = this.transactionHistory[0]; // Get newest transaction
            
            if (lastTransaction.previousState) {
                // Restore previous state
                this.players = JSON.parse(JSON.stringify(lastTransaction.previousState.players));
                this.freeParkingBalance = lastTransaction.previousState.freeParkingBalance;
                
                // Remove the transaction from history
                this.transactionHistory.shift();
                
                // Update UI and save
                this.updateUI();
                this.saveGameState();
                
                await this.showAlert('Last transaction undone successfully!');
            } else {
                // Fallback for transactions without previous state (old format)
                this.transactionHistory.shift();
                this.saveGameState();
                await this.showAlert('Last transaction removed from history. Note: This was an old transaction format, so balances may need manual correction.');
            }
        }
    }
    
    // Show confirmation modal (returns Promise<boolean>)
    showConfirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            this.confirmResolver = resolve;
            document.getElementById('confirmTitle').textContent = title;
            document.getElementById('confirmMessage').textContent = message;
            document.getElementById('confirmModal').classList.add('show');
        });
    }
    
    // Close confirmation modal
    closeConfirmModal(result) {
        document.getElementById('confirmModal').classList.remove('show');
        if (this.confirmResolver) {
            this.confirmResolver(result);
            this.confirmResolver = null;
        }
    }
    
    // Show alert modal (returns Promise<void>)
    showAlert(message, title = 'Alert') {
        return new Promise((resolve) => {
            this.alertResolver = resolve;
            document.getElementById('alertTitle').textContent = title;
            document.getElementById('alertMessage').textContent = message;
            document.getElementById('alertModal').classList.add('show');
        });
    }
    
    // Show name conflict modal (returns Promise<boolean> - true for incoming, false for current)
    showNameConflictModal(currentName, incomingName) {
        return new Promise((resolve) => {
            this.nameConflictResolver = resolve;
            document.getElementById('nameConflictMessage').textContent = 'There is a conflict between the current and incoming player name. Which would you like to use?';
            document.getElementById('currentName').textContent = currentName;
            document.getElementById('incomingName').textContent = incomingName;
            document.getElementById('nameConflictModal').classList.add('show');
        });
    }
    
    // Close name conflict modal
    closeNameConflictModal(useIncoming) {
        document.getElementById('nameConflictModal').classList.remove('show');
        if (this.nameConflictResolver) {
            this.nameConflictResolver(useIncoming);
            this.nameConflictResolver = null;
        }
    }
    
    // Close alert modal
    closeAlertModal() {
        document.getElementById('alertModal').classList.remove('show');
        if (this.alertResolver) {
            this.alertResolver();
            this.alertResolver = null;
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
