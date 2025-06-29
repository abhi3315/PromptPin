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
	
	// Add drag handle with visual indicator
	const dragHandle = document.createElement('div');
	dragHandle.className = 'cgpt-drag-handle';
	dragHandle.innerHTML = '⋮⋮';
	dragHandle.title = 'Drag to move';
	
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
	
	// Add minimize/expand toggle
	const toggleBtn = document.createElement('button');
	toggleBtn.id = 'cgpt-toggle-btn';
	toggleBtn.textContent = '−';
	toggleBtn.className = 'cgpt-toggle-btn';
	toggleBtn.title = 'Minimize/Expand';
	
	container.appendChild(dragHandle);
	container.appendChild(saveBtn);
	container.appendChild(navBtn);
	container.appendChild(toggleBtn);
	document.body.appendChild(container);
	
	// Load saved position or use default
	loadButtonPosition(container);
	
	// Make container draggable with improved UX
	makeDraggableAdvanced(container, dragHandle);
	
	// Add button functionality
	setupSaveButton(saveBtn);
	setupNavButton(navBtn);
	setupToggleButton(toggleBtn, container);
	
	console.log('PromptPin: Floating buttons created');
	return container;
}

// Advanced draggable functionality with better UX
function makeDraggableAdvanced(container, dragHandle) {
	let isDragging = false;
	let startX, startY, initialX, initialY;
	let dragPreview = null;
	
	// Remove existing listeners
	dragHandle.removeEventListener('mousedown', dragHandle._dragStart);
	
	function createDragPreview() {
		const preview = container.cloneNode(true);
		preview.id = 'cgpt-drag-preview';
		preview.className = container.className + ' cgpt-drag-preview';
		preview.style.opacity = '0.7';
		preview.style.transform = container.style.transform;
		preview.style.pointerEvents = 'none';
		preview.style.zIndex = '10001';
		document.body.appendChild(preview);
		return preview;
	}
	
	function getSnapPosition(x, y) {
		const containerRect = container.getBoundingClientRect();
		const snapThreshold = 30;
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;
		
		let snapX = x;
		let snapY = y;
		
		// Snap to edges
		if (x < snapThreshold) snapX = 10; // Left edge
		if (x + containerRect.width > windowWidth - snapThreshold) snapX = windowWidth - containerRect.width - 10; // Right edge
		if (y < snapThreshold) snapY = 10; // Top edge
		if (y + containerRect.height > windowHeight - snapThreshold) snapY = windowHeight - containerRect.height - 10; // Bottom edge
		
		// Snap to center
		const centerX = (windowWidth - containerRect.width) / 2;
		const centerY = (windowHeight - containerRect.height) / 2;
		
		if (Math.abs(x - centerX) < snapThreshold) snapX = centerX;
		if (Math.abs(y - centerY) < snapThreshold) snapY = centerY;
		
		return { x: snapX, y: snapY };
	}
	
	function showSnapGuides(snapPos) {
		removeSnapGuides();
		
		const guide = document.createElement('div');
		guide.id = 'cgpt-snap-guide';
		guide.className = 'cgpt-snap-guide';
		
		// Show different guides based on snap position
		const containerRect = container.getBoundingClientRect();
		if (snapPos.x === 10) { // Left snap
			guide.style.left = '10px';
			guide.style.top = '0';
			guide.style.width = '2px';
			guide.style.height = '100vh';
		} else if (snapPos.x === window.innerWidth - containerRect.width - 10) { // Right snap
			guide.style.right = '10px';
			guide.style.top = '0';
			guide.style.width = '2px';
			guide.style.height = '100vh';
		} else if (snapPos.x === (window.innerWidth - containerRect.width) / 2) { // Center snap
			guide.style.left = '50%';
			guide.style.top = '0';
			guide.style.width = '2px';
			guide.style.height = '100vh';
			guide.style.transform = 'translateX(-50%)';
		}
		
		document.body.appendChild(guide);
	}
	
	function removeSnapGuides() {
		const existingGuide = document.getElementById('cgpt-snap-guide');
		if (existingGuide) existingGuide.remove();
	}
	
	function dragStart(e) {
		e.preventDefault();
		isDragging = true;
		
		// Visual feedback
		container.classList.add('cgpt-dragging');
		dragHandle.style.cursor = 'grabbing';
		document.body.style.userSelect = 'none';
		
		// Create drag preview
		dragPreview = createDragPreview();
		
		// Store initial positions
		const rect = container.getBoundingClientRect();
		startX = e.clientX;
		startY = e.clientY;
		initialX = rect.left;
		initialY = rect.top;
		
		// Add global event listeners
		document.addEventListener('mousemove', dragMove);
		document.addEventListener('mouseup', dragEnd);
		
		// Haptic feedback (if supported)
		if (navigator.vibrate) {
			navigator.vibrate(10);
		}
	}
	
	function dragMove(e) {
		if (!isDragging) return;
		e.preventDefault();
		
		const deltaX = e.clientX - startX;
		const deltaY = e.clientY - startY;
		
		let newX = initialX + deltaX;
		let newY = initialY + deltaY;
		
		// Keep within bounds
		const containerRect = container.getBoundingClientRect();
		newX = Math.max(0, Math.min(newX, window.innerWidth - containerRect.width));
		newY = Math.max(0, Math.min(newY, window.innerHeight - containerRect.height));
		
		// Check for snap positions
		const snapPos = getSnapPosition(newX, newY);
		const isSnapping = Math.abs(snapPos.x - newX) < 30 || Math.abs(snapPos.y - newY) < 30;
		
		if (isSnapping) {
			showSnapGuides(snapPos);
			dragPreview.style.transform = `translate(${snapPos.x}px, ${snapPos.y}px)`;
			dragPreview.classList.add('cgpt-snapping');
		} else {
			removeSnapGuides();
			dragPreview.style.transform = `translate(${newX}px, ${newY}px)`;
			dragPreview.classList.remove('cgpt-snapping');
		}
	}
	
	function dragEnd(e) {
		if (!isDragging) return;
		
		isDragging = false;
		container.classList.remove('cgpt-dragging');
		dragHandle.style.cursor = 'grab';
		document.body.style.userSelect = '';
		
		// Calculate final position with snapping
		const deltaX = e.clientX - startX;
		const deltaY = e.clientY - startY;
		
		let finalX = initialX + deltaX;
		let finalY = initialY + deltaY;
		
		// Keep within bounds
		const containerRect = container.getBoundingClientRect();
		finalX = Math.max(0, Math.min(finalX, window.innerWidth - containerRect.width));
		finalY = Math.max(0, Math.min(finalY, window.innerHeight - containerRect.height));
		
		// Apply snapping
		const snapPos = getSnapPosition(finalX, finalY);
		finalX = snapPos.x;
		finalY = snapPos.y;
		
		// Animate to final position
		container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
		container.style.transform = `translate(${finalX}px, ${finalY}px)`;
		
		// Save position
		saveButtonPosition(finalX, finalY);
		
		// Cleanup
		setTimeout(() => {
			container.style.transition = '';
		}, 300);
		
		if (dragPreview) {
			dragPreview.remove();
			dragPreview = null;
		}
		
		removeSnapGuides();
		
		// Remove global event listeners
		document.removeEventListener('mousemove', dragMove);
		document.removeEventListener('mouseup', dragEnd);
		
		// Haptic feedback (if supported)
		if (navigator.vibrate) {
			navigator.vibrate(20);
		}
	}
	
	// Store reference and add event listener
	dragHandle._dragStart = dragStart;
	dragHandle.addEventListener('mousedown', dragStart);
	
	// Add hover effects
	dragHandle.addEventListener('mouseenter', () => {
		if (!isDragging) {
			dragHandle.style.cursor = 'grab';
			container.classList.add('cgpt-drag-hover');
		}
	});
	
	dragHandle.addEventListener('mouseleave', () => {
		if (!isDragging) {
			container.classList.remove('cgpt-drag-hover');
		}
	});
}

// Setup toggle button functionality
function setupToggleButton(btn, container) {
	let isMinimized = false;
	
	btn.addEventListener('click', (e) => {
		e.stopPropagation();
		
		const buttons = container.querySelectorAll('.cgpt-floating-btn');
		
		if (isMinimized) {
			// Expand
			buttons.forEach((button, index) => {
				setTimeout(() => {
					button.style.display = 'flex';
					button.style.animation = 'cgptSlideIn 0.2s ease-out forwards';
				}, index * 50);
			});
			btn.textContent = '−';
			btn.title = 'Minimize';
			container.classList.remove('cgpt-minimized');
		} else {
			// Minimize
			buttons.forEach((button, index) => {
				button.style.animation = 'cgptSlideOut 0.2s ease-in forwards';
				setTimeout(() => {
					button.style.display = 'none';
				}, 200);
			});
			btn.textContent = '+';
			btn.title = 'Expand';
			container.classList.add('cgpt-minimized');
		}
		
		isMinimized = !isMinimized;
	});
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
