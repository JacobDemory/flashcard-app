const STORAGE_KEY = "flashcard-app-cards";
const PROGRESS_KEY = "flashcard-app-progress";

const defaultCards = [
  { id: crypto.randomUUID(), term: "HTML", definition: "HyperText Markup Language", category: "Web Dev" },
  { id: crypto.randomUUID(), term: "CSS", definition: "Cascading Style Sheets", category: "Web Dev" },
  { id: crypto.randomUUID(), term: "JavaScript", definition: "Programming language of the web", category: "Web Dev" },
  { id: crypto.randomUUID(), term: "DOM", definition: "Document Object Model used to represent and update a web page", category: "Web Dev" }
];

let flashcards = loadCards();
let progress = loadProgress();
let filteredCards = [...flashcards];
let currentIndex = 0;
let showingTerm = true;

const elements = {
  flashcard: document.getElementById("flashcard"),
  cardLabel: document.getElementById("card-label"),
  cardContent: document.getElementById("card-content"),
  cardPosition: document.getElementById("card-position"),
  cardCategory: document.getElementById("card-category"),
  totalCount: document.getElementById("total-count"),
  reviewedCount: document.getElementById("reviewed-count"),
  masteredCount: document.getElementById("mastered-count"),
  progressPercent: document.getElementById("progress-percent"),
  categoryFilter: document.getElementById("category-filter"),
  newTerm: document.getElementById("new-term"),
  newDefinition: document.getElementById("new-definition"),
  newCategory: document.getElementById("new-category"),
  statusMessage: document.getElementById("status-message"),
  cardList: document.getElementById("card-list")
};

function loadCards() {
  const savedCards = localStorage.getItem(STORAGE_KEY);
  return savedCards ? JSON.parse(savedCards) : defaultCards;
}

function loadProgress() {
  const savedProgress = localStorage.getItem(PROGRESS_KEY);
  return savedProgress ? JSON.parse(savedProgress) : {};
}

function saveCards() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flashcards));
}

function saveProgress() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function displayCard() {
  if (filteredCards.length === 0) {
    elements.cardLabel.textContent = "No Cards";
    elements.cardContent.textContent = "Add a card or choose a different category.";
    elements.cardPosition.textContent = "Card 0 of 0";
    elements.cardCategory.textContent = "";
    return;
  }

  const card = filteredCards[currentIndex];
  const side = showingTerm ? "term" : "definition";

  elements.cardLabel.textContent = showingTerm ? "Term" : "Definition";
  elements.cardContent.textContent = card[side];
  elements.cardPosition.textContent = `Card ${currentIndex + 1} of ${filteredCards.length}`;
  elements.cardCategory.textContent = card.category;
  elements.flashcard.classList.toggle("showing-definition", !showingTerm);
}

function updateStats() {
  const reviewed = Object.values(progress).filter((cardProgress) => cardProgress.reviewed).length;
  const mastered = Object.values(progress).filter((cardProgress) => cardProgress.mastered).length;
  const percent = flashcards.length === 0 ? 0 : Math.round((mastered / flashcards.length) * 100);

  elements.totalCount.textContent = flashcards.length;
  elements.reviewedCount.textContent = reviewed;
  elements.masteredCount.textContent = mastered;
  elements.progressPercent.textContent = `${percent}%`;
}

function markReviewed(cardId) {
  progress[cardId] = {
    reviewed: true,
    mastered: progress[cardId]?.mastered || false
  };
  saveProgress();
  updateStats();
}

function toggleCard() {
  if (filteredCards.length === 0) return;

  showingTerm = !showingTerm;
  markReviewed(filteredCards[currentIndex].id);
  displayCard();
}

function nextCard() {
  if (filteredCards.length === 0) return;

  currentIndex = (currentIndex + 1) % filteredCards.length;
  showingTerm = true;
  displayCard();
}

function prevCard() {
  if (filteredCards.length === 0) return;

  currentIndex = (currentIndex - 1 + filteredCards.length) % filteredCards.length;
  showingTerm = true;
  displayCard();
}

function addCard() {
  const term = elements.newTerm.value.trim();
  const definition = elements.newDefinition.value.trim();
  const category = elements.newCategory.value.trim() || "General";

  if (!term || !definition) {
    showStatus("Please fill in both the term and definition.");
    return;
  }

  const newCard = {
    id: crypto.randomUUID(),
    term,
    definition,
    category
  };

  flashcards.push(newCard);
  saveCards();

  elements.newTerm.value = "";
  elements.newDefinition.value = "";
  elements.newCategory.value = "";

  showStatus(`Added \"${term}\" to your deck.`);
  refreshDeck();
}

function deleteCard(cardId) {
  flashcards = flashcards.filter((card) => card.id !== cardId);
  delete progress[cardId];
  saveCards();
  saveProgress();
  currentIndex = 0;
  showingTerm = true;
  refreshDeck();
}

function markMastered() {
  if (filteredCards.length === 0) return;

  const cardId = filteredCards[currentIndex].id;
  progress[cardId] = {
    reviewed: true,
    mastered: true
  };
  saveProgress();
  updateStats();
  renderCardList();
  showStatus("Card marked as mastered.");
}

function resetProgress() {
  progress = {};
  saveProgress();
  updateStats();
  renderCardList();
  showStatus("Progress reset.");
}

function shuffleCards() {
  filteredCards = [...filteredCards].sort(() => Math.random() - 0.5);
  currentIndex = 0;
  showingTerm = true;
  displayCard();
}

function populateCategories() {
  const categories = [...new Set(flashcards.map((card) => card.category))].sort();
  const selectedValue = elements.categoryFilter.value || "all";

  elements.categoryFilter.innerHTML = '<option value="all">All Cards</option>';

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.categoryFilter.appendChild(option);
  });

  elements.categoryFilter.value = categories.includes(selectedValue) ? selectedValue : "all";
}

function filterCards() {
  const selectedCategory = elements.categoryFilter.value;
  filteredCards = selectedCategory === "all"
    ? [...flashcards]
    : flashcards.filter((card) => card.category === selectedCategory);

  currentIndex = 0;
  showingTerm = true;
  displayCard();
  renderCardList();
}

function renderCardList() {
  elements.cardList.innerHTML = "";

  if (filteredCards.length === 0) {
    elements.cardList.textContent = "No cards in this category yet.";
    return;
  }

  filteredCards.forEach((card) => {
    const cardItem = document.createElement("article");
    cardItem.className = "card-list-item";

    const masteredBadge = progress[card.id]?.mastered ? "Mastered" : "In Progress";

    cardItem.innerHTML = `
      <div>
        <strong>${escapeHtml(card.term)}</strong>
        <p>${escapeHtml(card.definition)}</p>
        <small>${escapeHtml(card.category)} • ${masteredBadge}</small>
      </div>
      <button type="button" aria-label="Delete ${escapeHtml(card.term)}">Delete</button>
    `;

    cardItem.querySelector("button").addEventListener("click", () => deleteCard(card.id));
    elements.cardList.appendChild(cardItem);
  });
}

function showStatus(message) {
  elements.statusMessage.textContent = message;
  setTimeout(() => {
    elements.statusMessage.textContent = "";
  }, 3000);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function refreshDeck() {
  populateCategories();
  filterCards();
  updateStats();
}

document.getElementById("next-btn").addEventListener("click", nextCard);
document.getElementById("prev-btn").addEventListener("click", prevCard);
document.getElementById("add-card-btn").addEventListener("click", addCard);
document.getElementById("mastered-btn").addEventListener("click", markMastered);
document.getElementById("shuffle-btn").addEventListener("click", shuffleCards);
document.getElementById("reset-progress-btn").addEventListener("click", resetProgress);
elements.categoryFilter.addEventListener("change", filterCards);
elements.flashcard.addEventListener("click", toggleCard);
elements.flashcard.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleCard();
  }
});

refreshDeck();
