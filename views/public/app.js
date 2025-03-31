let tableLightMode = localStorage.getItem("table-light-mode") || "no";
let adminMode = localStorage.getItem("admin-mode") || "no";
let adminCode = JSON.parse(
    localStorage.getItem("admin-code") || JSON.stringify({ expires: 0, code: "", verified: false })
);
let errors = 0;
let words;
let copyWords;
let loadingContainer;
let adminPanel;
let adminCodeInput;
let gameOverlay;
let gameWord;
let gameLastDivider;
let bottomBarBefore;
let bottomBarAfter;
let lessonDisplay;
let lessonId;
let lessonFiszki;
let lessonsDisplay;
let lessonsList;
let lightModeButton;
let adminModeButton;
let timeout;
let rowIndex = 1;

function shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
}

async function deleteLesson() {
    const confirmed = confirm(`Jesteś pewien, że chcesz usunąć lekcję "${lessonId.textContent}"?`);

    if (!confirmed) return;

    try {
        const res = await fetch(`/lessons/${lessonId.textContent.split("-")[0].replace("#", "").trim()}`, {
            body: JSON.stringify({ authorization: adminCode.code }),
            headers: {
                "Content-Type": "application/json",
            },
            method: "DELETE",
        });

        if (!res.ok) {
            const json = await res.json();
            return displayError(res.status, json.message);
        }
    } catch (err) {
        return displayError(0, err.message);
    }

    window.location.replace("/");
}

async function fetchLessons() {
    try {
        const lessons = await fetch("/lessons");

        if (lessons.status == 404) return ["Page not found", 1, 404];

        const json = await lessons.json();

        if (!lessons.ok) return [json.message || "Unknown error", 1, lessons.status];

        return [json, 0, 200];
    } catch (err) {
        return [err, 1, 0];
    }
}

async function fetchLesson(id) {
    try {
        const lesson = await fetch(`/lessons/${id}`);

        if (lesson.status == 404) return ["Lesson not found", 1, 404];

        const json = await lesson.json();

        if (!lesson.ok) return [json.message || "Unknown error", 1, lesson.status];

        return [json, 0, 200];
    } catch (err) {
        return [err, 1, 0];
    }
}

async function checkAdminCode(code) {
    try {
        const res = await fetch("/api/check-code", {
            body: JSON.stringify({ code }),
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
        });

        if (res.status == 404) return ["Page not found", 1, 404];

        const json = await res.json();

        if (!res.ok) return [json.message || "Unknown error", 1, res.status];

        return [json.ok, 0, 0];
    } catch (err) {
        return [err, 1, 0];
    }
}

function displayError(code, message) {
    const errorContainer = document.getElementById("error");
    const errorCode = document.getElementById("error-code");
    const errorMessage = document.getElementById("error-message");

    errorCode.textContent = code == 0 ? "Error" : code.toString();
    errorMessage.innerHTML = `<span style="color: white; font-style: normal">Error message: </span> ${message}`;
    loadingContainer.style.display = "none";
    errorContainer.style.display = "flex";
}

async function saveCode() {
    clearTimeout(timeout);
    timeout = null;

    const res = await checkAdminCode(adminCodeInput.value);

    timeout = setTimeout(function () {
        adminCodeInput.classList.remove("input-green");
        adminCodeInput.classList.remove("input-orange");
        adminCodeInput.classList.remove("input-red");
        timeout = null;
    }, 500);

    if (res[1]) {
        adminCodeInput.classList.add("input-orange");
        return console.error(res);
    }

    if (!res[0]) {
        adminCodeInput.classList.add("input-red");
        adminCode = { expires: 0, code: "", verified: false };
    } else {
        adminCodeInput.classList.add("input-green");
        adminCode = { expires: Date.now() + 3_600_000, code: adminCodeInput.value, verified: true };
    }

    localStorage.setItem("admin-code", JSON.stringify(adminCode));
}

function toggleTableLightMode() {
    tableLightMode = document.body.classList.toggle("light-mode") ? "yes" : "no";
    localStorage.setItem("table-light-mode", tableLightMode);
    lightModeButton.innerText = tableLightMode == "yes" ? "🌕" : "☀️";
}

function toggleAdminMode() {
    if (!adminCode.verified) return;

    adminMode = document.body.classList.toggle("admin-mode") ? "yes" : "no";
    localStorage.setItem("admin-mode", adminMode);
    adminModeButton.innerText = adminMode == "yes" ? "Wyłącz tryb admina" : "Włącz tryb admina";
}

function endGame() {
    gameOverlay.style.display = "none";
    lessonFiszki.style.display = "table-row-group";
}

function startGame() {
    gameOverlay.style.display = "flex";
    lessonFiszki.style.display = "none";
    gameLastDivider.style.display = "black";
    errors = 0;
    shuffle(words);
    copyWords = words.slice();
    nextWord();
}

function nextWord() {
    gameWord.style.color = "white";
    gameWord.style.background = "none";
    bottomBarAfter.style.display = "none";
    bottomBarBefore.style.display = "flex";

    if (copyWords.length <= 0) {
        bottomBarAfter.style.display = "none";
        bottomBarBefore.style.display = "none";
        gameLastDivider.style.display = "none";
        gameWord.innerHTML = `Gratulacje!<br><span style="font-size: 16px"><span style="color: #1f80b0">${
            (words.length / (errors + 1)).toFixed(2) * 100
        }%</span> prawidłowych odpowiedzi!</span>`;
        return;
    }

    gameWord.textContent = copyWords[0].word;
}

function showAnswer() {
    gameWord.textContent = copyWords[0].translation;
    gameWord.style.background = "#ce723c22";
    bottomBarAfter.style.display = "flex";
    bottomBarBefore.style.display = "none";
}

function knowAnswer() {
    copyWords.shift();
    nextWord();
}

function dontKnowAnswer() {
    errors++;
    const currentElement = copyWords.shift();
    copyWords.push(currentElement);
    nextWord();
}

function addRow() {
    const tableBody = document.getElementById("admin-words-table").querySelector("tbody");
    const row = tableBody.insertRow();
    const cell0 = row.insertCell(0);
    const cell1 = row.insertCell(1);
    const cell2 = row.insertCell(2);

    const wordInput = document.createElement("input");
    wordInput.type = "text";
    wordInput.name = "word";
    wordInput.required = true;

    const translationInput = document.createElement("input");
    translationInput.type = "text";
    translationInput.name = "translation";
    translationInput.required = true;

    const removeButton = document.createElement("button");
    removeButton.classList.add("exit-button", "btn-gray");
    removeButton.innerText = "✖";
    removeButton.addEventListener("click", function() {
        row.remove();
    });
    
    cell0.appendChild(removeButton);
    cell1.appendChild(wordInput);
    cell2.appendChild(translationInput);

    rowIndex++;
}

window.onload = async function () {
    if (adminCode.code == "") {
        adminCode.verified = false;
        adminCode.expires = 0;
        localStorage.setItem("admin-code", JSON.stringify(adminCode));
    }

    if (adminCode.code != "" && Date.now() > adminCode.expires) {
        const res = await checkAdminCode(adminCode.code);

        if (res[1]) console.error(res);
        else {
            if (res[0]) {
                adminCode = { expires: Date.now() + 3_600_000, code: adminCode.code, verified: true };
                localStorage.setItem("admin-code", JSON.stringify(adminCode));
            } else {
                adminCode = { expires: 0, code: "", verified: false };
                localStorage.setItem("admin-code", JSON.stringify(adminCode));
            }
        }
    }

    loadingContainer = document.getElementById("loading");

    lightModeButton = document.getElementById("light-mode-button");
    if (tableLightMode == "yes") {
        lightModeButton.innerText = "🌕";
        document.body.classList.add("light-mode");
    }

    if (!adminCode.verified) {
        adminMode = "no";
    }

    if (adminMode == "yes") {
        document.body.classList.add("admin-mode");
    }

    const pathSegments = window.location.pathname.split("/");
    const idFromPath = pathSegments[pathSegments.length - 1];

    if (idFromPath == "") {
        lessonsDisplay = document.getElementById("lessons-display");
        lessonsList = document.getElementById("lessons-list");

        document.title = "Maniuś: Lekcje";

        const lessons = await fetchLessons();

        if (lessons[1]) {
            return displayError(lessons[2], lessons[0]);
        }

        for (const lesson of lessons[0]) {
            const newElement = document.createElement("li");
            newElement.innerHTML = `<a href="/${lesson.id}">${lesson.title}</a>`;
            lessonsList.appendChild(newElement);
        }

        loadingContainer.style.display = "none";
        lessonsDisplay.style.display = "flex";
    } else if (idFromPath == "admin") {
        document.title = "Maniuś: panel admina";

        adminPanel = document.getElementById("admin-panel");
        adminCodeInput = document.getElementById("admin-code");
        adminModeButton = document.getElementById("admin-mode-button");

        adminCodeInput.value = adminCode.code;

        if (adminMode == "yes") {
            adminModeButton.innerText = "Wyłącz tryb admina";
        }

        adminCodeInput.addEventListener("input", () => {
            adminCodeInput.classList.remove("input-green");
            adminCodeInput.classList.remove("input-orange");
            adminCodeInput.classList.remove("input-red");

            clearTimeout(timeout);
            timeout = null;

            timeout = setTimeout(saveCode, 500);
        });

        adminCodeInput.addEventListener("focusout", () => {
            if (timeout) saveCode();
        });

        document.getElementById("admin-lesson-form").addEventListener("submit", async function (event) {
            event.preventDefault();

            if (!adminCode.verified) return;

            const title = document.getElementById("admin-title").value;
            const words = [];
            const rows = document.getElementById("admin-words-table").querySelectorAll("tbody tr");

            rows.forEach(function (row) {
                const word = row.querySelector('input[name="word"]').value;
                const translation = row.querySelector('input[name="translation"]').value;
                words.push({ word: word, translation: translation });
            });

            const lesson = {
                title: title,
                fiszki: words,
                authorization: adminCode.code,
            };

            try {
                const res = await fetch("/lessons", {
                    body: JSON.stringify(lesson),
                    headers: {
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                });

                const json = await res.json();

                if (!res.ok)
                    return displayError(res.status, json.message);

                window.location.replace(`/${json.id}`);
            } catch(err) {
                return displayError(0, err);
            }
        });

        loadingContainer.style.display = "none";
        adminPanel.style.display = "flex";
    } else {
        lessonDisplay = document.getElementById("lesson-display");
        lessonId = document.getElementById("lesson-id");
        lessonFiszki = document.getElementById("lesson-fiszki");
        gameOverlay = document.getElementById("lesson-game");
        gameWord = document.getElementById("game-word");
        gameLastDivider = document.getElementById("game-last-divider");
        bottomBarBefore = document.getElementById("bottom-bar-before");
        bottomBarAfter = document.getElementById("bottom-bar-after");

        const lesson = await fetchLesson(idFromPath);

        if (lesson[1]) {
            return displayError(lesson[2], lesson[0]);
        }

        const { id, title, fiszki } = lesson[0];
        lessonId.textContent = `#${id} - ${title}`;
        lessonFiszki.children = [];
        document.title = `Maniuś: ${title}`;
        words = fiszki;

        for (const fiszka of fiszki) {
            const newElement = document.createElement("tr");
            const idValue = document.createElement("td");
            const wordValue = document.createElement("td");
            const translationValue = document.createElement("td");

            idValue.textContent = fiszki.indexOf(fiszka) + 1;
            wordValue.textContent = fiszka.word;
            translationValue.textContent = fiszka.translation;

            newElement.appendChild(idValue);
            newElement.appendChild(wordValue);
            newElement.appendChild(translationValue);
            lessonFiszki.appendChild(newElement);
        }

        loadingContainer.style.display = "none";
        lessonDisplay.style.display = "flex";
    }
};
