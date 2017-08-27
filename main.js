const electron = require("electron");
const path = require("path");
const url = require("url");
const defaultMenu = require("electron-default-menu");
const Store = require("electron-store");

const {
	app,
	BrowserWindow,
	ipcMain,
	Menu,
	shell
} = electron;

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

	mainWindow.loadURL(serverUrl);
}

function openLocal() {
	let userDataPath = app.getPath("userData");
	let lib = require("pyramid-irc/lib");
	lib.main.setLocalOverridePath(path.join(userDataPath, "pyramid"));
	lib.init();
	setTimeout(() => mainWindow.loadURL("http://localhost:8887"), 2000);
}

function openWelcome() {
	app.setBadgeCount(0);
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

function unsetMode() {
	store.delete("mode");
	store.delete("url");
	openWelcome();
}

ipcMain.on("start-local", function() {
	console.log("Starting local");
	setLocal();
});

ipcMain.on("start-connection", function(evt, url) {
	console.log("Starting connection", url);
	setRemote(url);
});

ipcMain.on("unset-app", function() {
	console.log("Unsetting app");
	unsetMode();
});

ipcMain.on("set-badge-count", function(evt, count) {
	console.log("Setting badge count");
	app.setBadgeCount(count);
});

function setUpMenu() {
	// Get template for default menu
	const menu = defaultMenu(app, shell);

	let unsetAppMenuItem = {
		label: "Return to Welcome Screen",
		click: unsetMode
	};

	let { label, submenu } = menu[0];
	if (label === "Edit") {
		// Edit menu

		submenu = submenu.concat([
			{ type: "separator" },
			unsetAppMenuItem
		]);
	}

	else {
		// App menu

		submenu.splice(
			1, 0,
			{ type: "separator" },
			unsetAppMenuItem
		);
	}

	// Set top-level application menu, using modified template
	Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
}

function startUp() {
	let mode = store.get("mode");
	let url = store.get("url");

	// TEMP DEBUG

	/*//if (process.env.NODE_ENV === "development") {
		BrowserWindow.addDevToolsExtension(
			"/Users/augr/Library/Application Support/Google/Chrome/" +
			"Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/2.5.0_0"
		);
		BrowserWindow.addDevToolsExtension(
			"/Users/augr/Library/Application Support/Google/Chrome/" +
			"Default/Extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/2.15.1_0"
		);
	//}*/

	// END TEMP DEBUG

	setUpMenu();
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
