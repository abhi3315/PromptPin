// Inject a “Save ⭐” button into the chat header (once per page load).
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

// Run on initial load + whenever SPA navigation changes URL
insertSaveButton();
const observer = new MutationObserver(insertSaveButton);
observer.observe(document.body, { childList: true, subtree: true });
