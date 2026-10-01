const lessons = [
  {
    id: 1,
    title: "Lesson 1",
    words: [
      { word: "Abandon", meaning: "ত্যাগ করা", example: "He abandoned the old house." },
      { word: "Ability", meaning: "ক্ষমতা", example: "She has the ability to learn quickly." },
      { word: "Brave", meaning: "সাহসী", example: "The brave boy helped the child." },
      { word: "Curious", meaning: "কৌতূহলী", example: "The curious student asked many questions." },
      { word: "Discover", meaning: "আবিষ্কার করা", example: "We discovered a new way to learn." }
    ]
  },
  {
    id: 2,
    title: "Lesson 2",
    words: [
      { word: "Calm", meaning: "শান্ত", example: "Please stay calm." },
      { word: "Create", meaning: "সৃষ্টি করা", example: "They create useful things." },
      { word: "Decide", meaning: "সিদ্ধান্ত নেওয়া", example: "I decided to study English." },
      { word: "Effort", meaning: "চেষ্টা", example: "Your effort will bring success." },
      { word: "Friendly", meaning: "বন্ধুসুলভ", example: "Our new teacher is friendly." }
    ]
  },
  {
    id: 3,
    title: "Lesson 3",
    words: [
      { word: "Eager", meaning: "আগ্রহী", example: "He is eager to learn." },
      { word: "Famous", meaning: "বিখ্যাত", example: "He is a famous writer." },
      { word: "Improve", meaning: "উন্নতি করা", example: "Practice will improve your English." },
      { word: "Journey", meaning: "যাত্রা", example: "Learning is a lifelong journey." },
      { word: "Kindness", meaning: "দয়া", example: "Kindness makes the world better." }
    ]
  }
];

const levelContainer = document.getElementById("level-container");
const wordContainer = document.getElementById("word-container");
const searchInput = document.getElementById("input-search");
const searchButton = document.getElementById("btn-search");
const spinner = document.getElementById("spinner");
const detailsContainer = document.getElementById("details-container");
const allWords = lessons.flatMap((lesson) => lesson.words);
let visibleWords = [];
let quizWord = null;
let quizOptions = [];

function getWordList(storageKey) {
  try {
    const words = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(words) ? words : [];
  } catch {
    return [];
  }
}

function setWordList(storageKey, words) {
  localStorage.setItem(storageKey, JSON.stringify(words));
}

function updateProgress() {
  const learnedWords = getWordList("learnedWords");
  const savedWords = getWordList("savedWords");
  const percent = Math.round((learnedWords.length / allWords.length) * 100);

  document.getElementById("stat-learned").textContent = learnedWords.length;
  document.getElementById("stat-total").textContent = allWords.length;
  document.getElementById("stat-saved").textContent = savedWords.length;
  document.getElementById("learning-progress").value = percent;
  document.getElementById("progress-label").textContent = `${percent}%`;
}

function renderSavedWords() {
  const savedWords = getWordList("savedWords");
  const savedItems = allWords.filter((item) => savedWords.includes(item.word));
  const savedContainer = document.getElementById("saved-container");

  if (!savedItems.length) {
    savedContainer.innerHTML = `
      <p class="font-bangla text-slate-500 col-span-full border-y border-slate-200 py-6">
        এখনো কোনো শব্দ save করা হয়নি। Lesson থেকে শব্দ save করলে এখানে দেখা যাবে।
      </p>
    `;
    return;
  }

  savedContainer.innerHTML = savedItems.map((item) => renderWordCard(item)).join("");
}

function toggleWordList(storageKey, word) {
  const words = getWordList(storageKey);
  const updatedWords = words.includes(word)
    ? words.filter((savedWord) => savedWord !== word)
    : [...words, word];

  setWordList(storageKey, updatedWords);
  renderSavedWords();
  updateProgress();
  renderWords(visibleWords);
  renderDailyWord();
}

function renderWordCard(item) {
  const saved = getWordList("savedWords").includes(item.word);
  const learned = getWordList("learnedWords").includes(item.word);

  return `
    <article class="bg-white rounded-md p-5 shadow-sm border border-slate-200">
      <h3 class="text-2xl font-bold mb-2">${item.word}</h3>
      <p class="font-bangla text-lg text-slate-600 mb-3">${item.meaning}</p>
      <p class="text-sm text-slate-500">${item.example}</p>
      <div class="flex flex-wrap gap-2 mt-4">
        <button class="btn btn-sm btn-outline btn-primary" onclick="toggleWordList('savedWords', '${item.word}')">
          <i class="fa-solid fa-bookmark"></i> ${saved ? "Saved" : "Save for review"}
        </button>
        <button class="btn btn-sm ${learned ? "btn-success" : "btn-ghost"}" onclick="toggleWordList('learnedWords', '${item.word}')">
          <i class="fa-solid fa-check"></i> ${learned ? "Learned" : "Mark learned"}
        </button>
      </div>
      <button class="btn btn-sm btn-primary mt-3" onclick="showDetails('${escapeHtml(item.word)}', '${escapeHtml(item.meaning)}', '${escapeHtml(item.example)}')">
        Details
      </button>
    </article>
  `;
}

function renderDailyWord() {
  const dayNumber = Math.floor(Date.now() / 86400000);
  const item = allWords[dayNumber % allWords.length];
  const learned = getWordList("learnedWords").includes(item.word);

  document.getElementById("daily-word").textContent = item.word;
  document.getElementById("daily-meaning").textContent = item.meaning;
  document.getElementById("daily-example").textContent = item.example;
  document.getElementById("daily-learned").innerHTML = learned
    ? '<i class="fa-solid fa-check"></i> Learned'
    : '<i class="fa-solid fa-check"></i> Mark as learned';
  document.getElementById("daily-learned").onclick = () => {
    if (!getWordList("learnedWords").includes(item.word)) {
      setWordList("learnedWords", [...getWordList("learnedWords"), item.word]);
      updateProgress();
      renderDailyWord();
      renderWords(allWords);
    }
  };
}

function startPractice() {
  quizWord = allWords[Math.floor(Math.random() * allWords.length)];
  quizOptions = [quizWord.meaning];

  while (quizOptions.length < Math.min(4, allWords.length)) {
    const meaning = allWords[Math.floor(Math.random() * allWords.length)].meaning;
    if (!quizOptions.includes(meaning)) quizOptions.push(meaning);
  }

  quizOptions.sort(() => Math.random() - 0.5);
  document.getElementById("quiz-word").textContent = quizWord.word;
  document.getElementById("quiz-feedback").textContent = "";
  document.getElementById("quiz-options").innerHTML = quizOptions.map((meaning, index) => `
    <button type="button" class="btn btn-outline justify-start font-bangla" data-answer="${index}">${meaning}</button>
  `).join("");
  document.getElementById("quiz-start").classList.add("hidden");
  document.getElementById("quiz-next").classList.add("hidden");

  document.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => checkAnswer(Number(button.dataset.answer)), { once: true });
  });
}

function checkAnswer(selectedIndex) {
  const isCorrect = quizOptions[selectedIndex] === quizWord.meaning;
  const feedback = document.getElementById("quiz-feedback");
  feedback.textContent = isCorrect
    ? "সঠিক উত্তর! খুব ভালো।"
    : `উত্তরটি ঠিক হয়নি। সঠিক অর্থ: ${quizWord.meaning}`;
  feedback.className = `font-bangla mt-4 min-h-6 ${isCorrect ? "text-emerald-700" : "text-rose-700"}`;
  document.querySelectorAll("[data-answer]").forEach((button) => {
    button.disabled = true;
    if (button.textContent === quizWord.meaning) button.classList.add("btn-success");
  });
  document.getElementById("quiz-next").classList.remove("hidden");
}

function renderLessons() {
  levelContainer.innerHTML = lessons.map((lesson) => `
    <button
      class="btn btn-outline btn-primary"
      onclick="selectLesson(${lesson.id})"
    >
      ${lesson.title}
    </button>
  `).join("");
}

function selectLesson(id) {
  const lesson = lessons.find(item => item.id === id);
  if (!lesson) return;

  renderWords(lesson.words);
}

function renderWords(words) {
  visibleWords = words;

  if (!words.length) {
    wordContainer.innerHTML = `
      <div class="text-center bg-sky-100 col-span-full rounded-xl py-10 font-bangla">
        <p class="text-xl font-medium text-gray-500">কোনো Vocabulary পাওয়া যায়নি।</p>
      </div>
    `;
    return;
  }

  wordContainer.innerHTML = words.map((item) => renderWordCard(item)).join("");
}

function showDetails(word, meaning, example) {
  detailsContainer.innerHTML = `
    <h2 class="text-3xl font-bold">${word}</h2>
    <p class="font-bangla text-xl"><strong>Meaning:</strong> ${meaning}</p>
    <p><strong>Example:</strong> ${example}</p>
  `;

  document.getElementById("word_modal").showModal();
}

function searchVocabulary() {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    wordContainer.innerHTML = `
      <div class="text-center bg-sky-100 col-span-full rounded-xl py-10 space-y-6 font-bangla">
        <p class="text-xl font-medium text-gray-400">
          আপনি এখনো কোন Lesson Select করেন নি
        </p>
        <h2 class="font-bold text-4xl">একটি Lesson Select করুন।</h2>
      </div>
    `;
    return;
  }

  spinner.classList.remove("hidden");

  setTimeout(() => {
    const results = allWords.filter(item =>
      item.word.toLowerCase().includes(query) ||
      item.meaning.toLowerCase().includes(query)
    );

    renderWords(results);
    spinner.classList.add("hidden");
  }, 300);
}

function escapeHtml(value) {
  return value.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

searchButton.addEventListener("click", searchVocabulary);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchVocabulary();
  }
});

function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("fullName");
  localStorage.removeItem("email");
  window.location.replace("login.html");
}

const learnerName = localStorage.getItem("fullName") || localStorage.getItem("username") || "Learner";
document.getElementById("learner-name").textContent = learnerName;
document.getElementById("quiz-start").addEventListener("click", startPractice);
document.getElementById("quiz-next").addEventListener("click", startPractice);

updateProgress();
renderSavedWords();
renderDailyWord();
renderLessons();
