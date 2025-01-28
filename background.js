let questionLink = "";
let questionSlug = "";
let solved = false;
let username = "";
const api = "https://my-leetcode-api-shadow-sama.onrender.com";

// Function to get the daily question
async function getDailyQuestion() {
    try {
        const response = await fetch(`${api}/daily`);
        if (!response.ok) {
            throw new Error("Could not fetch resource");
        }
        const data = await response.json();
        questionLink = data.questionLink;
        questionSlug = data.titleSlug;
    } catch (error) {
        console.error("Error fetching daily question:", error);
    }
}

// Function to check if the question is solved
async function getUserSubmission() {
    try {
        const response = await fetch(`${api}/${username}/acSubmission`);
        if (!response.ok) {
            throw new Error("Could not fetch user submission");
        }
        const data = await response.json();

        solved = data.submission.some((submission) => submission.titleSlug === questionSlug);
    } catch (error) {
        console.error("Error fetching user submissions:", error);
    }
}

// Schedule updates for `solved` at 5:30 AM IST
function scheduleSolvedUpdate() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);

    // Calculate the next 5:30 AM IST
    let nextUpdate = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 5, 30, 0);
    if (istNow >= nextUpdate) {
        nextUpdate.setDate(nextUpdate.getDate() + 1);
    }

    const timeUntilUpdate = nextUpdate - istNow;

    // Schedule the first update
    setTimeout(() => {
        updateSolvedStatus();
        // Schedule subsequent updates every 24 hours
        setInterval(updateSolvedStatus, 24 * 60 * 60 * 1000);
    }, timeUntilUpdate);
}

// Update the `solved` status
async function updateSolvedStatus() {
    await getUserSubmission();
}

async function applyRedirectRule(tabId) {
    // Remove rule
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [1] });
    // Add a rule
    if (!solved && questionLink) {
        await chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [1],
            addRules: [
                {
                    id: 1,
                    priority: 1,
                    action: {
                        type: "redirect",
                        redirect: {
                            url: questionLink,
                        },
                    },
                    condition: {
                        urlFilter: "*://*/*", // Matches all URLs
                        resourceTypes: ["main_frame"],
                        tabIds: [tabId], // Restrict to the current tab
                    },
                },
            ],
        });
        console.log(`Redirect rule applied for tabId ${tabId}`);
    } else {
        console.log("No redirect rule applied (either solved or no question link).");
    }
}


chrome.runtime.onInstalled.addListener(async () => {
    await getDailyQuestion();
    username = (await chrome.storage.sync.get("username")).username || "";
});

chrome.runtime.onStartup.addListener(() => {
    getDailyQuestion();
    username = (chrome.storage.sync.get("username")).username || "";
})

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId === 0) {
        const { tabId } = details;

        if (!questionLink || !username) {
            await getDailyQuestion();
            username = (await chrome.storage.sync.get("username")).username || "";
        }
        await getUserSubmission();
        await applyRedirectRule(tabId);
    }
});

// Fetch the username from storage on startup
chrome.storage.sync.get("username", (data) => {
    if (data.username) {
        username = data.username;
        solved = false;
    }
});

// Listen for username updates and update the username variable
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.username) {
        if (changes.username.newValue !== username) solved = false;
        username = changes.username.newValue || "";
    }
});