// Inject a "Save ⭐" button into the chat header (once per page load).
function insertSaveButton() {
	const header = document.querySelector("nav"); // ChatGPT top bar
	if (!header || header.querySelector("#cgpt-saver-btn")) return;

	const btn = document.createElement("button");
	btn.id = "cgpt-saver-btn";
	btn.textContent = "⭐ Save";
	btn.className = "cgpt-saver"; // styled in style.css
	header.appendChild(btn);

	btn.addEventListener("click", async () => {
		const title = document.title.replace(" - ChatGPT", "");
		const url = location.href;

		// Pull existing list, add new item if not present
		const { saved = [] } = await chrome.storage.sync.get("saved");
		if (saved.some((item) => item.url === url)) {
			btn.textContent = "✅ Saved";
			return;
		}
		saved.push({ title, url, date: Date.now() });
		await chrome.storage.sync.set({ saved });
		btn.textContent = "✅ Saved";
	});
}

// Create and manage the navigation panel
function createNavigationPanel() {
	const panel = document.createElement('div');
	panel.id = 'cgpt-nav-panel';
	panel.style.cssText = `
		position: fixed;
		right: 20px;
		top: 80px;
		width: 250px;
		max-height: 70vh;
		background: white;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		padding: 12px;
		overflow-y: auto;
		z-index: 1000;
		box-shadow: 0 2px 6px rgba(0,0,0,0.1);
		display: none;
	`;
	document.body.appendChild(panel);
	return panel;
}

function updateNavigationPanel() {
	const panel = document.getElementById('cgpt-nav-panel') || createNavigationPanel();
	const messages = document.querySelectorAll('[data-message-author-role]');
	
	panel.innerHTML = '<h3 style="margin: 0 0 12px 0; font-size: 14px;">Message Navigation</h3>';
	
	messages.forEach((message, index) => {
		const role = message.getAttribute('data-message-author-role');
		const text = message.textContent.trim().slice(0, 50) + (message.textContent.length > 50 ? '...' : '');
		const button = document.createElement('button');
		button.style.cssText = `
			display: block;
			width: 100%;
			text-align: left;
			padding: 8px;
			margin: 4px 0;
			border: 1px solid #e5e5e5;
			color: #000;
			border-radius: 4px;
			background: ${role === 'user' ? '#f0f7ff' : '#f5f5f5'};
			cursor: pointer;
			font-size: 12px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		`;
		button.textContent = `${role === 'user' ? '👤' : '🤖'} ${text}`;
		button.onclick = () => {
			message.scrollIntoView({ behavior: 'smooth', block: 'center' });
		};
		panel.appendChild(button);
	});
}

function insertNavButton() {
	const header = document.querySelector("nav");
	if (!header || header.querySelector("#cgpt-nav-btn")) return;

	const btn = document.createElement("button");
	btn.id = "cgpt-nav-btn";
	btn.textContent = "📋 Messages";
	btn.className = "cgpt-saver";
	header.appendChild(btn);

	const panel = document.getElementById('cgpt-nav-panel') || createNavigationPanel();
	
	btn.addEventListener("click", () => {
		if (panel.style.display === 'none') {
			panel.style.display = 'block';
			updateNavigationPanel();
		} else {
			panel.style.display = 'none';
		}
	});
}

// Run on initial load + whenever SPA navigation changes URL
insertSaveButton();
insertNavButton();
const observer = new MutationObserver(() => {
	insertSaveButton();
	insertNavButton();
});
observer.observe(document.body, { childList: true, subtree: true });
