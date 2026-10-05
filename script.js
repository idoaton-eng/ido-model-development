const STORAGE_KEY = "IDO_MODEL_DEVELOPMENT_V2";

const defaultState = {
  name: "Ido",
  height: 187,
  weight: 83.5,
  stepsGoal: 8000,
  steps: 0,
  workouts: 0,
  tasks: {
    steps: false,
    movement: false,
    food: false
  },
  food: [false, false, false, false],
  week: [false, false, false, false, false, false, false],
  customMeals: []
};

function safeNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);

  try {
    const parsed = JSON.parse(raw);

    return {
      ...structuredClone(defaultState),
      ...parsed,
      tasks: {
        ...structuredClone(defaultState.tasks),
        ...(parsed.tasks || {})
      },
      food: Array.isArray(parsed.food)
        ? parsed.food.map((v) => Boolean(v))
        : structuredClone(defaultState.food),
      week: Array.isArray(parsed.week)
        ? parsed.week.map((v) => Boolean(v))
        : structuredClone(defaultState.week),
      customMeals: Array.isArray(parsed.customMeals) ? parsed.customMeals : []
    };
  } catch {
    return structuredClone(defaultState);
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message = "נשמר ✓") {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1600);
}

document.querySelectorAll(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.screen;

    document.querySelectorAll(".nav-button").forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.remove("active");
    });

    const screenEl = $(`screen-${target}`);
    if (screenEl) screenEl.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

function updateTodayProgress() {
  const values = Object.values(state.tasks);
  const completed = values.filter(Boolean).length;
  const percentage = Math.round((completed / values.length) * 100);

  const ring = $("progressRing");
  const number = $("progressNumber");

  if (ring) {
    ring.style.setProperty("--progress", `${percentage * 3.6}deg`);
  }

  if (number) {
    number.textContent = `${percentage}%`;
  }
}

function renderTasks() {
  const tasks = [
    {
      key: "steps",
      title: "יעד צעדים",
      subtitle: `${state.steps.toLocaleString()} / ${state.stepsGoal.toLocaleString()}`
    },
    {
      key: "movement",
      title: "אימון / תנועה",
      subtitle: "לשמור על הגוף בתנועה"
    },
    {
      key: "food",
      title: "ארוחות מסודרות",
      subtitle: "חלבון + אוכל פשוט"
    }
  ];

  const container = $("todayTasks");
  if (!container) return;

  container.innerHTML = tasks
    .map((task) => {
      const done = Boolean(state.tasks[task.key]);
      return `
        <div class="task-item">
          <div>
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-subtitle">${escapeHtml(task.subtitle)}</div>
          </div>
          <button
            class="check ${done ? "done" : ""}"
            aria-label="${done ? "סיום משימה" : "לא הושלם"}"
            onclick="toggleTask('${task.key}')"
          >
            ${done ? "✓" : ""}
          </button>
        </div>
      `;
    })
    .join("");
}

function toggleTask(key) {
  state.tasks[key] = !state.tasks[key];
  saveState();
  render();
}

function renderBody() {
  const bodyHeight = $("bodyHeight");
  const bodyWeight = $("bodyWeight");
  const metricHeight = $("metricHeight");
  const metricWeight = $("metricWeight");

  if (bodyHeight) bodyHeight.textContent = state.height;
  if (bodyWeight) bodyWeight.textContent = state.weight;
  if (metricHeight) metricHeight.textContent = `${state.height} cm`;
  if (metricWeight) metricWeight.textContent = `${state.weight} kg`;
}

function renderTodayStats() {
  const todayWeight = $("todayWeight");
  const todaySteps = $("todaySteps");

  if (todayWeight) todayWeight.textContent = Number(state.weight).toFixed(1);
  if (todaySteps) todaySteps.textContent = Number(state.steps).toLocaleString();
}

function renderWeek() {
  const container = $("weekTracker");
  if (!container) return;

  const days = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
  container.innerHTML = days
    .map((day, index) => {
      const done = Boolean(state.week[index]);
      return `
        <div class="day ${done ? "done" : ""}" onclick="toggleWeekDay(${index})">
          ${day}
          <div class="day-circle">${done ? "✓" : "·"}</div>
        </div>
      `;
    })
    .join("");
}

function toggleWeekDay(index) {
  state.week[index] = !state.week[index];
  saveState();
  render();
}

function renderTraining() {
  const count = Math.min(state.workouts, 3);
  const counter = $("workoutCounter");
  const progress = $("workoutProgress");

  if (counter) counter.textContent = `${count} / 3`;
  if (progress) progress.style.width = `${(count / 3) * 100}%`;
}

function completeWorkout() {
  if (state.workouts < 3) {
    state.workouts += 1;
  }

  state.tasks.movement = true;

  const today = new Date().getDay();
  state.week[today] = true;

  saveState();
  render();
  showToast("האימון נשמר ✓");
}

function renderFood() {
  const meals = ["Breakfast", "Lunch", "Snack", "Dinner"];
  const container = $("foodTracker");
  if (!container) return;

  container.innerHTML = meals
    .map((meal, index) => {
      const done = Boolean(state.food[index]);
      return `
        <div class="task-item">
          <div>
            <div class="task-title">${meal}</div>
            <div class="task-subtitle">
              ${done ? "סומן כהושלם" : "עדיין לא סומן"}
            </div>
          </div>
          <button
            class="check ${done ? "done" : ""}"
            aria-label="${done ? "סמן כלא הושלם" : "סמן כהושלם"}"
            onclick="toggleFood(${index})"
          >
            ${done ? "✓" : ""}
          </button>
        </div>
      `;
    })
    .join("");

  state.tasks.food = state.food.filter(Boolean).length >= 3;
}

function toggleFood(index) {
  state.food[index] = !state.food[index];
  state.tasks.food = state.food.filter(Boolean).length >= 3;
  saveState();
  render();
}

function renderProfile() {
  const profileName = $("profileName");
  const profileNameInput = $("profileNameInput");
  const profileHeightInput = $("profileHeightInput");
  const profileWeightInput = $("profileWeightInput");
  const profileStepsInput = $("profileStepsInput");
  const profileStepsGoal = $("profileStepsGoal");

  if (profileName) profileName.textContent = `${state.name.toUpperCase()}.`;
  if (profileNameInput) profileNameInput.value = state.name;
  if (profileHeightInput) profileHeightInput.value = state.height;
  if (profileWeightInput) profileWeightInput.value = state.weight;
  if (profileStepsInput) profileStepsInput.value = state.stepsGoal;
  if (profileStepsGoal) profileStepsGoal.textContent = state.stepsGoal.toLocaleString();
}

function saveProfile() {
  state.name = $("profileNameInput").value.trim() || "Ido";
  state.height = safeNumber($("profileHeightInput").value, state.height);
  state.weight = safeNumber($("profileWeightInput").value, state.weight);
  state.stepsGoal = Math.max(1, safeNumber($("profileStepsInput").value, state.stepsGoal));

  saveState();
  render();
  showToast("הפרופיל עודכן ✓");
}

function openEditModal() {
  $("editWeight").value = state.weight;
  $("editSteps").value = state.steps;
  $("editModal").classList.add("open");
  $("editModal").setAttribute("aria-hidden", "false");
}

function closeEditModal() {
  $("editModal").classList.remove("open");
  $("editModal").setAttribute("aria-hidden", "true");
}

function saveTodayData() {
  state.weight = safeNumber($("editWeight").value, state.weight);
  state.steps = Math.max(0, safeNumber($("editSteps").value, state.steps));
  state.tasks.steps = state.steps >= state.stepsGoal;

  saveState();
  render();
  closeEditModal();
  showToast("הנתונים עודכנו ✓");
}

function openMenuModal() {
  $("menuModal").classList.add("open");
  $("menuModal").setAttribute("aria-hidden", "false");
}

function closeMenuModal() {
  $("menuModal").classList.remove("open");
  $("menuModal").setAttribute("aria-hidden", "true");
}

function addMeal() {
  const type = $("newMealType").value;
  const text = $("newMealText").value.trim();

  if (!text) {
    showToast("כתוב קודם מה אכלת");
    return;
  }

  state.customMeals.push({
    type,
    text,
    date: new Date().toISOString()
  });

  saveState();
  $("newMealText").value = "";
  closeMenuModal();
  showToast("הארוחה נוספה ✓");
}

function resetApp() {
  const confirmed = confirm("לאפס את נתוני המעקב?");
  if (!confirmed) return;

  state = structuredClone(defaultState);
  saveState();
  render();
  showToast("המעקב אופס");
}

function renderGreeting() {
  const hour = new Date().getHours();
  let greeting = "LET'S BUILD.";

  if (hour < 12) {
    greeting = "GOOD MORNING.";
  } else if (hour < 18) {
    greeting = "KEEP GOING.";
  } else {
    greeting = "GOOD EVENING.";
  }

  const el = $("todayGreeting");
  if (el) el.textContent = greeting;
}

function evaluateFoodAnswer(question) {
  const text = question.toLowerCase();

  if (!text.trim()) {
    return {
      allowed: false,
      message: "כתוב משהו כדי שאוכל לבדוק."
    };
  }

  const healthyWords = [
    "עוף", "גוף", "פרגית", "ביצה", "טופו", "דג", "סלמון", "אנשובי",
    "יוגורט", "שיבולת", "אורז", "קינואה", "חומוס", "עדשים", "ירקות",
    "סלט", "אבוקדו", "בננה", "תפוח", "אוכמניות", "קיווי", "טחינה",
    "אגוזים", "פיקוח", "פלאפל", "סויה", "קוטג'", "גבינה", "קציצה",
    "פסטה", "תפוח אדמה", "קטניות"
  ];

  const badWords = [
    "עוגיה", "ביסקוויט", "חטיף", "שוקולד", "עוגות", "ממתק", "סוכר",
    "סודה", "קולה", "פיצה", "שניצל", "פריך", "משומר", "חמוצים",
    "מזון מהיר", "פלאפל בשמן", "מאפה", "דונאט", "קציצות שמן",
    "שמן עמוק", "בגט", "לחם לבן", "פיתה גדולה"
  ];

  const strongGood = healthyWords.some((word) => text.includes(word));
  const strongBad = badWords.some((word) => text.includes(word));

  const containsAllow = text.includes("אפשר") || text.includes("יכול") || text.includes("מותר");
  const containsNot = text.includes("לא") || text.includes("אסור") || text.includes("לא מומלץ");

  if (strongBad && !strongGood) {
    return {
      allowed: false,
      message: "לא מומלץ כרגע. זה מזון יותר מעובד, מתוק או שמן מדי, ולכן עדיף לבחור אלטרנטיבה יותר נקייה."
    };
  }

  if (strongGood && !strongBad) {
    return {
      allowed: true,
      message: "כן — זה מתאים למטרת התזונה שלך, במיוחד אם יש חלבון, ירקות או פחמימה בריאה בארוחה."
    };
  }

  if (strongBad && strongGood) {
    return {
      allowed: true,
      message: "יש כאן מרכיבים טובים אבל גם רכיב פחות מתאים. אם אתה רוצה, עדיף להוריד את החלק היותר מעובד או השמן ולהשאיר את החלבון והירקות."
    };
  }

  if (containsAllow && !containsNot) {
    return {
      allowed: true,
      message: "כן, בדרך כלל אפשר — רק חשוב לשמור על איזון, חלבון וירקות בתוך הארוחה."
    };
  }

  if (containsNot && !containsAllow) {
    return {
      allowed: false,
      message: "בדרך כלל לא מומלץ כרגע. עדיף לבחור משהו יותר מאוזן ובריא."
    };
  }

  return {
    allowed: true,
    message: "בדרך כלל כן — אם זה לא כולל רכיבים מעובדים מדי, שמנים עמוקים או סוכר מיותר."
  };
}

function checkFoodQuestion() {
  const raw = $("foodQuestionInput").value.trim();
  if (!raw) {
    showToast("כתוב שאלה ראשונה");
    return;
  }

  const result = evaluateFoodAnswer(raw);
  const box = $("foodAnswerBox");

  box.classList.remove("yes", "no");

  if (result.allowed) {
    box.classList.add("yes");
    box.innerHTML = `
      <span class="answer-title">כן</span>
      ${result.message}
    `;
  } else {
    box.classList.add("no");
    box.innerHTML = `
      <span class="answer-title">לא</span>
      ${result.message}
    `;
  }
}

function render() {
  renderGreeting();
  renderTasks();
  renderTodayStats();
  renderBody();
  renderWeek();
  renderTraining();
  renderFood();
  renderProfile();
  updateTodayProgress();
}

$("editModal").addEventListener("click", (event) => {
  if (event.target.id === "editModal") closeEditModal();
});

$("menuModal").addEventListener("click", (event) => {
  if (event.target.id === "menuModal") closeMenuModal();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}

render();
