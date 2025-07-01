function createTagChip(tag, item, all) {
        const chip = document.createElement("span");
        chip.className = "tag-chip";
        chip.textContent = tag;
        const btn = document.createElement("button");
        btn.textContent = "×";
        btn.onclick = async () => {
                const idx = item.tags.indexOf(tag);
                if (idx !== -1) item.tags.splice(idx, 1);
                chip.remove();
                await chrome.storage.sync.set({ saved: all });
        };
        chip.appendChild(btn);
        return chip;
}

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

                const groups = {};
                items.forEach((it) => {
                        const col = it.collection || "Unsorted";
                        if (!groups[col]) groups[col] = [];
                        groups[col].push(it);
                });

                Object.entries(groups).forEach(([col, arr]) => {
                        const header = document.createElement("li");
                        header.className = "collection-header";
                        header.textContent = col;
                        listEl.appendChild(header);

                        arr.forEach((item) => {
                                const li = tpl.cloneNode(true);
                                const link = li.querySelector("a");
                                const tagsEl = li.querySelector(".tags");
                                const tagInput = li.querySelector(".tag-input");
                                link.textContent = item.title || "(untitled)";
                                link.href = item.url;

                                tagsEl.onclick = () => {
                                        tagInput.style.display = "inline-block";
                                        tagInput.focus();
                                };

                                tagInput.addEventListener("keydown", async (e) => {
                                        if (e.key === "Enter" && tagInput.value.trim()) {
                                                const t = tagInput.value.trim();
                                                item.tags = item.tags || [];
                                                item.tags.push(t);
                                                tagsEl.appendChild(createTagChip(t, item, all));
                                                tagInput.value = "";
                                                tagInput.style.display = "none";
                                                await chrome.storage.sync.set({ saved: all });
                                        } else if (e.key === "Escape") {
                                                tagInput.value = "";
                                                tagInput.style.display = "none";
                                        }
                                });

                                if (item.tags) {
                                        item.tags.forEach((t) => tagsEl.appendChild(createTagChip(t, item, all)));
                                }

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
                                                                  (itm.collection && itm.collection.toLowerCase().includes(q)) ||
                                                                  (itm.tags && itm.tags.some((tag) => tag.toLowerCase().includes(q)))
                                                  )
                                                : filtered;

                                        render(itemsToRender);
                                };
                                listEl.appendChild(li);
                        });
                });
        }

        searchEl.addEventListener("input", () => {
                const q = searchEl.value.toLowerCase();
                const filtered = all.filter(
                        (item) =>
                                (item.title && item.title.toLowerCase().includes(q)) ||
                                item.url.toLowerCase().includes(q) ||
                                (item.collection && item.collection.toLowerCase().includes(q)) ||
                                (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(q)))
                );
                render(filtered);
        });

        render(all);
});

if (typeof module !== "undefined" && module.exports) {
        module.exports = { createTagChip };
}
