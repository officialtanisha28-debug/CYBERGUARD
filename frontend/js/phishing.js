
"use strict";

// Check login
const token = localStorage.getItem("token");
const storedUser = localStorage.getItem("user");

if (!token || !storedUser) {
    window.location.href = "login.html";
} else {
    try {
        const user = JSON.parse(storedUser);

        if (!user || typeof user !== "object") {
            throw new Error("Invalid user data");
        }

        document.getElementById("userName").textContent =
            user.name || "User";

        document.getElementById("userEmail").textContent =
            user.email || "";

        document.getElementById("userAvatar").textContent =
            (user.name || "U").trim().charAt(0).toUpperCase() || "U";
    } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
    }
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
});

const resultArea = document.getElementById("resultArea");

function showMessage(text, isError = false) {
    const message = document.createElement("div");
    message.className = isError ? "message error" : "message";
    message.textContent = text;
    resultArea.replaceChildren(message);
}

// URL form
document.getElementById("urlForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const value = document.getElementById("urlInput").value.trim();

    try {
        const url = new URL(value);

        if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error("Unsupported protocol");
        }
    } catch {
        showMessage("Please enter a valid HTTP or HTTPS website URL.", true);
        return;
    }

    showMessage(
        "URL received by the frontend. The phishing detection API is not connected yet, so no safe or malicious verdict has been generated."
    );
});

// Message form
document.getElementById("messageForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const value = document.getElementById("messageInput").value.trim();

    if (!value) {
        showMessage("Please enter some message text to prepare an analysis.", true);
        return;
    }

    showMessage(
        "Message received by the frontend. The phishing detection API is not connected yet, so no detection verdict has been generated."
    );
});
