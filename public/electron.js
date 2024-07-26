const { app, dialog, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const { createTray } = require("./utils/createTray");
const { createMainWindow } = require("./utils/createMainWindow");
const AutoLaunch = require("auto-launch");
const remote = require("@electron/remote/main");
const config = require("./utils/config");
const Registry = require('winreg');
const { execFile } = require('child_process');
const path = require('path')
const { createDiscordRPC } = require("./utils/createDiscordRPC");
const fs = require('fs');
const axios = require('axios');
const AdmZip = require('adm-zip');
const http = require('https');


const REG_KEY = 'Downloaded';
const REG_VERSION_KEY = 'Version';
const REG_HOI4_PATH = 'Path';
const JSON_URL = 'https://africandawn.online/download/version.json';
const ZIP_URL = 'https://africandawn.online/download/mod.zip';
const registryPath = '\\Software\\AfricanDawnLauncher\\Mod';

const registry = new Registry({
	hive: Registry.HKCU,
	key: registryPath
});


if (config.isDev) require("electron-reloader")(module);

const steamworks = require('steamworks.js')

let client;

try {
	client = steamworks.init(394360);
	if (client.apps.isAppInstalled(394360)) {
		config.steam = true;
		console.log("Installed HOI4 - Verify")
		console.log(client.localplayer.getName())
		console.log(client.apps.appInstallDir(394360))
	}
} catch (error) {
	console.error('Ошибка инициализации Steam:', error.message);
	config.steam = false;
}

remote.initialize();

if (!config.isDev) {
	const autoStart = new AutoLaunch({
		name: config.appName,
	});
	autoStart.enable();
}

function checkInternet() {
	const siteUrl = 'https://africandawn.online';
	http.get(siteUrl, (res) => {
		return (res.statusCode === 200);
	}).on('error', (e) => {
		return (false);
	});
}

function checkSiteAvailability(siteUrl, cb) {
	http.get(siteUrl, (res) => {
		cb(res.statusCode === 200);
	}).on('error', (e) => {
		cb(false);
	});
}

app.on("ready", async () => {
	config.mainWindow = await createMainWindow();
	config.discordRPC = await createDiscordRPC();
	config.tray = createTray();

	checkInternet((isConnected) => {
		if (isConnected) {
			console.log('Интернет подключение есть.');
			checkSiteAvailability('https://africandawn.online', (isAvailable) => {
				if (isAvailable) {
					console.log('Сайт доступен.');
				} else {
					console.log('Сайт недоступен.');
				}
			});
		} else {
			console.log('Интернет подключение отсутствует.');
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0)
		config.mainWindow = createMainWindow();
});

ipcMain.on("app_version", (event) => {
	event.sender.send("app_version", { version: app.getVersion() });
});

autoUpdater.on("update-available", () => {
	config.mainWindow.webContents.send("update_available");
});

autoUpdater.on("update-downloaded", () => {
	config.mainWindow.webContents.send("update_downloaded");
});

ipcMain.on("restart_app", () => {
	autoUpdater.quitAndInstall();
});

ipcMain.handle('enableSteamSupportMethod', async () => {
	return config.steam;
});

ipcMain.handle('checkInternetAfricanDawn', () => {
	const siteUrl = 'https://africandawn.online';
	http.get(siteUrl, (res) => {
		return (res.statusCode === 200);
	}).on('error', (e) => {
		return (false);
	});
})

ipcMain.handle('setInstallCustomNoSteamPathHOI4', async () => {
	const { response } = await dialog.showMessageBox({
		type: 'info',
		buttons: ['Ok'],
		title: 'HOI4 Executable',
		message: 'Please locate the hoi4.exe file.'
	});

	if (response === 0) {  // 'Ok' button has an index 0
		const result = await dialog.showOpenDialog({
			properties: ['openFile'],
			filters: [
				{ name: 'Executables', extensions: ['exe'] }
			]
		});

		if (!result.canceled) {
			const filePath = result.filePaths[0];
			const hoi4Path = filePath.substring(0, filePath.lastIndexOf("\\"));
			console.log('Selected folder:', hoi4Path);
			writeRegistryValue(REG_HOI4_PATH, Registry.REG_SZ, hoi4Path, (err) => {
				if (err) {
					console.error('Error writing to registry:', err);
				} else {
					console.log('Successfully wrote to registry:', hoi4Path);
				}
			});
		}
	}
})

function enableSteamSupportMethod() {
	return config.steam;
};


ipcMain.handle('checkRegistryAndDownload', async () => {
	try {
		const downloaded = await checkRegistryAndDownload();

		return downloaded;
	} catch (err) {
		console.error('Error in checkRegistryAndDownload: ', err);
		throw err;
	}
});

ipcMain.handle('checkLatestVersion', async () => {
    try {
        const response = await axios.get(JSON_URL);
        const serverVersion = response.data.version;

        return new Promise((resolve) => {
            readRegistryValue(REG_VERSION_KEY, (localVersion) => {
                localVersion = localVersion || '0.0.0';
                resolve(!compareVersions(serverVersion, localVersion)); // Вернет true, если самая последняя версия
            });
        });
    } catch (error) {
        console.error('Failed to fetch version from server', error);
        return false; // Возврат false в случае ошибки
    }
});

ipcMain.handle('reInstallMod', async () => {
	try {
		const downloaded = await reInstallMod();

		return downloaded;
	} catch (err) {
		console.error('Error in reInstallMod: ', err);
		throw err;
	}
});

ipcMain.handle('getSteamVersionHOI4', () => {
	var appInstallDir;
	console.log(config.steam)
	if (config.steam) {
		console.log("Steam wooooork...")
		appInstallDir = client.apps.appInstallDir(394360);
		console.log("(Steam HOI4) appInstallDir: ", appInstallDir);
		const launcherSettingsPath = `${appInstallDir}/launcher-settings.json`;

		try {
			const launcherSettings = fs.readFileSync(launcherSettingsPath, 'utf8');
			const { rawVersion } = JSON.parse(launcherSettings);
			console.log("Current version HOI4", rawVersion);
			return rawVersion;
		} catch (error) {
			console.error(`Error reading launcher-settings.json: ${error}`);
			return null;
		}
	}
	else {
		return new Promise((resolve, reject) => {
			readRegistryValue(REG_HOI4_PATH, (pathHoi4) => {
				console.log("(Steam HOI4) appInstallDir: ", pathHoi4);
				const launcherSettingsPath = `${pathHoi4}/launcher-settings.json`;
				try {
					const launcherSettings = fs.readFileSync(launcherSettingsPath, 'utf8');
					const { rawVersion } = JSON.parse(launcherSettings);
					console.log("Current version HOI4", rawVersion);
					resolve(rawVersion);
				} catch (error) {
					console.error(`Error reading launcher-settings.json: ${error}`);
					resolve(null);
				}
			});
		});
	}

});

ipcMain.handle('getSteamVersionPath', () => {
	var appInstallDir;
	console.log(config.steam)
	if (config.steam) {
		console.log("Steam wooooork...")
		appInstallDir = client.apps.appInstallDir(394360);
	}
	else {

		appInstallDir = readRegistryValue(REG_HOI4_PATH, (pathHoi4) => { console.log(pathHoi4); appInstallDir = pathHoi4 });

	}
	console.log("(Steam HOI4) appInstallDir: ", appInstallDir);
	const launcherSettingsPath = `${appInstallDir}/launcher-settings.json`;

	try {
		const launcherSettings = fs.readFileSync(launcherSettingsPath, 'utf8');
		const { gameDataPath } = JSON.parse(launcherSettings);
		console.log("Game Data Path:", gameDataPath);
		return gameDataPath;
	} catch (error) {
		console.error(`Error reading launcher-settings.json: ${error}`);
		return null;
	}
});

ipcMain.handle('get-registry-status', async () => {
	const regKey = new Registry({
		hive: Registry.HKCU,
		key: '\\Software\\AfricanDawnLauncher\\Mod',
	});

	return new Promise((resolve, reject) => {
		regKey.get('Downloaded', async (err, item) => {
			if (err || !item) {
				resolve(null);
			} else {
				resolve(item.value);
			}
		});
	});
});


ipcMain.handle('get-registry-version', async () => {
	const regKey = new Registry({
		hive: Registry.HKCU,
		key: '\\Software\\AfricanDawnLauncher\\Mod',
	});

	return new Promise((resolve, reject) => {
		regKey.get('Version', async (err, item) => {
			if (err || !item) {
				resolve(null);
			} else {
				resolve(item.value);
			}
		});
	});
});

ipcMain.handle('get-hoi4-path-reg', async () => {
	const regKey = new Registry({
		hive: Registry.HKCU,
		key: '\\Software\\AfricanDawnLauncher\\Mod',
	});

	return new Promise((resolve, reject) => {
		regKey.get(REG_HOI4_PATH, async (err, item) => {
			if (err || !item) {
				resolve(null);
			} else {
				resolve(item.value);
			}
		});
	});
});

ipcMain.handle('runGame', async () => {
    try {
        let exePath;
        let appInstallDir;

        if (config.steam) {
            console.log("Steam wooooork...");
            appInstallDir = client.apps.appInstallDir(394360);
            if (!appInstallDir) {
                throw new Error('Unable to retrieve Steam install directory for HOI4.');
            }
            exePath = path.join(appInstallDir, 'hoi4.exe');
        } else {
            appInstallDir = await new Promise((resolve, reject) => {
                readRegistryValue(REG_HOI4_PATH, (pathHoi4) => {
                    if (pathHoi4) {
                        resolve(pathHoi4);
                    } else {
                        reject(new Error('NO HOI4 path found in registry.'));
                    }
                });
            });
            exePath = path.join(appInstallDir, 'hoi4.exe');
        }

        // Убедитесь, что переменные exePath и appInstallDir были установлены
        if (!exePath || !appInstallDir) {
            throw new Error('ExePath or AppInstallDir is not defined.');
        }

        let jsonPathMods;
        console.log("appInstallDir: ", appInstallDir);
        const launcherSettingsPath = path.join(appInstallDir, 'launcher-settings.json');

        try {
            const launcherSettings = fs.readFileSync(launcherSettingsPath, 'utf8');
            const { gameDataPath } = JSON.parse(launcherSettings);
            console.log("Game Data Path:", gameDataPath);
            jsonPathMods = gameDataPath;
        } catch (error) {
            console.error(`Error reading launcher-settings.json: ${error}`);
            jsonPathMods = null;
            throw error;
        }

        const userProfile = process.env.USERPROFILE;
        let documentsPathFinal;
        if (userProfile) {
            const documentsPath = path.resolve(userProfile, 'Documents');
            console.log(`Documents Path: ${documentsPath}`);
            documentsPathFinal = documentsPath;
        } else {
            console.error('USERPROFILE environment variable is not set.');
            documentsPathFinal = '%UserProfile%/Documents/';
        }
        
        const jsonPath = path.join(jsonPathMods.replace('%USER_DOCUMENTS%', documentsPathFinal), 'dlc_load.json');
        await runGameProcess(exePath, jsonPath);
    } catch (error) {
        console.error("Error in runGame:", error);
    }
});

function runGameProcess(exePath, jsonPath) {
    return new Promise((resolve, reject) => {
        const jsonContent = JSON.stringify({
            enabled_mods: ["mod/african_dawn.mod"],
            disabled_dlcs: []
        });
        
        console.log(jsonPath);
        
        fs.writeFile(jsonPath, jsonContent, 'utf8', (err) => {
            if (err) {
                console.error("Error writing to dlc_load.json:", err);
                return reject(err);
            }
        
            console.log("Successfully wrote to dlc_load.json");
        
            execFile(exePath, (err, stdout, stderr) => {
                if (err) {
                    console.error("Error executing the .exe file:", err);
                    return reject(err);
                }
        
                if (stdout) console.log("Output:", stdout);
                if (stderr) console.error("Error output:", stderr);
                
                resolve(); // Успешное завершение процесса
            });
        });
    });
}

function modDirectory() {
	return new Promise((resolve, reject) => {
		if (enableSteamSupportMethod()) {
			const appInstallDir = client.apps.appInstallDir(394360);
			console.log("(Steam HOI4) appInstallDir: ", appInstallDir);
			const launcherSettingsPath = `${appInstallDir}/launcher-settings.json`;

			try {
				const launcherSettings = fs.readFileSync(launcherSettingsPath, 'utf8');
				const { gameDataPath } = JSON.parse(launcherSettings);
				console.log("Game Data Path:", gameDataPath);

				const userProfile = process.env.USERPROFILE;
				var documentsPathFinal;
				if (userProfile) {
					const documentsPath = path.resolve(userProfile, 'Documents');
					console.log(`Documents Path: ${documentsPath}`);
					documentsPathFinal = documentsPath;
				} else {
					console.error('USERPROFILE environment variable is not set.');
					documentsPathFinal = '%UserProfile%/Documents/';
				}

				const folderPath = gameDataPath.replace('%USER_DOCUMENTS%', documentsPathFinal) + '\\mod\\african_dawn';

				if (!fs.existsSync(folderPath)) {
					fs.mkdirSync(folderPath);
					console.log('Folder created:', folderPath);
					resolve(folderPath);
				} else {
					console.log('Folder already exists:', folderPath);
					resolve(folderPath);
				}
			} catch (error) {
				console.error(`Error reading launcher-settings.json: ${error}`);
				reject(error);
			}
		} else {
			readRegistryValue(REG_HOI4_PATH, (pathHoi4) => {
				if (!pathHoi4) {
					reject(new Error('HOI4 path not found in registry.'));
					return;
				}

				const launcherSettingsPath = `${pathHoi4}/launcher-settings.json`;

				try {
					const launcherSettings = fs.readFileSync(launcherSettingsPath, 'utf8');
					const { gameDataPath } = JSON.parse(launcherSettings);
					console.log("Game Data Path:", gameDataPath);

					const userProfile = process.env.USERPROFILE;
					const documentsPath = path.resolve(userProfile, 'Documents');
					const folderPath = gameDataPath.replace('%USER_DOCUMENTS%', documentsPath) + '\\mod\\african_dawn';

					if (!fs.existsSync(folderPath)) {
						fs.mkdirSync(folderPath);
						console.log('Folder created:', folderPath);
						resolve(folderPath);
					} else {
						console.log('Folder already exists:', folderPath);
						resolve(folderPath);
					}
				} catch (error) {
					console.error(`Error reading launcher-settings.json: ${error}`);
					reject(error);
				}
			});
		}
	});
}

function readRegistryValue(name, callback) {
	registry.get(name, (err, item) => {
		if (err || !item) {
			callback(null);
		} else {
			callback(item.value);
		}
	});
}

function writeRegistryValue(name, type, value, callback) {
	registry.set(name, type, value, callback);
}


async function checkRegistryAndDownload() {
	return new Promise((resolve, reject) => {
		readRegistryValue(REG_KEY, (downloaded) => {
			if (downloaded !== '0x1') {
				console.log('Mod not downloaded yet. Downloading now...');
				getServerVersionAndDownload()
					.then(() => resolve(false))
					.catch(reject);
			} else {
				checkVersion()
					.then(() => resolve(true))
					.catch(reject);
			}
		});
	});
}

async function reInstallMod() {
	return new Promise((resolve, reject) => {
		readRegistryValue(REG_KEY, (downloaded) => {
			if (true) {
				console.log('Mod not downloaded yet. Downloading now...');
				getServerVersionAndDownload()
					.then(() => resolve(false))
					.catch(reject);
			}
		});
	});
}

async function checkVersion() {
	try {
		const response = await axios.get(JSON_URL);
		const serverVersion = response.data.version;

		return new Promise((resolve, reject) => {
			readRegistryValue(REG_VERSION_KEY, (localVersion) => {
				localVersion = localVersion || '0.0.0';

				if (compareVersions(serverVersion, localVersion)) {
					console.log('New version available. Updating...');
					updateMod(serverVersion).then(resolve).catch(reject);
				} else {
					console.log('You are using the latest version.');
					resolve();
				}
			});
		});
	} catch (error) {
		console.error('Failed to fetch version from server', error);
		return Promise.reject(error);
	}
}

function compareVersions(serverVersion, localVersion) {
	const [svMajor, svMinor, svPatch] = serverVersion.split('.').map(Number);
	const [lvMajor, lvMinor, lvPatch] = localVersion.split('.').map(Number);

	if (svMajor > lvMajor) return true;
	if (svMajor < lvMajor) return false;
	if (svMinor > lvMinor) return true;
	if (svMinor < lvMinor) return false;
	return svPatch > lvPatch;
}

function createModDescriptor(filePathOriginal, filePathFinal, path) {
	// Копирование файла с полной перезаписью содержимого
	fs.copyFile(filePathOriginal, filePathFinal, (err) => {
		if (err) {
			console.error('Error copying file:', err);
			return;
		}
		path = path.replace(/\\/g, '/');
		console.log("Path to mod", path.replace(/\\/g, '/'));

		// Дописываем строку "path={path}" в конец файла
		fs.appendFile(filePathFinal, `\npath="${path}"`, (err) => {
			if (err) {
				console.error('Error appending to file:', err);
			} else {
				console.log('File copied and modified successfully.');
			}
		});
	});
}

async function downloadAndExtractMod(serverVersion) {
	try {
		const response = await axios.get(ZIP_URL, {
            responseType: 'arraybuffer',
            onDownloadProgress: (progressEvent) => {
                const totalLength = progressEvent.lengthComputable ? progressEvent.total : 0;
                const loaded = progressEvent.loaded;
                const progress = Math.floor((loaded * 100) / totalLength);
                
                // Отправка прогресса в рендерер
                config.mainWindow.webContents.send('download-progress', progress);
            }
        });

		const zip = new AdmZip(response.data);

		const finalDesicript = await modDirectory();
		console.log("XX", finalDesicript);
		fs.rmSync(finalDesicript, { recursive: true });
		fs.mkdirSync(finalDesicript, { recursive: true });

		zip.extractAllTo(finalDesicript, true);

		createModDescriptor(finalDesicript + "\\descriptor.mod", finalDesicript + "\\..\\african_dawn.mod", finalDesicript)
		console.log("Create descriptor in mod folder");

        // Когда все закончено, отправьте сообщение
        config.mainWindow.webContents.send('download-complete');

		writeRegistryValue(REG_KEY, Registry.REG_DWORD, 1, (err) => {
			if (err) console.error('Error updating registry:', err);

			writeRegistryValue(REG_VERSION_KEY, Registry.REG_SZ, serverVersion, (err) => {
				if (err) console.error('Error updating registry:', err);

				console.log('Mod downloaded and extracted successfully.');
			});
		});
	} catch (error) {
		console.error('Download or extraction failed', error);
	}
}

async function getServerVersionAndDownload() {
	try {
		const response = await axios.get(JSON_URL);
		const serverVersion = response.data.version;
		await downloadAndExtractMod(serverVersion);
	} catch (error) {
		console.error('Failed to fetch version from server', error);
	}
}

async function updateMod(newVersion) {
	try {
		fs.rmSync(modDirectory(), { recursive: true });

		const response = await axios.get(ZIP_URL, { responseType: 'arraybuffer' });
		const zip = new AdmZip(response.data);

		zip.extractAllTo(modDirectory(), true);

		writeRegistryValue(REG_KEY, Registry.REG_DWORD, 1, (err) => {
			if (err) console.error('Error updating registry:', err);

			writeRegistryValue(REG_VERSION_KEY, Registry.REG_SZ, newVersion, (err) => {
				if (err) console.error('Error updating registry:', err);

				console.log('Mod updated and extracted successfully.');
			});
		});
	} catch (error) {
		console.error('Update or extraction failed', error);
	}
}