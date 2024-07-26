const { join } = require("path");
const isDev = require("electron-is-dev");

let config = {
	appName: "African Dawn Launcher",
	icon: join(__dirname, "..", "/favicon.ico"),
	tray: null,
	isQuiting: false,
	mainWindow: null,
	steam: false,
	discordRPC: null,
	hoi4Ver: null,
	isDev
};

module.exports = config;
