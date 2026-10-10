const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

let backendProcess;

function startBackend() {
    const backendPath = path.join(__dirname, "..", "bakend", "server.js");

    backendProcess = spawn("node", [backendPath], {
        cwd: path.join(__dirname, "..", "bakend"),
        shell: true,
        windowsHide: true
    });

    backendProcess.stdout.on("data", (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on("data", (data) => {
        console.error(`Backend Error: ${data}`);
    });

    backendProcess.on("error", (error) => {
        console.error("Backend start error:", error);
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,

        autoHideMenuBar: true,

        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Home page
    win.loadURL("http://localhost:5000/index.html");
}

app.whenReady().then(() => {
    startBackend();

    // Give backend a little time to start
    setTimeout(() => {
        createWindow();
    }, 2000);
});

app.on("window-all-closed", () => {
    if (backendProcess) {
        backendProcess.kill();
    }

    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("before-quit", () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});