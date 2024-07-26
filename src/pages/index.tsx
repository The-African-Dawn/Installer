import { FC, useState, useEffect } from "react";
import { useTranslation } from 'react-i18next'; // Импортируем useTranslation
import { Layout } from "../components/Layout";
import { Button, Popup } from 'pixel-retroui';
import { Link } from "react-router-dom";



const { ipcRenderer } = window.require("electron");
const { getCurrentWindow } = window.require("@electron/remote");

export const IndexPage: FC = () => {
    const { t } = useTranslation(); // Получаем функцию перевода
    const currentWindow = getCurrentWindow();
    const [version, setVersion] = useState<string | null>('Не установлен!');
    const [versionHOI4, setVersionHOI4] = useState<string | null>('Не обнаружено!');
    const [installed, setInstalledMod] = useState<boolean>(false);

    const [isPopupOpen, setIsPopupOpen] = useState(true);
    const [isPopupInstallOpen, setIsPopupInstallOpen] = useState(false);

    const openPopup = () => setIsPopupOpen(true);
    const closePopup = () => setIsPopupOpen(false);

    const openInstallPopup = () => setIsPopupInstallOpen(true);
    const closeInstallPopup = () => setIsPopupInstallOpen(false);
	
	useEffect(() => {
        (async () => {
            try {
                ipcRenderer.invoke('get-registry-status').then((value: string | null) => {
                    console.log("Set check status", value);
					if(value != null) {
						console.log("Installed Mod - open Game run");
						setInstalledMod(true);
					}
                }).catch((err: any) => console.error(err));
                ipcRenderer.invoke('checkInternetAfricanDawn').then((value: boolean | null) => {
                    console.log("Set check checkInternetAfricanDawn", value);
					console.log(value)
					if(value === false) {
						console.log("INTERNET NOOOOOOOOOOOOOOOOOO....", value);
						openPopup();
					} else {
						closePopup();
					}
                }).catch((err: any) => console.error(err));
				
                ipcRenderer.invoke('get-registry-version').then((value: string | null) => {
                    console.log("Set check version", value);
                    if (value !== null) {
                        setVersion(value);
                    }
                }).catch((err: any) => console.error(err));
                ipcRenderer.invoke('getSteamVersionHOI4').then((value: string | null) => {
                    console.log("Set check HOI4 version", value);
                    if (value !== null) {
                        setVersionHOI4(value);
                    }
                }).catch((err: any) => console.error(err));
                const downloadedStatusReg = ipcRenderer.invoke('get-registry-status');
                console.log("Set start check status", downloadedStatusReg)
            } catch (err) {
                console.error('Error checking!:', err);
            }
        })();
    }, []);

	return (
        <div className="overflow-hidden scrollbar-none">
            <Layout>
                <Popup
                    isOpen={isPopupOpen}
                    onClose={closePopup}
                    bg="black"
                    baseBg="white"
                    textColor="white"
                    borderColor="white"
                >
                    {t('internet_connection')}
                    <br/>
                    {t('internet_question')}
                </Popup>
                <Popup
                    isOpen={isPopupInstallOpen}
                    onClose={closeInstallPopup}
                    bg="black"
                    baseBg="white"
                    textColor="white"
                    borderColor="white"
                >
                    {t('mod_not_found')}
                    <br/>
                    {t('mod_install_question')}
                </Popup>
                <div className="overflow-hidden scrollbar-none h-[96dvh] bg-black bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:24px_24px]">
                    <header>
                        <div className="flex flex-col items-center justify-center h-screen">
                            <div className="justify-center">
                                <h1 className="text-6xl font-minecraft mb-4 text-center">{t('officialwebsite')}</h1>
                            </div>
                            <div className="flex justify-center items-center gap-8 space-x-4">
                                <Button
                                    bg="black"
                                    textColor="white"
                                    borderColor="white"
                                    shadow="white"
                                    className="mx-auto"
                                    onClick={() => { if (installed) { currentWindow.unmaximize(); ipcRenderer.invoke('runGame'); } else { openInstallPopup() } }}
                                >
                                    {t('run_game')}
                                </Button>
								<Link to="/installer">
								<Button
									bg="black"
									textColor="white"
									borderColor="white"
									shadow="white"
									className="mx-auto"
								>
									{t('check_updates')}
								</Button>
								</Link>
                            </div>
                        </div>
                    </header>
                    <footer className="absolute bottom-2 right-2 text-right text-sm text-gray-500">
                        <p>{t('version')} {version}</p>
                        <p>{t('hoi4_version')} {versionHOI4}</p>
                        <p>African Dawn Team © {(new Date().getFullYear())}</p>
                    </footer>
                </div>
            </Layout>
        </div>
    );
};
