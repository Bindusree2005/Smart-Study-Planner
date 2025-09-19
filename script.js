const LS_KEY = "smart-study-planner:v2";
let tasks = [];
const $ = id => document.getElementById(id);

// Load/Save
function load() {
  tasks = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
}
function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(tasks));
}

// Add/Update task
$("taskForm").addEventListener("submit", e => {
  e.preventDefault();
  const data = {
    id: e.target.dataset.editId || Date.now().toString(),
    title: $("title").value,
    subject: $("subject").value,
    due: $("due").value ? new Date($("due").value).toISOString() : null,
    recurring: $("recurring").value,
    estHours: $("estHours").value,
    priority: $("priority").value,
    notes: $("notes").value,
    done: false
  };
  if (e.target.dataset.editId) {
    tasks = tasks.map(t => t.id === data.id ? data : t);
    delete e.target.dataset.editId;
  } else {
    tasks.push(data);
  }
  save(); render(); e.target.reset();
});

// Render
function render() {
  const list = $("taskList");
  list.innerHTML = "";
  tasks.forEach(t => {
    const div = document.createElement("div");
    div.className = "task";
    div.innerHTML = `
      <div>
        <b>${t.title}</b> <span class="meta">(${t.subject || ""})</span><br/>
        <small>${t.due ? new Date(t.due).toLocaleString() : "No due date"}</small>
      </div>
      <div>
        <button class="ghost" onclick="toggleDone('${t.id}')">${t.done ? "Undo" : "Done"}</button>
        <button class="ghost" onclick="delTask('${t.id}')">Del</button>
      </div>`;
    list.appendChild(div);
  });
  $("count").textContent = `${tasks.length} tasks`;
  updateProgress();
}
function toggleDone(id) {
  const t = tasks.find(x => x.id === id);
  t.done = !t.done;
  // handle recurring
  if (t.done && t.recurring !== "none") {
    const d = new Date(t.due);
    if (t.recurring === "daily") d.setDate(d.getDate() + 1);
    if (t.recurring === "weekly") d.setDate(d.getDate() + 7);
    if (t.recurring === "monthly") d.setMonth(d.getMonth() + 1);
    t.due = d.toISOString();
    t.done = false; // reset for next occurrence
  }
  save(); render();
}
function delTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save(); render();
}
function updateProgress() {
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length || 1;
  const pct = Math.round((done/total)*100);
  $("percent").textContent = pct + "%";
  $("progressBar").style.width = pct + "%";
}

// Quick actions
$("clearAll").onclick = () => { if (confirm("Clear all?")) { tasks=[]; save(); render(); } };
$("printPlanner").onclick = () => window.print();

// Pomodoro
let pomoTimer, pomoTime = 25*60;
function updatePomodoro() {
  const m = String(Math.floor(pomoTime/60)).padStart(2,"0");
  const s = String(pomoTime%60).padStart(2,"0");
  $("pomodoroDisplay").textContent = `${m}:${s}`;
}
$("startPomodoro").onclick = () => {
  if (pomoTimer) return;
  pomoTimer = setInterval(() => {
    if (pomoTime > 0) pomoTime--;
    else {
      clearInterval(pomoTimer); pomoTimer=null;
      alert("Pomodoro finished! Take a 5 min break.");
      pomoTime = 5*60; updatePomodoro();
    }
    updatePomodoro();
  },1000);
};
$("resetPomodoro").onclick = () => {
  clearInterval(pomoTimer); pomoTimer=null;
  pomoTime = 25*60; updatePomodoro();
};
updatePomodoro();

// Init
load(); render();
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskRepeat = document.getElementById("taskRepeat");
const taskList = document.getElementById("taskList");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// 📝 Render tasks
function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.textContent = `${task.name} - Due: ${task.date} (${task.repeat})`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.onclick = () => {
      tasks.splice(index, 1);
      saveTasks();
    };

    li.appendChild(delBtn);
    taskList.appendChild(li);
  });
}

//  Save tasks to localStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

//  Add task
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newTask = {
    name: taskInput.value,
    date: taskDate.value,
    repeat: taskRepeat.value,  // 🔁 store repeat option
  };
  tasks.push(newTask);
  saveTasks();

  taskInput.value = "";
  taskDate.value = "";
  taskRepeat.value = "none";
});

//  Generate recurring tasks (simple version)
function generateRecurringTasks() {
  const today = new Date().toISOString().split("T")[0];

  tasks.forEach((task) => {
    if (task.repeat !== "none" && task.date === today) {
      let nextDate = new Date(task.date);

      if (task.repeat === "daily") {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (task.repeat === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (task.repeat === "monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      task.date = nextDate.toISOString().split("T")[0];
    }
  });

  saveTasks();
}

// Run recurring check each time page loads
generateRecurringTasks();
renderTasks();
