const api = "https://alfa-leetcode-api.onrender.com/";
let user = "";

document.addEventListener("DOMContentLoaded", () => {
    const usernameInput = document.getElementById("username");
    const saveButton = document.getElementById("saveUsername");
    const usernameDisplay = document.getElementById("username-display");

    chrome.storage.sync.get("username", (data) => {
        if (data.username) {
            usernameDisplay.textContent = `Current Username: ${data.username}`;
            user = data.username;
            populateStats();
        } else {
            usernameDisplay.textContent = "No username set.";
        }
    });

    saveButton.addEventListener("click", () => {
        const username = usernameInput.value.trim();
        if (username) {
            chrome.storage.sync.set({ username }, () => {
                user = username;
                usernameDisplay.textContent = `Current Username: ${username}`;
                alert("Username saved successfully!");
                populateStats();
            });
        } else {
            alert("Please enter a valid username.");
        }
    });
});

async function getQuestionsSolved() {
    let solvedEasy = 0, solvedMedium = 0, solvedHard = 0;
    let totalEasy = 0, totalMedium = 0, totalHard = 0;
    let totalSolved = 0, totalQuestions = 0;

    try {
        console.log(`Fetching data for user: ${user}`);
        const response = await fetch(`${api}/userProfile/${user}`);
        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
            throw new Error("Could not fetch user details");
        }

        const data = await response.json();
        console.log("Fetched data:", data);

        if (!data || typeof data !== "object") {
            throw new Error("Invalid data received.");
        }

        totalSolved = data.totalSolved || 0;
        totalQuestions = data.totalQuestions || 0;

        solvedEasy = data.easySolved || 0;
        totalEasy = data.totalEasy || 0;
        solvedMedium = data.mediumSolved || 0;
        totalMedium = data.totalMedium || 0;
        solvedHard = data.hardSolved || 0;
        totalHard = data.totalHard || 0;
    } catch (error) {
        console.error("Error fetching user details:", error);
    }

    return {
        easy: { solved: solvedEasy, total: totalEasy },
        medium: { solved: solvedMedium, total: totalMedium },
        hard: { solved: solvedHard, total: totalHard },
        totalSolved: totalSolved,
        totalQuestions: totalQuestions,
    };
}

function updateProgressBar(data) {
    if (data.totalSolved === 0) {
        console.warn("No problems solved yet. Progress cannot be displayed.");
        return;
    }

    const easyDeg = (data.easy.solved / data.totalSolved) * 360;
    const mediumDeg = (data.medium.solved / data.totalSolved) * 360;
    const hardDeg = (data.hard.solved / data.totalSolved) * 360;

    const progressElement = document.getElementById("totalProgress");
    progressElement.style.background = `conic-gradient(
      #00b894 ${easyDeg}deg, 
      #fdcb6e ${easyDeg}deg, ${easyDeg + mediumDeg}deg, 
      #d63031 ${easyDeg + mediumDeg}deg, ${easyDeg + mediumDeg + hardDeg}deg, 
      #ddd ${easyDeg + mediumDeg + hardDeg}deg
    )`;
}

async function populateStats() {
    if (!user) {
        console.warn("No username provided. Please set a username.");
        return;
    }

    const stats = await getQuestionsSolved();

    document.getElementById("totalSolved").textContent = stats.totalSolved;
    document.getElementById("totalQuestions").textContent = stats.totalQuestions;
    document.getElementById("easySolved").textContent = stats.easy.solved;
    document.getElementById("easyTotal").textContent = stats.easy.total;
    document.getElementById("mediumSolved").textContent = stats.medium.solved;
    document.getElementById("mediumTotal").textContent = stats.medium.total;
    document.getElementById("hardSolved").textContent = stats.hard.solved;
    document.getElementById("hardTotal").textContent = stats.hard.total;

    updateProgressBar(stats);
}
