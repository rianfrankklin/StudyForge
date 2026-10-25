
// Simple Study Tracker: records and settings are saved in this browser.
var records = JSON.parse(localStorage.getItem("studyRecords")) || [];
var savedUser = JSON.parse(localStorage.getItem("studyUser")) || null;
var dailyGoal = Number(localStorage.getItem("studyGoal")) || 4;

var authPage = document.getElementById("authPage");
var appPage = document.getElementById("appPage");
var authForm = document.getElementById("authForm");
var studyForm = document.getElementById("studyForm");
var studyDate = document.getElementById("studyDate");
var today = new Date().toLocaleDateString("en-CA");
studyDate.value = today;

function saveRecords() {
  localStorage.setItem("studyRecords", JSON.stringify(records));
}

function showApp() {
  authPage.classList.add("hidden");
  appPage.classList.remove("hidden");
  var firstName = savedUser.name.split(" ")[0];
  var hour = new Date().getHours();
  var greeting = hour < 12 ? "Good morning, " : (hour < 18 ? "Good afternoon, " : "Good evening, ");
  document.getElementById("welcomeText").textContent = greeting + firstName;
  document.getElementById("sideUserName").textContent = savedUser.name;
  document.getElementById("userAvatar").textContent = firstName.charAt(0).toUpperCase();
  document.getElementById("topAvatar").textContent = firstName.charAt(0).toUpperCase();
  document.getElementById("headerDate").textContent = new Date().toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
  document.getElementById("todayLabel").textContent = "Here is your learning snapshot for today.";
  document.getElementById("dailyGoal").value = dailyGoal;
  updatePage();
}

authForm.addEventListener("submit", function(event) {
  event.preventDefault();
  var name = document.getElementById("userName").value.trim();
  var email = document.getElementById("userEmail").value.trim();
  var password = document.getElementById("userPassword").value;
  if (name === "" || email === "" || password.length < 6) {
    alert("Please enter your name, email and a password with at least 6 characters.");
    return;
  }
  // Demo only: do not use real passwords in this local-only example.
  savedUser = { name: name, email: email };
  localStorage.setItem("studyUser", JSON.stringify(savedUser));
  showApp();
});

document.getElementById("logoutBtn").addEventListener("click", function() {
  appPage.classList.add("hidden");
  authPage.classList.remove("hidden");
  document.getElementById("userPassword").value = "";
});

studyForm.addEventListener("submit", function(event) {
  event.preventDefault();
  var subject = document.getElementById("subject").value.trim();
  var topic = document.getElementById("topic").value.trim();
  var date = studyDate.value;
  var hours = Number(document.getElementById("studyHours").value);
  if (subject === "" || date === "" || hours <= 0 || hours > 24) {
    alert("Please enter a subject, date and a study time between 0.25 and 24 hours.");
    return;
  }
  records.push({ id: Date.now(), subject: subject, topic: topic, date: date, hours: hours });
  saveRecords();
  studyForm.reset();
  studyDate.value = today;
  document.getElementById("formMessage").textContent = "Study record saved!";
  updatePage();
});

document.getElementById("saveGoalBtn").addEventListener("click", function() {
  var value = Number(document.getElementById("dailyGoal").value);
  if (value < 1 || value > 16) {
    alert("Choose a daily goal from 1 to 16 hours.");
    return;
  }
  dailyGoal = value;
  localStorage.setItem("studyGoal", dailyGoal);
  updatePage();
});

document.getElementById("searchInput").addEventListener("input", showHistory);

function hoursForDate(date) {
  var total = 0;
  for (var i = 0; i < records.length; i++) {
    if (records[i].date === date) total += records[i].hours;
  }
  return total;
}

function formatHours(hours) {
  return Number(hours.toFixed(2)) + (hours === 1 ? " hour" : " hours");
}

function updateSummary() {
  var todayHours = hoursForDate(today);
  var allHours = 0;
  for (var i = 0; i < records.length; i++) allHours += records[i].hours;
  document.getElementById("todayTotal").textContent = formatHours(todayHours);
  document.getElementById("allTotal").textContent = formatHours(allHours);
  document.getElementById("sessionTotal").textContent = records.length;
  document.getElementById("goalText").textContent = formatHours(todayHours) + " of " + dailyGoal + " hours completed today";
  var percent = Math.min(100, (todayHours / dailyGoal) * 100);

  document.getElementById("goalPercent").textContent = Math.round(percent) + "%";
  document.getElementById("goalRing").style.background = "conic-gradient(#7969df " + percent + "%, #f0edfa " + percent + "%)";
  document.getElementById("goalEncouragement").textContent = todayHours >= dailyGoal ? "Amazing! You reached your daily goal." : "Every focused minute matters.";
  document.getElementById("goalFootText").textContent = todayHours >= dailyGoal ? "Goal reached — be proud of yourself!" : "Keep going — you've got this.";
}

function showWeeklyChart() {
  var chart = document.getElementById("weeklyChart");
  chart.innerHTML = "";
  var dates = [];
  var base = new Date();
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() - 6);
  var maxHours = 0;
  for (var i = 0; i < 7; i++) {
    var d = new Date(base);
    d.setDate(base.getDate() + i);
    var dateText = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    var hours = hoursForDate(dateText);
    dates.push({ label: d.toLocaleDateString("en", { weekday: "short" }), hours: hours });
    if (hours > maxHours) maxHours = hours;
  }
  for (var j = 0; j < dates.length; j++) {
    var height = maxHours === 0 ? 3 : Math.max(3, dates[j].hours / maxHours * 100);
    var day = document.createElement("div");
    day.className = "day";
    if (j === 6) day.classList.add("today");
    day.innerHTML = "<div class='bar-area'><div class='bar' style='height:" + height + "px'></div></div><strong>" + dates[j].hours + "h</strong><span>" + dates[j].label + "</span>";
    chart.appendChild(day);
  }
}

function showHistory() {
  var body = document.getElementById("historyBody");
  var emptyText = document.getElementById("emptyText");
  var search = document.getElementById("searchInput").value.toLowerCase();
  body.innerHTML = "";
  var found = 0;
  for (var i = records.length - 1; i >= 0; i--) {
    var record = records[i];
    var searchText = (record.subject + " " + record.topic).toLowerCase();
    if (searchText.indexOf(search) === -1) continue;
    found++;
    var row = document.createElement("tr");
    var initial = escapeText(record.subject.charAt(0).toUpperCase());
    row.innerHTML = "<td><span class='subject-avatar'>" + initial + "</span>" + escapeText(record.subject) + "<small>" + escapeText(record.topic || "Study session") + "</small></td><td>" + escapeText(record.date) + "</td><td>" + record.hours + (record.hours === 1 ? " hour" : " hours") + "</td><td><button class='delete-btn' data-id='" + record.id + "'>Delete</button></td>";
    body.appendChild(row);
  }
  emptyText.style.display = found === 0 ? "block" : "none";
  var buttons = body.querySelectorAll(".delete-btn");
  for (var j = 0; j < buttons.length; j++) {
    buttons[j].addEventListener("click", function() {
      var id = Number(this.getAttribute("data-id"));
      records = records.filter(function(item) { return item.id !== id; });
      saveRecords();
      updatePage();
    });
  }
}

function escapeText(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function updatePage() {
  updateSummary();
  showWeeklyChart();
  showHistory();
}

if (savedUser) showApp();
