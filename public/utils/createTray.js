const { app, Tray, Menu, shell } = require("electron");
const config = require("./config");

exports.createTray = () => {
	const t = new Tray(config.icon);

	t.setToolTip(config.appName);
	t.setContextMenu(
		Menu.buildFromTemplate([
			{
				label: "Показать лаунчер",
				click: () => {
					if (!config.mainWindow.isVisible())
						config.mainWindow.show();
				},
			},
			{
				label: "Социальные сети",
				submenu: [
					{
						label: "GitHub",
						click: () => {
							shell.openExternal("https://african-dawn.ru/github");
						},
					},
					{
						label: "VK",
						click: () => {
							shell.openExternal("https://african-dawn.ru/vk");
						},
					},
					{
						label: "Discord",
						click: () => {
							shell.openExternal("https://african-dawn.ru/discord");
						},
					},
					{
						label: "Steam",
						click: () => {
							shell.openExternal("https://african-dawn.ru/steam");
						},
					},
				],
			},
			{
				label: "Выход",
				click: () => {
					config.isQuiting = true;

					app.quit();
				},
			},
		]),
	);

	return t;
};
