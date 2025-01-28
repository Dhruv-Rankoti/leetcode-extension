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
async function updateSolvedStatus() {
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

async function removeRedirectRule() {
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [1] });
}

async function applyRedirectRule(tabId) {
    // Add a rule
    if (!solved && questionLink) {
        await chrome.declarativeNetRequest.updateSessionRules({
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
        await removeRedirectRule();

        if (!questionLink || !username) {
            await getDailyQuestion();
            username = (await chrome.storage.sync.get("username")).username || "";
        }
        await updateSolvedStatus();
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
        username = changes.username.newValue || "";
        updateSolvedStatus();
    }
});