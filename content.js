// Global state to track initialization
let isInitialized = false;
let heartbeatInterval = null;

// Create simple floating button container
function createFloatingButtonContainer() {
	// Check if container already exists
	const existingContainer = document.getElementById('cgpt-floating-container');
	if (existingContainer) return existingContainer;

	const container = document.createElement('div');
	container.id = 'cgpt-floating-container';
	container.className = 'cgpt-floating-container';
	
	// Create save button
	const saveBtn = document.createElement('button');
	saveBtn.id = 'cgpt-save-btn';
	saveBtn.textContent = '⭐ Save';
	saveBtn.className = 'cgpt-floating-btn cgpt-save-btn';
	
	// Create navigation button
	const navBtn = document.createElement('button');
	navBtn.id = 'cgpt-nav-btn';
	navBtn.textContent = '📋 Messages';
	navBtn.className = 'cgpt-floating-btn cgpt-nav-btn';
	
	// Add position toggle button
	const positionBtn = document.createElement('button');
	positionBtn.id = 'cgpt-position-btn';
	positionBtn.textContent = '📍';
	positionBtn.className = 'cgpt-position-btn';
	positionBtn.title = 'Change position';
	
	container.appendChild(saveBtn);
	container.appendChild(navBtn);
	container.appendChild(positionBtn);
	document.body.appendChild(container);
	
	// Load saved position or use default
	loadPosition(container);
	
	// Add button functionality
	setupSaveButton(saveBtn);
	setupNavButton(navBtn);
	setupPositionButton(positionBtn, container);
	
	console.log('PromptPin: Simple floating buttons created');
	return container;
}

// Setup position toggle functionality
function setupPositionButton(btn, container) {
	const positions = [
		{ name: 'top-right', class: 'cgpt-pos-top-right' },
		{ name: 'bottom-right', class: 'cgpt-pos-bottom-right' },
		{ name: 'top-left', class: 'cgpt-pos-top-left' },
		{ name: 'bottom-left', class: 'cgpt-pos-bottom-left' }
	];
	
	let currentPosition = 0;
	
	btn.addEventListener('click', (e) => {
		e.stopPropagation();
		
		// Remove current position class
		positions.forEach(pos => container.classList.remove(pos.class));
		
		// Move to next position
		currentPosition = (currentPosition + 1) % positions.length;
		
		// Add new position class
		container.classList.add(positions[currentPosition].class);
		
		// Save position preference
		savePosition(positions[currentPosition].name);
		
		console.log(`PromptPin: Changed to ${positions[currentPosition].name} position`);
	});
}

// Save position preference
async function savePosition(position) {
	try {
		await chrome.storage.local.set({ position });
	} catch (error) {
		console.log('PromptPin: Could not save position:', error);
	}
}

// Load position preference
async function loadPosition(container) {
	try {
		const { position } = await chrome.storage.local.get('position');
		if (position) {
			// Remove all position classes first
			container.classList.remove('cgpt-pos-top-right', 'cgpt-pos-bottom-right', 'cgpt-pos-top-left', 'cgpt-pos-bottom-left');
			// Add the saved position
			container.classList.add(`cgpt-pos-${position}`);
			console.log(`PromptPin: Loaded position: ${position}`);
		} else {
			// Default to top-right
			container.classList.add('cgpt-pos-top-right');
		}
	} catch (error) {
		console.log('PromptPin: Could not load position:', error);
		// Default to top-right
		container.classList.add('cgpt-pos-top-right');
	}
}

// Setup save button functionality
function setupSaveButton(btn) {
	btn.addEventListener("click", async (e) => {
		e.stopPropagation();
		
		const title = document.title.replace(" - ChatGPT", "");
		const url = location.href;

		try {
			const { saved = [] } = await chrome.storage.sync.get("saved");
			if (saved.some((item) => item.url === url)) {
				btn.textContent = "✅ Saved";
				setTimeout(() => {
					btn.textContent = "⭐ Save";
				}, 2000);
				return;
			}
                        saved.push({ title, url, date: Date.now(), tags: [] });
			await chrome.storage.sync.set({ saved });
			btn.textContent = "✅ Saved";
			setTimeout(() => {
				btn.textContent = "⭐ Save";
			}, 2000);
		} catch (error) {
			console.error('PromptPin: Error saving conversation:', error);
		}
	});
}

// Setup navigation button functionality
function setupNavButton(btn) {
	btn.addEventListener("click", (e) => {
		e.stopPropagation();
		
		const panel = createNavigationPanel();
		
		if (panel.style.display === 'none' || !panel.style.display) {
			panel.style.display = 'block';
			updateNavigationPanel();
			btn.textContent = "📋 Hide";
		} else {
			panel.style.display = 'none';
			btn.textContent = "📋 Messages";
		}
	});
}

// Create and manage the navigation panel
function createNavigationPanel() {
	let panel = document.getElementById('cgpt-nav-panel');
	if (panel) return panel;
	
	panel = document.createElement('div');
	panel.id = 'cgpt-nav-panel';
	panel.className = 'cgpt-nav-panel';
	panel.style.display = 'none';
	document.body.appendChild(panel);
	return panel;
}

function updateNavigationPanel() {
	const panel = document.getElementById('cgpt-nav-panel');
	if (!panel) return;
	
	const messages = document.querySelectorAll('[data-message-author-role]');
	
	panel.innerHTML = '<div class="cgpt-nav-header"><h3>Message Navigation</h3><button class="cgpt-nav-close">×</button></div>';
	
	// Add close button functionality
	panel.querySelector('.cgpt-nav-close').addEventListener('click', () => {
		panel.style.display = 'none';
		const navBtn = document.getElementById('cgpt-nav-btn');
		if (navBtn) navBtn.textContent = "📋 Messages";
	});
	
	const messageList = document.createElement('div');
	messageList.className = 'cgpt-message-list';
	
	messages.forEach((message, index) => {
		const role = message.getAttribute('data-message-author-role');
		const text = message.textContent.trim().slice(0, 50) + (message.textContent.length > 50 ? '...' : '');
		const button = document.createElement('button');
		button.className = 'cgpt-message-btn';
		button.innerHTML = `<span class="cgpt-message-icon">${role === 'user' ? '👤' : '🤖'}</span><span class="cgpt-message-text">${text}</span>`;
		button.onclick = () => {
			message.scrollIntoView({ behavior: 'smooth', block: 'start' });
			// Highlight the message briefly
			message.style.outline = '2px solid #10b981';
			setTimeout(() => {
				message.style.outline = '';
			}, 2000);
		};
		messageList.appendChild(button);
	});
	
        panel.appendChild(messageList);
}

// Initialize global keyboard shortcuts
let shortcutsInitialized = false;
function setupKeyboardShortcuts() {
        if (shortcutsInitialized) return;
        shortcutsInitialized = true;

        document.addEventListener('keydown', (e) => {
                if (!e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) return;

                const active = document.activeElement;
                if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
                        return;
                }

                if (e.key === 's' || e.key === 'S') {
                        const saveBtn = document.getElementById('cgpt-save-btn');
                        if (saveBtn) {
                                e.preventDefault();
                                saveBtn.click();
                        }
                } else if (e.key === 'm' || e.key === 'M') {
                        const navBtn = document.getElementById('cgpt-nav-btn');
                        if (navBtn) {
                                e.preventDefault();
                                navBtn.click();
                        }
                }
        });
}

// Check if buttons exist and recreate if needed
function ensureButtonsExist() {
	const container = document.getElementById('cgpt-floating-container');
	if (!container || !container.isConnected) {
		console.log('PromptPin: Buttons missing, recreating...');
		initializeFloatingButtons();
		return false;
	}
	return true;
}

// Heartbeat function to periodically check button existence
function startHeartbeat() {
	if (heartbeatInterval) {
		clearInterval(heartbeatInterval);
	}
	
	heartbeatInterval = setInterval(() => {
		if (document.visibilityState === 'visible') {
			ensureButtonsExist();
		}
	}, 5000);
}

// Initialize floating buttons
function initializeFloatingButtons() {
	try {
               // Remove old floating buttons to prevent duplicates
               const existingNavButtons = document.querySelectorAll('#cgpt-save-btn, #cgpt-nav-btn');
               existingNavButtons.forEach(btn => btn.remove());
		
		// Create floating container
		createFloatingButtonContainer();
		
		// Start heartbeat if not already running
		if (!heartbeatInterval) {
			startHeartbeat();
		}
		
		isInitialized = true;
	} catch (error) {
		console.error('PromptPin: Error initializing buttons:', error);
	}
}

// Improved observer with throttling
let observerTimeout = null;
function throttledInitialize() {
	if (observerTimeout) return;
	
	observerTimeout = setTimeout(() => {
		ensureButtonsExist();
		observerTimeout = null;
	}, 1000);
}

// MutationObserver to handle page changes
function setupMutationObserver() {
	const observer = new MutationObserver((mutations) => {
		const significantChange = mutations.some(mutation => {
			if (mutation.removedNodes.length > 0) {
				for (let node of mutation.removedNodes) {
					if (node.id === 'cgpt-floating-container' || 
						(node.nodeType === Node.ELEMENT_NODE && 
						 node.querySelector && 
						 node.querySelector('#cgpt-floating-container'))) {
						return true;
					}
				}
			}
			return mutation.target.tagName === 'BODY' || 
				   mutation.target.classList.contains('main') ||
				   mutation.addedNodes.length > 3;
		});
		
		if (significantChange) {
			throttledInitialize();
		}
	});
	
	observer.observe(document.body, { 
		childList: true, 
		subtree: false
	});
}

// Initialize when page loads
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializeFloatingButtons);
} else {
	initializeFloatingButtons();
}

// Setup the mutation observer
setupMutationObserver();

// Enable keyboard shortcuts
setupKeyboardShortcuts();

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'visible' && isInitialized) {
		setTimeout(ensureButtonsExist, 500);
	}
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
        if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
        }
});

// Export functions for testing environments
if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
                updateNavigationPanel,
                createNavigationPanel
        };
}
