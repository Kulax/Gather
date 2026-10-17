const stories = [
  { id: "garden", title: "The quiet magic of growing things", category: "Nature", format: "Article", duration: "6 min read", source: "Orion Magazine", art: "garden", tags: ["Nature", "Mindfulness"], summary: "What a small backyard garden can teach us about patience, resilience, and paying attention.", fullSummary: "A tiny patch of green can become an unexpected teacher. This story follows gardeners who found that tending living things changed how they understood patience, seasons, and the joy of small progress." },
  { id: "space", title: "What the night sky is trying to tell us", category: "Science", format: "Video", duration: "12 min watch", source: "Aperture", art: "space", tags: ["Science", "Culture"], summary: "An astronomer's field guide to the cosmic stories hiding above our rooftops.", fullSummary: "Astronomer Aisha Rahman takes us from familiar constellations to distant galaxies, showing how looking up connects the everyday to deep time and gives us a fresh perspective on our place in the universe." },
  { id: "coffee", title: "Why your best ideas arrive on a walk", category: "Creativity", format: "Podcast", duration: "22 min listen", source: "Good Question", art: "coffee", tags: ["Creativity", "Mindfulness"], summary: "A behavioral scientist on movement, mind-wandering, and getting unstuck.", fullSummary: "Behavioral scientist Jonah Lee unpacks why gentle movement can help ideas flow. The conversation explores mind-wandering, creative blocks, and a few practical ways to make room for better thinking." },
  { id: "ocean", title: "The ocean has a memory", category: "Nature", format: "Article", duration: "9 min read", source: "Emergence", art: "ocean", tags: ["Nature", "Science"], summary: "Researchers are learning to listen to the long, changing rhythms of the sea.", fullSummary: "Oceanographers are assembling decades of sound, temperature, and current data to understand how the sea remembers change. Their findings reveal a living record—and new ways to protect fragile marine ecosystems." },
  { id: "architecture", title: "Rooms that make space for wonder", category: "Design", format: "Video", duration: "8 min watch", source: "Openhouse", art: "architecture", tags: ["Design", "Culture"], summary: "Inside homes designed to invite a little more curiosity into the everyday.", fullSummary: "Architects and residents share how light, open sightlines, and unexpected details can turn an ordinary home into a place that encourages attention, discovery, and connection." },
  { id: "music", title: "The songs we carry from childhood", category: "Culture", format: "Podcast", duration: "18 min listen", source: "Small Hours", art: "music", tags: ["Culture", "Creativity"], summary: "A warm conversation about family, memory, and the music that stays with us.", fullSummary: "Musician Lena Ortiz talks about the songs passed between generations and how a familiar melody can bring back a whole room, a language, or a person we miss." },
  { id: "food", title: "A more generous way to eat", category: "Food", format: "Article", duration: "5 min read", source: "Gather Journal", art: "food", tags: ["Food", "Culture"], summary: "A chef's thoughtful guide to making everyday meals more joyful and less fussy.", fullSummary: "Chef Remy Cho makes the case for cooking with what is already on hand. Through seasonal recipes and family stories, this practical guide reframes the kitchen as a place for generosity, not perfection." },
  { id: "design", title: "The objects that make a home", category: "Design", format: "Article", duration: "7 min read", source: "Kinfolk", art: "design", tags: ["Design", "Mindfulness"], summary: "A designer looks at the humble, well-loved things that give a space its soul.", fullSummary: "Designer Farah Ali visits three homes to explore why well-loved objects matter more than pristine interiors. Each small collection offers a map of the memories, rituals, and people that make a place feel like home." },
  { id: "wildlife", title: "A field guide to noticing birds", category: "Nature", format: "Video", duration: "10 min watch", source: "Fieldnotes", art: "wildlife", tags: ["Nature", "Mindfulness"], summary: "Learn five familiar bird calls and meet the naturalists finding joy in listening.", fullSummary: "Naturalist Theo Martin offers an inviting introduction to common bird calls. Along the way, he shares how listening closely can transform a familiar neighborhood into a much wilder place." },
];

const interests = ["Creativity", "Science", "Nature", "Design", "Culture", "Mindfulness", "Food"];
const formatFilters = ["For you", "Articles", "Videos", "Podcasts"];
const storageKeys = { interests: "gather.interests", saved: "gather.saved" };
const readStored = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
};
let selectedInterests = readStored(storageKeys.interests, ["Creativity", "Science", "Nature"]);
selectedInterests = selectedInterests.filter((item) => interests.includes(item));
if (!selectedInterests.length) selectedInterests = ["Creativity", "Science", "Nature"];
let savedStories = readStored(storageKeys.saved, []);
savedStories = savedStories.filter((id) => id === "feature" || stories.some((story) => story.id === id));
let activeFormat = "For you";
let activeTopic = "";
let activeView = "discover";
let searchTerm = "";
let toastTimer;

const byId = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);
const storyScore = (story) => story.tags.reduce((score, tag) => score + (selectedInterests.includes(tag) ? 1 : 0), 0);
const featureStory = {
  id: "feature",
  title: "The underrated art of paying attention",
  category: "Creativity",
  format: "Article",
  duration: "8 min read",
  source: "The Creative Independent",
  summary: "A gentle case for noticing more: how the smallest observations can change the way we make, think, and move through the world.",
  fullSummary: "A thoughtful invitation to notice the small details hiding in ordinary life—and to use that attention as a source of creativity. Through conversations with artists and makers, the story explores how slowing down helps us reconnect with our surroundings and find fresh ideas.",
  tags: ["Creativity", "Mindfulness"],
};

function persist() {
  localStorage.setItem(storageKeys.interests, JSON.stringify(selectedInterests));
  localStorage.setItem(storageKeys.saved, JSON.stringify(savedStories));
}

function formatIcon(format) {
  return { Article: "▤", Video: "▷", Podcast: "◖" }[format] || "▤";
}

function renderInterests() {
  byId("interest-list").innerHTML = selectedInterests.map((interest) =>
    `<button class="interest-chip ${activeTopic === interest ? "selected" : ""}" data-topic="${escapeHtml(interest)}">${escapeHtml(interest)}</button>`
  ).join("");
  document.querySelectorAll(".interest-chip").forEach((button) => {
    button.addEventListener("click", () => {
      activeTopic = activeTopic === button.dataset.topic ? "" : button.dataset.topic;
      activeView = "discover";
      updateNavigation();
      renderInterests();
      renderStories();
    });
  });
}

function renderFilters() {
  byId("filter-row").innerHTML = formatFilters.map((filter) =>
    `<button class="filter-chip ${activeFormat === filter ? "active" : ""}" data-format="${filter}">${filter}</button>`
  ).join("");
  document.querySelectorAll(".filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      activeFormat = button.dataset.format;
      activeView = "discover";
      updateNavigation();
      renderFilters();
      renderStories();
    });
  });
}

function getVisibleStories() {
  let result = activeView === "saved"
    ? stories.filter((story) => savedStories.includes(story.id))
    : [...stories];
  if (activeView === "saved" && savedStories.includes("feature")) result = [featureStory, ...result];
  if (activeTopic) result = result.filter((story) => story.tags.includes(activeTopic));
  if (activeFormat !== "For you") {
    const format = activeFormat.slice(0, -1);
    result = result.filter((story) => story.format === format);
  }
  if (searchTerm) {
    const query = searchTerm.toLowerCase();
    result = result.filter((story) => [story.title, story.category, story.source, story.summary, ...story.tags].join(" ").toLowerCase().includes(query));
  }
  if (activeView !== "saved") result.sort((left, right) => storyScore(right) - storyScore(left));
  return result;
}

function renderStories() {
  const visible = getVisibleStories();
  byId("feed-heading").textContent = activeView === "saved" ? "Your saved stories" : activeTopic ? `${activeTopic}, for you` : "Made for your mind";
  byId("feed-subtitle").textContent = activeView === "saved"
    ? "A little shelf for the stories you want to come back to."
    : activeTopic ? `Handpicked stories about ${activeTopic.toLowerCase()}.` : "A fresh mix based on what you're into.";
  byId("feed-subtitle").textContent = searchTerm ? `Results for “${searchTerm}”.` : byId("feed-subtitle").textContent;
  byId("story-grid").innerHTML = visible.map((story) => {
    const saved = savedStories.includes(story.id);
    const match = storyScore(story) > 0 ? story.tags.find((tag) => selectedInterests.includes(tag)) : "";
    return `<article class="story-card" data-open-story="${escapeHtml(story.id)}">
      <div class="story-art art-${escapeHtml(story.art || "design")}">
        <span class="card-format">${formatIcon(story.format)} &nbsp;${escapeHtml(story.format)}</span>
        <button class="card-save ${saved ? "saved" : ""}" data-save="${escapeHtml(story.id)}" aria-label="${saved ? "Remove saved story" : "Save story"}">${saved ? "♥" : "♡"}</button>
      </div>
      <div class="card-copy">
        <p class="card-category">${escapeHtml(story.category)}</p>
        <h3>${escapeHtml(story.title)}</h3>
        <p class="card-summary">${escapeHtml(story.summary)}</p>
        <div class="card-footer"><span class="card-source">${escapeHtml(story.source)} · ${escapeHtml(story.duration)}</span>${match ? `<span class="match-tag">For you</span>` : ""}</div>
      </div>
    </article>`;
  }).join("");
  byId("empty-state").classList.toggle("hidden", visible.length > 0);
  byId("story-grid").classList.toggle("hidden", visible.length === 0);
  byId("saved-count").textContent = String(savedStories.length);
  document.querySelectorAll(".story-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-save]")) return;
      openStory(card.dataset.openStory);
    });
  });
  document.querySelectorAll("[data-save]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleSaved(button.dataset.save);
    });
  });
  updateFeatureBookmark();
}

function updateFeatureBookmark() {
  const button = document.querySelector('.bookmark-button[data-save="feature"]');
  if (!button) return;
  const saved = savedStories.includes("feature");
  button.classList.toggle("saved", saved);
  button.textContent = saved ? "♥" : "♡";
  button.setAttribute("aria-label", saved ? "Remove featured story from saved" : "Save featured story");
}

function toggleSaved(id) {
  savedStories = savedStories.includes(id) ? savedStories.filter((savedId) => savedId !== id) : [...savedStories, id];
  persist();
  renderStories();
  const saved = savedStories.includes(id);
  showToast(saved ? "Added to your reading shelf." : "Removed from your reading shelf.");
  if (activeView === "saved" && !saved) closeDialog();
}

function updateNavigation() {
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === activeView));
  byId("breadcrumb-page").textContent = activeView === "saved" ? "Saved" : "Discover";
  byId("welcome-title").innerHTML = activeView === "saved" ? "Your reading shelf<span class=\"heading-period\">.</span>" : "Good morning, Alex<span class=\"heading-period\">.</span>";
  byId("welcome-subtitle").textContent = activeView === "saved" ? "Stories you saved for another moment." : "A few thoughtful finds, picked just for you.";
  byId("feature-card").classList.toggle("hidden", activeView === "saved");
}

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function showDialog(content) {
  byId("dialog-content").innerHTML = content;
  byId("modal-backdrop").classList.remove("hidden");
  byId("dialog-close").focus();
}

function closeDialog() {
  byId("modal-backdrop").classList.add("hidden");
}

function openPreferences() {
  const options = interests.map((interest) =>
    `<button type="button" class="interest-option ${selectedInterests.includes(interest) ? "active" : ""}" data-interest="${escapeHtml(interest)}">${escapeHtml(interest)}</button>`
  ).join("");
  showDialog(`<p class="dialog-kicker">Make it yours</p><h2 id="dialog-title">What are you curious about?</h2>
    <p class="dialog-intro">Pick a few interests and we'll use them to bring the good stuff closer. Choose at least one.</p>
    <div class="interest-options">${options}</div><button class="primary-button" id="save-preferences">Save my interests</button>`);
  document.querySelectorAll("[data-interest]").forEach((button) => {
    button.addEventListener("click", () => {
      const interest = button.dataset.interest;
      if (selectedInterests.includes(interest)) selectedInterests = selectedInterests.filter((item) => item !== interest);
      else selectedInterests.push(interest);
      button.classList.toggle("active", selectedInterests.includes(interest));
      byId("save-preferences").disabled = selectedInterests.length === 0;
    });
  });
  byId("save-preferences").disabled = selectedInterests.length === 0;
  byId("save-preferences").addEventListener("click", () => {
    persist();
    activeTopic = "";
    renderInterests();
    renderStories();
    closeDialog();
    showToast("Your feed is finding a new rhythm.");
  });
}

function getStory(id) {
  return id === "feature" ? featureStory : stories.find((story) => story.id === id);
}

function openStory(id) {
  const story = getStory(id);
  if (!story) return;
  showDialog(`<p class="dialog-kicker">${escapeHtml(story.category)} · ${escapeHtml(story.duration)}</p>
    <h2 id="dialog-title">${escapeHtml(story.title)}</h2>
    <p class="dialog-intro">From ${escapeHtml(story.source)}. A small moment of discovery, chosen for your curious mind.</p>
    <div class="ai-answer">${escapeHtml(story.fullSummary)}</div>
    <p class="ai-mode">A quick preview to help you decide if this story is for you.</p>
    <div class="dialog-actions"><button class="primary-button" id="ai-summarize" data-story="${escapeHtml(story.id)}">✳ &nbsp; Ask AI to explore this</button>
    <button class="secondary-button" id="story-save" data-save="${escapeHtml(story.id)}">${savedStories.includes(story.id) ? "♥ Saved" : "♡ Save for later"}</button></div>`);
  byId("ai-summarize").addEventListener("click", () => askAI(story, "explain"));
  byId("story-save").addEventListener("click", () => {
    toggleSaved(story.id);
    if (!byId("modal-backdrop").classList.contains("hidden")) byId("story-save").textContent = savedStories.includes(story.id) ? "♥ Saved" : "♡ Save for later";
  });
}

async function askAI(story, action) {
  const button = byId("ai-summarize");
  const answer = document.querySelector(".ai-answer");
  const mode = document.querySelector(".ai-mode");
  button.disabled = true;
  button.textContent = "✳  Finding the right words...";
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, title: story.title, summary: story.fullSummary, interests: selectedInterests }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "The AI couldn't respond. Please try again.");
    answer.textContent = payload.text;
    mode.textContent = payload.mode === "gemini" ? "A fresh perspective, with Gemini." : "Demo insight · add a Gemini API key to power this with AI.";
    button.textContent = "✳  Ask AI to explore this";
  } catch (error) {
    showToast(error.message || "Couldn't reach the AI service. Please try again.");
    button.textContent = "✳  Try again";
  } finally {
    button.disabled = false;
  }
}

function showDigest() {
  const picks = [...stories].sort((a, b) => storyScore(b) - storyScore(a)).slice(0, 3);
  showDialog(`<p class="dialog-kicker">✳ &nbsp; A thoughtful little catch-up</p><h2 id="dialog-title">Your daily digest</h2>
    <p class="dialog-intro">Three stories for the spaces between everything else.</p>
    <div>${picks.map((story) => `<div class="digest-story"><strong>${escapeHtml(story.title)}</strong><span>${escapeHtml(story.summary)}</span></div>`).join("")}</div>
    <div class="dialog-actions"><button class="primary-button" id="digest-ai">✳ &nbsp; Make this more personal</button></div>
    <p class="ai-mode">A handpicked demo digest · add a Gemini API key for an AI-written edition.</p>`);
  byId("digest-ai").addEventListener("click", async () => {
    const button = byId("digest-ai");
    button.disabled = true;
    button.textContent = "✳  Putting your edition together...";
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "digest", title: "Your daily digest", summary: picks.map((story) => `${story.title}: ${story.fullSummary}`).join("\n"), interests: selectedInterests }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The AI couldn't respond. Please try again.");
      showDialog(`<p class="dialog-kicker">✳ &nbsp; Your personalized edition</p><h2 id="dialog-title">A little inspiration for today.</h2><div class="ai-answer">${escapeHtml(payload.text)}</div><p class="ai-mode">${payload.mode === "gemini" ? "Written just for you, with Gemini." : "Demo insight · add a Gemini API key to power this with AI."}</p>`);
    } catch (error) {
      showToast(error.message || "Couldn't reach the AI service. Please try again.");
      button.disabled = false;
      button.textContent = "✳  Make this more personal";
    }
  });
}

function init() {
  const now = new Date();
  byId("edition-date").textContent = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  byId("welcome-title").innerHTML = `${greeting}, Alex<span class="heading-period">.</span>`;
  renderInterests();
  renderFilters();
  renderStories();
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => {
      activeView = button.dataset.view;
      activeTopic = "";
      activeFormat = "For you";
      updateNavigation();
      renderInterests();
      renderFilters();
      renderStories();
    });
  });
  byId("edit-interests").addEventListener("click", openPreferences);
  byId("open-preferences").addEventListener("click", openPreferences);
  byId("digest-button").addEventListener("click", showDigest);
  byId("feature-read").addEventListener("click", () => openStory("feature"));
  byId("clear-filter").addEventListener("click", () => {
    activeTopic = "";
    activeFormat = "For you";
    renderInterests();
    renderFilters();
    renderStories();
  });
  byId("reset-view").addEventListener("click", () => {
    searchTerm = "";
    activeTopic = "";
    activeFormat = "For you";
    activeView = "discover";
    byId("search-input").value = "";
    updateNavigation();
    renderInterests();
    renderFilters();
    renderStories();
  });
  byId("search-input").addEventListener("input", (event) => {
    searchTerm = event.target.value.trim();
    renderStories();
  });
  document.querySelectorAll(".bookmark-button").forEach((button) => button.addEventListener("click", () => toggleSaved(button.dataset.save)));
  byId("dialog-close").addEventListener("click", closeDialog);
  byId("modal-backdrop").addEventListener("click", (event) => {
    if (event.target === byId("modal-backdrop")) closeDialog();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDialog();
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      byId("search-input").focus();
    }
  });
}

init();
