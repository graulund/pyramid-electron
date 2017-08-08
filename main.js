const electron = require("electron");
const path = require("path");
const url = require("url");
const Store = require("electron-store");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const store = new Store();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		titleBarStyle: "hidden-inset",
		nodeIntegration: true
	});

	// Emitted when the window is closed.
	mainWindow.on("closed", function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});
}

function openRemote(serverUrl) {
	// TODO: Check if URL is actually a Pyramid location
	// TODO: Don't open remotes in a tab with sensitive information

	// NO Node integration.

	/*let newWindow = new BrowserWindow({
		width: 800,
		height: 600,
		nodeIntegration: false
	});

	mainWindow.close();
	newWindow.loadURL(serverUrl);
	mainWindow = newWindow;*/

	mainWindow.loadURL(serverUrl);
}

function openLocal() {
	require("pyramid-irc");
	setTimeout(() => mainWindow.loadURL("http://localhost:8887"), 2000);
}

function openWelcome() {
	mainWindow.loadURL("file://" + path.join(__dirname, "welcome.html"));
}

function setLocal() {
	store.set("mode", "local");
	openLocal();
}

function setRemote(serverUrl) {
	store.set("mode", "connection");
	store.set("url", serverUrl);
	openRemote(serverUrl);
}

ipcMain.on("start-local", function() {
	console.log("starting local");
	setLocal();
});

ipcMain.on("start-connection", function(evt, url) {
	console.log("starting connection", url);
	setRemote(url);
});

function startUp() {
	let mode = store.get("mode");
	let url = store.get("url");

	createWindow();

	if (mode === "local") {
		openLocal();
	}

	else if (mode === "connection" && url) {
		openRemote(url);
	}

	else {
		openWelcome();
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", startUp);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", function() {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});
