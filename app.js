const STORAGE_KEY = "item-counts";
const itemById = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

let counts = loadCounts();
let currentCategory = "all";

function renderTabs() {
  const tabs = document.getElementById("tabs");
  const list = [{ id: "all", name: "すべて" }, ...CATEGORIES];
  tabs.innerHTML = list
    .map((c) => `<button type="button" data-cat="${c.id}" class="${c.id === currentCategory ? "active" : ""}">${c.name}</button>`)
    .join("");
  tabs.querySelectorAll("button").forEach((btn) =>
    btn.addEventListener("click", () => {
      currentCategory = btn.dataset.cat;
      renderTabs();
      renderResults();
    })
  );
}

function categoryName(id) {
  return CATEGORIES.find((c) => c.id === id)?.name ?? "";
}

function loadCounts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCounts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  } catch {}
}

function getCount(id) {
  return counts[id] || 0;
}

function setCount(id, value) {
  counts[id] = Math.max(0, Math.floor(Number(value) || 0));
  saveCounts();
}

// ----- アイテム一覧 -----
function renderItems() {
  const grid = document.getElementById("items");
  grid.innerHTML = "";

  for (const item of ITEMS) {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-img">
        <img src="${item.image}" alt="${item.name}">
        <span class="fallback">${item.name.charAt(0)}</span>
      </div>
      <div class="item-name">${item.name}</div>
      <div class="counter">
        <button type="button" data-step="-1" aria-label="${item.name}を減らす">−</button>
        <input type="number" min="0" inputmode="numeric" value="${getCount(item.id)}" aria-label="${item.name}の個数">
        <button type="button" data-step="1" aria-label="${item.name}を増やす">＋</button>
      </div>
    `;

    const img = card.querySelector("img");
    img.addEventListener("error", () => card.querySelector(".item-img").classList.add("no-img"));

    const input = card.querySelector("input");
    const update = (v) => {
      setCount(item.id, v);
      input.value = getCount(item.id);
      card.classList.toggle("owned", getCount(item.id) > 0);
      renderResults();
    };
    input.addEventListener("input", () => update(input.value));
    input.addEventListener("focus", () => input.select());
    card.querySelectorAll("button").forEach((btn) =>
      btn.addEventListener("click", () => update(getCount(item.id) + Number(btn.dataset.step)))
    );

    card.classList.toggle("owned", getCount(item.id) > 0);
    grid.appendChild(card);
  }
}

// ----- 判定 -----
function evaluate(recipe) {
  const missing = [];
  let totalMissing = 0;
  let totalRequired = 0;
  for (const [id, need] of Object.entries(recipe.requires)) {
    const lack = Math.max(0, need - getCount(id));
    totalRequired += need;
    if (lack > 0) {
      missing.push({ id, lack });
      totalMissing += lack;
    }
  }
  return { recipe, missing, totalMissing, totalRequired };
}

function requiresHtml(recipe) {
  return Object.entries(recipe.requires)
    .map(([id, need]) => {
      const have = getCount(id);
      const ok = have >= need;
      return `<span class="req ${ok ? "ok" : "ng"}">${itemById[id]?.name ?? id} ${have}/${need}</span>`;
    })
    .join("");
}

function catTag(recipe) {
  return currentCategory === "all" ? `<span class="cat cat-${recipe.category}">${categoryName(recipe.category)}</span>` : "";
}

function renderResults() {
  const results = RECIPES.filter((r) => currentCategory === "all" || r.category === currentCategory).map(evaluate);
  const can = results.filter((r) => r.totalMissing === 0);
  const almost = results
    .filter((r) => r.totalMissing > 0)
    .sort((a, b) => a.totalMissing - b.totalMissing || a.missing.length - b.missing.length);

  document.getElementById("can-count").textContent = can.length;

  const canEl = document.getElementById("can-make");
  canEl.innerHTML = can.length
    ? can
        .map((r) => `<li class="recipe can"><div class="recipe-name">${r.recipe.name}${catTag(r.recipe)}</div><div class="reqs">${requiresHtml(r.recipe)}</div></li>`)
        .join("")
    : `<li class="empty">まだ作れるものはありません</li>`;

  const almostEl = document.getElementById("almost");
  almostEl.innerHTML = almost.length
    ? almost
        .map((r) => {
          const lacks = r.missing
            .map((m) => `<span class="lack">${itemById[m.id]?.name ?? m.id} ×${m.lack}</span>`)
            .join("");
          return `<li class="recipe">
            <div class="recipe-head">
              <div class="recipe-name">${r.recipe.name}${catTag(r.recipe)}</div>
              <div class="total">あと <strong>${r.totalMissing}</strong> 個</div>
            </div>
            <div class="lacks">不足: ${lacks}</div>
            <div class="reqs">${requiresHtml(r.recipe)}</div>
          </li>`;
        })
        .join("")
    : `<li class="empty">なし</li>`;
}

// confirm() はブラウザや埋め込み環境で無効化されることがあるため、ボタン2度押しで確認する
const resetBtn = document.getElementById("reset");
let resetTimer = null;
resetBtn.addEventListener("click", () => {
  if (!resetBtn.classList.contains("confirm")) {
    resetBtn.classList.add("confirm");
    resetBtn.textContent = "もう一度押すと0に戻します";
    resetTimer = setTimeout(cancelReset, 3000);
    return;
  }
  cancelReset();
  counts = {};
  saveCounts();
  renderItems();
  renderResults();
});

function cancelReset() {
  clearTimeout(resetTimer);
  resetBtn.classList.remove("confirm");
  resetBtn.textContent = "リセット";
}

renderTabs();
renderItems();
renderResults();
