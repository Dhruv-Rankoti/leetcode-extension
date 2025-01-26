let questionLink = "";
let questionSlug = "";
let solved = false;
let username = "";
const api = "https://alfa-leetcode-api.onrender.com/";

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
        console.log("Daily question fetched:", questionLink);
    } catch (error) {
        console.error("Error fetching daily question:", error);
    }
}

// Function to check if the question is solved
async function getUserAS() {
    try {
        const response = await fetch(`${api}/${username}/acSubmission`);
        if (!response.ok) {
            throw new Error("Could not fetch user submission");
        }
        const data = await response.json();

        solved = data.submission.some((submission) => submission.titleSlug === questionSlug);
        console.log("Solved status updated:", solved);
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

    console.log("Next update scheduled at:", nextUpdate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));

    // Schedule the first update
    setTimeout(() => {
        updateSolvedStatus();
        // Schedule subsequent updates every 24 hours
        setInterval(updateSolvedStatus, 24 * 60 * 60 * 1000);
    }, timeUntilUpdate);
}

// Update the `solved` status
async function updateSolvedStatus() {
    console.log("Updating solved status...");
    await getUserAS();
}

function applyRedirectRule() {
    if (!solved && questionLink) {
        chrome.declarativeNetRequest.updateDynamicRules({
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
                        urlFilter: "*",
                        resourceTypes: ["main_frame"],
                    },
                },
            ],
        });
        console.log("Redirect rule applied to:", questionLink);
    } else {
        console.log("No redirection applied. Solved:", solved);
    }
}

chrome.runtime.onInstalled.addListener(async () => {
    console.log("Extension installed.");
    await getDailyQuestion();
    scheduleSolvedUpdate();
    applyRedirectRule();
});
