// Global state to track initialization
let isInitialized = false;
let heartbeatInterval = null;

// Create floating draggable button container
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
	
	container.appendChild(saveBtn);
	container.appendChild(navBtn);
	document.body.appendChild(container);
	
	// Load saved position or use default
	loadButtonPosition(container);
	
	// Make container draggable
	makeDraggable(container);
	
	// Add button functionality
	setupSaveButton(saveBtn);
	setupNavButton(navBtn);
	
	console.log('PromptPin: Floating buttons created');
	return container;
}

// Make element draggable
function makeDraggable(element) {
	let isDragging = false;
	let currentX;
	let currentY;
	let initialX;
	let initialY;
	let xOffset = 0;
	let yOffset = 0;

	// Remove existing event listeners to prevent duplicates
	element.removeEventListener('mousedown', element._dragStart);
	
	function dragStart(e) {
		// Only start dragging if clicking on the container, not the buttons
		if (e.target.classList.contains('cgpt-floating-btn')) return;
		
		initialX = e.clientX - xOffset;
		initialY = e.clientY - yOffset;

		if (e.target === element) {
			isDragging = true;
			element.style.cursor = 'grabbing';
		}
	}

	function dragMove(e) {
		if (isDragging) {
			e.preventDefault();
			currentX = e.clientX - initialX;
			currentY = e.clientY - initialY;

			xOffset = currentX;
			yOffset = currentY;

			// Keep within viewport bounds
			const rect = element.getBoundingClientRect();
			const maxX = window.innerWidth - rect.width;
			const maxY = window.innerHeight - rect.height;
			
			currentX = Math.max(0, Math.min(currentX, maxX));
			currentY = Math.max(0, Math.min(currentY, maxY));

			element.style.transform = `translate(${currentX}px, ${currentY}px)`;
		}
	}

	function dragEnd() {
		if (isDragging) {
			initialX = currentX;
			initialY = currentY;
			isDragging = false;
			element.style.cursor = 'grab';
			
			// Save position
			saveButtonPosition(currentX, currentY);
		}
	}
	
	// Store reference to prevent duplicate listeners
	element._dragStart = dragStart;
	
	element.addEventListener('mousedown', dragStart);
	document.addEventListener('mousemove', dragMove);
	document.addEventListener('mouseup', dragEnd);
}

// Save button position to storage
async function saveButtonPosition(x, y) {
	try {
		await chrome.storage.local.set({ 
			buttonPosition: { x, y } 
		});
	} catch (error) {
		console.log('PromptPin: Could not save button position:', error);
	}
}

// Load button position from storage
async function loadButtonPosition(container) {
	try {
		const { buttonPosition } = await chrome.storage.local.get('buttonPosition');
		if (buttonPosition) {
			container.style.transform = `translate(${buttonPosition.x}px, ${buttonPosition.y}px)`;
		}
	} catch (error) {
		console.log('PromptPin: Could not load button position:', error);
	}
}

// Setup save button functionality
function setupSaveButton(btn) {
	// Remove existing listener to prevent duplicates
	btn.removeEventListener('click', btn._saveClickHandler);
	
	const saveClickHandler = async (e) => {
		e.stopPropagation(); // Prevent dragging when clicking button
		
		const title = document.title.replace(" - ChatGPT", "");
		const url = location.href;

		try {
			// Pull existing list, add new item if not present
			const { saved = [] } = await chrome.storage.sync.get("saved");
			if (saved.some((item) => item.url === url)) {
				btn.textContent = "✅ Saved";
				setTimeout(() => {
					btn.textContent = "⭐ Save";
				}, 2000);
				return;
			}
			saved.push({ title, url, date: Date.now() });
			await chrome.storage.sync.set({ saved });
			btn.textContent = "✅ Saved";
			setTimeout(() => {
				btn.textContent = "⭐ Save";
			}, 2000);
		} catch (error) {
			console.error('PromptPin: Error saving conversation:', error);
		}
	};
	
	btn._saveClickHandler = saveClickHandler;
	btn.addEventListener("click", saveClickHandler);
}

// Setup navigation button functionality
function setupNavButton(btn) {
	// Remove existing listener to prevent duplicates  
	btn.removeEventListener('click', btn._navClickHandler);
	
	const navClickHandler = (e) => {
		e.stopPropagation(); // Prevent dragging when clicking button
		
		const panel = createNavigationPanel();
		
		if (panel.style.display === 'none' || !panel.style.display) {
			panel.style.display = 'block';
			updateNavigationPanel();
			btn.textContent = "📋 Hide";
		} else {
			panel.style.display = 'none';
			btn.textContent = "📋 Messages";
		}
	};
	
	btn._navClickHandler = navClickHandler;
	btn.addEventListener("click", navClickHandler);
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
			message.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

// Enhanced check to ensure buttons exist and are visible
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
	// Clear any existing heartbeat
	if (heartbeatInterval) {
		clearInterval(heartbeatInterval);
	}
	
	// Check every 3 seconds if buttons still exist
	heartbeatInterval = setInterval(() => {
		if (document.visibilityState === 'visible') {
			ensureButtonsExist();
		}
	}, 3000);
}

// Initialize floating buttons with better error handling
function initializeFloatingButtons() {
	try {
		// Remove any existing buttons from nav (cleanup)
		const existingNavButtons = document.querySelectorAll('#cgpt-saver-btn, #cgpt-nav-btn');
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
		if (!ensureButtonsExist()) {
			// Only reinitialize if buttons are actually missing
		}
		observerTimeout = null;
	}, 1000); // Throttle to once per second
}

// More selective MutationObserver
function setupMutationObserver() {
	const observer = new MutationObserver((mutations) => {
		// Only react to significant changes, not every small DOM update
		const significantChange = mutations.some(mutation => {
			// Check if our container was removed
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
			// Check for major structural changes
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
		subtree: false // Only observe direct children of body, not deep subtree
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

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'visible' && isInitialized) {
		// Page became visible, ensure buttons still exist
		setTimeout(ensureButtonsExist, 500);
	}
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
	if (heartbeatInterval) {
		clearInterval(heartbeatInterval);
	}
});
