document.addEventListener("DOMContentLoaded", async () => {
	const listEl = document.getElementById("list");
	const tpl = document.getElementById("item-template").content;
	const { saved = [] } = await chrome.storage.sync.get("saved");

	saved
		.sort((a, b) => b.date - a.date)
		.forEach((item) => {
			const li = tpl.cloneNode(true);
			const link = li.querySelector("a");
			link.textContent = item.title || "(untitled)";
			link.href = item.url;
			li.querySelector(".del").onclick = async () => {
				const filtered = saved.filter((s) => s.url !== item.url);
				await chrome.storage.sync.set({ saved: filtered });
				li.remove();
			};
			listEl.appendChild(li);
		});
});
