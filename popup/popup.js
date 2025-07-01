document.addEventListener("DOMContentLoaded", async () => {
        const listEl = document.getElementById("list");
        const searchEl = document.getElementById("search");
        const tpl = document.getElementById("item-template").content;
        const { saved = [] } = await chrome.storage.sync.get("saved");
        const all = saved.sort((a, b) => b.date - a.date);

        function render(items) {
                listEl.innerHTML = "";
                if (items.length === 0) {
                        const empty = document.createElement("div");
                        empty.className = "empty-state";
                        empty.innerHTML = "<h2>No chats found</h2><p>Try a different search.</p>";
                        listEl.appendChild(empty);
                        return;
                }

                items.forEach((item) => {
                        const li = tpl.cloneNode(true);
                        const link = li.querySelector("a");
                        link.textContent = item.title || "(untitled)";
                        link.href = item.url;
                        li.querySelector(".del").onclick = async () => {
                                const filtered = all.filter((s) => s.url !== item.url);
                                await chrome.storage.sync.set({ saved: filtered });
                                const index = all.findIndex((s) => s.url === item.url);
                                if (index !== -1) all.splice(index, 1);
                                render(filtered);
                        };
                        listEl.appendChild(li);
                });
        }

        searchEl.addEventListener("input", () => {
                const q = searchEl.value.toLowerCase();
                const filtered = all.filter(
                        (item) =>
                                (item.title && item.title.toLowerCase().includes(q)) ||
                                item.url.toLowerCase().includes(q)
                );
                render(filtered);
        });

        render(all);
});
