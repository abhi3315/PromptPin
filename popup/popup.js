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
                        const tagsInput = li.querySelector(".tags");
                        link.textContent = item.title || "(untitled)";
                        link.href = item.url;
                        tagsInput.value = item.tags ? item.tags.join(", ") : "";
                        tagsInput.addEventListener("change", async () => {
                                item.tags = tagsInput.value
                                        .split(",")
                                        .map((t) => t.trim())
                                        .filter(Boolean);
                                await chrome.storage.sync.set({ saved: all });
                        });
                        li.querySelector(".del").onclick = async () => {
                                const filtered = all.filter((s) => s.url !== item.url);
                                await chrome.storage.sync.set({ saved: filtered });
                                const index = all.findIndex((s) => s.url === item.url);
                                if (index !== -1) all.splice(index, 1);

                                const q = searchEl.value.toLowerCase();
                                const itemsToRender = q
                                        ? all.filter(
                                        (itm) =>
                                                (itm.title && itm.title.toLowerCase().includes(q)) ||
                                                itm.url.toLowerCase().includes(q) ||
                                                (itm.tags && itm.tags.some((tag) => tag.toLowerCase().includes(q)))
                                        )
                                        : filtered;

                                render(itemsToRender);
                        };
                        listEl.appendChild(li);
                });
        }

        searchEl.addEventListener("input", () => {
                const q = searchEl.value.toLowerCase();
                const filtered = all.filter(
                        (item) =>
                                (item.title && item.title.toLowerCase().includes(q)) ||
                                item.url.toLowerCase().includes(q) ||
                                (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(q)))
                );
                render(filtered);
        });

        render(all);
});
