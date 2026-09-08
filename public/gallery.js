const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const emptyStateEl = document.getElementById("emptyState");
const emptyStateTitle = document.getElementById("emptyStateTitle");
const emptyStateBody = document.getElementById("emptyStateBody");
const emptyStateCta = document.getElementById("emptyStateCta");
const tagFiltersEl = document.getElementById("tagFilters");
const headerRight = document.getElementById("headerRight");
const modal = document.getElementById("modal");
const player = document.getElementById("player");
const closeModal = document.getElementById("closeModal");
const watchOnYoutube = document.getElementById("watchOnYoutube");

let allVideos = [];
let activeTag = null;
let modalOpenedFromLink = false;
let isAdmin = false;
let connected = false;

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function renderHeader() {
  if (!isAdmin) {
    headerRight.innerHTML = "";
    return;
  }

  const statusBadge = connected
    ? `<span class="hidden sm:flex items-center gap-1.5 text-xs text-stone-400 bg-surface2 border border-stone-800 rounded-full px-2.5 py-1">
        <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>Connected
      </span>`
    : `<span class="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 bg-surface2 border border-stone-800 rounded-full px-2.5 py-1">
        <span class="w-1.5 h-1.5 rounded-full bg-stone-600"></span>Not connected
      </span>`;

  const primaryAction = connected
    ? `<a href="/upload.html" class="bg-ember text-ink text-sm font-medium px-4 py-2 rounded-full hover:bg-emberBright transition-colors">Add video</a>`
    : `<a href="/upload.html" class="bg-ember text-ink text-sm font-medium px-4 py-2 rounded-full hover:bg-emberBright transition-colors">Link YouTube</a>`;

  headerRight.innerHTML = `
    ${statusBadge}
    ${primaryAction}
    <button id="logoutBtn" aria-label="Log out" title="Log out" class="text-stone-600 hover:text-stone-300 transition-colors p-1.5">
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 17l5-5-5-5M20 12H9M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  `;

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    location.reload();
  });
}

function render() {
  const videos = activeTag ? allVideos.filter((v) => v.tags.includes(activeTag)) : allVideos;

  if (!videos.length) {
    grid.innerHTML = "";
    return;
  }

  grid.innerHTML = videos
    .map(
      (v) => `
    <div class="group cursor-pointer" data-id="${v.id}">
      <div class="aspect-video rounded-lg overflow-hidden bg-surface relative">
        <img src="${v.thumbnail}" alt="${v.title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${v.id}/hqdefault.jpg'" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <span class="text-xs text-stone-200">▶ Watch</span>
        </div>
      </div>
      <div class="pt-3">
        <h3 class="font-medium text-sm text-stone-100 mb-1 line-clamp-2">${v.title}</h3>
        <p class="text-xs text-stone-500 mb-2">${fmtDate(v.publishedAt)}</p>
        <div class="flex flex-wrap gap-1.5 mb-2">
          ${v.tags.map((t) => `<span class="text-xs bg-surface2 text-ember/90 px-2 py-0.5 rounded-full">${t}</span>`).join("")}
        </div>
        <div class="flex items-center gap-1 text-xs">
          <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener" aria-label="Watch on YouTube" title="Watch on YouTube" class="p-1.5 -ml-1.5 rounded text-stone-500 hover:text-ember transition-colors" onclick="event.stopPropagation()">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 10l4.55-2.5a1 1 0 011.45.89v7.22a1 1 0 01-1.45.89L15 14M5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
          <button data-copy="${v.id}" aria-label="Copy share link" title="Copy share link" class="p-1.5 rounded text-stone-500 hover:text-stone-200 transition-colors" onclick="event.stopPropagation()">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 007.07 0l2-2a5 5 0 00-7.07-7.07l-1 1M14 11a5 5 0 00-7.07 0l-2 2a5 5 0 007.07 7.07l1-1" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          ${isAdmin ? `<button data-delete="${v.id}" aria-label="Remove from DewBox" title="Remove from DewBox" class="p-1.5 rounded text-stone-600 hover:text-red-400 transition-colors ml-auto" onclick="event.stopPropagation()">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>` : ""}
        </div>
      </div>
    </div>
  `
    )
    .join("");

  grid.querySelectorAll("[data-id]").forEach((el) => {
    el.addEventListener("click", () => openModal(el.dataset.id, true));
  });

  grid.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => copyShareLink(btn.dataset.copy, btn));
  });

  grid.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => removeVideo(btn.dataset.delete));
  });
}

const checkIcon = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function copyShareLink(videoId, btn) {
  const url = `${location.origin}/?v=${videoId}`;
  navigator.clipboard
    .writeText(url)
    .then(() => {
      const original = btn.innerHTML;
      btn.innerHTML = checkIcon;
      btn.classList.add("text-green-400");
      setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove("text-green-400");
      }, 1500);
    })
    .catch(() => {
      btn.title = "Copy failed";
    });
}

async function removeVideo(videoId) {
  if (!confirm("Remove this video from DewBox? It will stay on YouTube, just hidden here.")) return;

  try {
    const res = await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
    const data = await res.json();
    if (data.error) {
      alert(`Failed to remove: ${data.error}`);
      return;
    }
    allVideos = allVideos.filter((v) => v.id !== videoId);
    renderTagFilters();
    render();
  } catch (err) {
    alert(`Failed to remove: ${err.message}`);
  }
}

function renderTagFilters() {
  const tags = [...new Set(allVideos.flatMap((v) => v.tags))].sort();
  if (!tags.length) {
    tagFiltersEl.innerHTML = "";
    return;
  }
  tagFiltersEl.innerHTML = tags
    .map(
      (t) => `<button data-tag="${t}" class="text-xs px-3.5 py-1.5 rounded-full border transition-colors ${
        activeTag === t
          ? "bg-ember text-ink border-ember font-medium"
          : "border-stone-700 text-stone-400 hover:border-ember hover:text-ember"
      }">${t}</button>`
    )
    .join("");

  tagFiltersEl.querySelectorAll("[data-tag]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTag = activeTag === btn.dataset.tag ? null : btn.dataset.tag;
      renderTagFilters();
      render();
    });
  });
}

function openModal(videoId, updateUrl) {
  player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  watchOnYoutube.href = `https://www.youtube.com/watch?v=${videoId}`;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  if (updateUrl) {
    history.pushState({}, "", `${location.pathname}?v=${videoId}`);
  }
}

closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  player.src = "";
  history.pushState({}, "", location.pathname);
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal.click();
});

async function checkAdmin() {
  try {
    const res = await fetch("/api/session");
    const data = await res.json();
    isAdmin = !!data.authenticated;
  } catch {
    isAdmin = false;
  }
}

function showEmptyState({ title, body, showCta }) {
  emptyStateTitle.textContent = title;
  emptyStateBody.textContent = body;
  emptyStateCta.classList.toggle("hidden", !showCta || !isAdmin);
  emptyStateEl.classList.remove("hidden");
}

async function load() {
  try {
    await checkAdmin();
    const res = await fetch("/api/videos");
    const data = await res.json();

    if (data.error) {
      statusEl.textContent = "";
      if (data.error === "Channel not connected yet") {
        connected = false;
        renderHeader();
        showEmptyState(
          isAdmin
            ? {
                title: "Link your YouTube channel",
                body: "Connect your channel to start adding videos to your portfolio.",
                showCta: false,
              }
            : { title: "Portfolio coming soon", body: "Check back shortly.", showCta: false }
        );
        if (isAdmin) {
          emptyStateCta.textContent = "Link YouTube";
          emptyStateCta.href = "/upload.html";
          emptyStateCta.classList.remove("hidden");
        }
      } else {
        statusEl.textContent = `Error: ${data.error}`;
      }
      return;
    }

    connected = true;
    renderHeader();
    allVideos = data.videos ?? [];
    statusEl.textContent = "";

    if (!allVideos.length) {
      emptyStateCta.textContent = "Add your first video";
      emptyStateCta.href = "/upload.html";
      showEmptyState({
        title: "No videos yet",
        body: "Once videos are added, they'll show up here.",
        showCta: true,
      });
    } else {
      emptyStateEl.classList.add("hidden");
    }

    renderTagFilters();
    render();

    const requestedId = new URLSearchParams(location.search).get("v");
    if (requestedId && !modalOpenedFromLink) {
      modalOpenedFromLink = true;
      openModal(requestedId, false);
    }
  } catch (err) {
    statusEl.textContent = `Failed to load: ${err.message}`;
  }
}

load();
setInterval(load, 30000);
