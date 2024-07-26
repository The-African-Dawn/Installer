import { FC, useState, useEffect } from "react";
import { useTranslation } from 'react-i18next'; // Импортируем useTranslation
import { Layout } from "../components/Layout";
import { Button, Popup } from 'pixel-retroui'; 
import { IpcRendererEvent } from 'electron';
import { Link } from "react-router-dom";
const { ipcRenderer } = window.require("electron");

export const InstallPage: FC = () => {
    const { t } = useTranslation(); // Получаем функцию перевода
    const [downloaded, setDownloaded] = useState<boolean | null>(null);
    const [registryValue, setRegistryValue] = useState<string | null>(null);
    const [version, setVersion] = useState<string | null>('Не установлен!');
    const [versionHOI4, setVersionHOI4] = useState<string | null>('Не обнаружено!');
    const [enableSteam, setEnableSteam] = useState<boolean | null>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');  
    const [loading, setLoading] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isPopupInstallOpen, setIsPopupInstallOpen] = useState(false);
    const [isPopupNewVersionOpen, setIsPopupNewVersionOpen] = useState(false);
    const [currentAction, setCurrentAction] = useState<'install' | 'update' | 'reinstall' | null>(null);

    const openPopup = () => setIsPopupOpen(true);
    const closePopup = () => setIsPopupOpen(false);
    const openInstallPopup = () => setIsPopupInstallOpen(true);
    const closeInstallPopup = () => setIsPopupInstallOpen(false);
    const openNewVersionPopup = () => setIsPopupNewVersionOpen(true);
    const closeNewVersionPopup = () => setIsPopupNewVersionOpen(false);

    const handleModAction = async (action: 'install' | 'update' | 'reinstall') => {
        setLoading(true);
        setLoadingMessage(action === 'install' ? t('installing') : t('installing'));
        setCurrentAction(action);
        try {
            if (action === 'install') {
                await ipcRenderer.invoke('checkRegistryAndDownload');
                window.location.reload();
            } else if (action === 'reinstall') {
                await ipcRenderer.invoke('reInstallMod');
            } else {
                const isLatest = await ipcRenderer.invoke('checkLatestVersion');
                if (isLatest) {
                    openNewVersionPopup();
                }
                await ipcRenderer.invoke('checkRegistryAndDownload');
            }
        } catch (err) {
            console.error('Error checking and downloading mod:', err);
        } finally {
            setLoading(false);
            setCurrentAction(null);
        }
    };

    useEffect(() => {
        ipcRenderer.on('download-progress', (event: IpcRendererEvent, progress: number) => {
            setLoadingMessage(`${t('installing')} (${progress}%)`); 
        });

        ipcRenderer.on('download-complete', () => {
            setLoading(false);
            setLoadingMessage('Загрузка завершена.');  
        });

        (async () => {
            try {
                const steamSupport = await ipcRenderer.invoke('enableSteamSupportMethod');
                setEnableSteam(steamSupport);
                if (!steamSupport) {
                    const pathValue = await ipcRenderer.invoke('get-hoi4-path-reg');
                    if (pathValue == null) {
                        openInstallPopup();
                    }
                }
                const status = await ipcRenderer.invoke('get-registry-status');
                setRegistryValue(status);
                const ver = await ipcRenderer.invoke('get-registry-version');
                if (ver !== null) setVersion(ver);
                const hoi4Version = await ipcRenderer.invoke('getSteamVersionHOI4');
                if (hoi4Version !== null) setVersionHOI4(hoi4Version);
                const downloadedStatusReg = await ipcRenderer.invoke('get-registry-status');
                setDownloaded(downloadedStatusReg);
            } catch (err) {
                console.error('Error checking and downloading mod:', err);
            }
        })();

        return () => {
            ipcRenderer.removeAllListeners('download-progress');
            ipcRenderer.removeAllListeners('download-complete');
        };
    }, []);

    return (
        <div className="overflow-hidden scrollbar-none">
            <Layout>
                <Popup
                    isOpen={isPopupNewVersionOpen}
                    onClose={closeNewVersionPopup}
                    bg="black"
                    baseBg="white"
                    textColor="white"
                    borderColor="white"
                >
                    {t('latest_version')}
                </Popup>
                <Popup
                    isOpen={isPopupOpen}
                    onClose={closePopup}
                    bg="black"
                    baseBg="white"
                    textColor="white"
                    borderColor="white"
                >
                    {t('internet_connection')}
                    <br />
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
                    <h1 className="text-3xl mb-4">{t('no_steam_version')}</h1>
                    <div className="flex items-center justify-center">
                        <Button
                            bg="black"
                            textColor="white"
                            borderColor="white"
                            shadow="white"
                            type="submit"
                            onClick={() => { closeInstallPopup(); }}
                        >
                            {t('steam_version_exists')}
                        </Button>
                        <Button
                            bg="black"
                            textColor="white"
                            borderColor="white"
                            shadow="white"
                            type="submit"
                            onClick={() => { closeInstallPopup(); ipcRenderer.invoke('setInstallCustomNoSteamPathHOI4'); }}
                        >
                            {t('steam_version_not_exists')}
                        </Button>
                    </div>
                </Popup>
                <div className="overflow-hidden scrollbar-none h-[96dvh] bg-black bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:24px_24px]">
                    <header>
                        <div className="flex flex-col items-center justify-center h-screen">
                            <div className="absolute top-16 left-6">
                                <Link to="/">
                                    <Button
                                        bg="black"
                                        textColor="white"
                                        borderColor="white"
                                        shadow="white"
                                        className="mx-auto"
                                    >
                                        {'<-'}
                                    </Button>
                                </Link>
                            </div>
                            <div className="justify-center">
                                <h1 className="text-6xl font-minecraft mb-4 text-center">{t('install')}</h1>
                            </div>
                            <div className="flex justify-center items-center gap-8 space-x-4">
                                <div className="flex flex-row gap-8 items-center justify-center">
                                    {registryValue !== '0x1' && (
                                        <Button
                                            bg="orange"
                                            textColor="white"
                                            borderColor="white"
                                            shadow="white"
                                            className="mx-auto"
                                            onClick={() => handleModAction('install')}
                                            disabled={loading}
                                        >
                                            {loading && currentAction === 'install' ? loadingMessage : t('install_mod')}
                                        </Button>
                                    )}
                                    {registryValue === '0x1' && currentAction !== 'reinstall' && (
                                        <Button
                                            bg="black"
                                            textColor="white"
                                            borderColor="white"
                                            shadow="white"
                                            className="mx-auto"
                                            onClick={() => handleModAction('update')}
                                            disabled={loading}
                                        >
                                            {loading && currentAction === 'update' ? loadingMessage : t('update_mod')}
                                        </Button>
                                    )}
                                    {registryValue === '0x1' && currentAction !== 'update' && (
                                        <Button
                                            bg="black"
                                            textColor="white"
                                            borderColor="white"
                                            shadow="white"
                                            className="mx-auto"
                                            onClick={() => handleModAction('reinstall')}
                                            disabled={loading}
                                        >
                                            {loading && currentAction === 'reinstall' ? loadingMessage : t('reinstall_mod')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>
                    <footer className="absolute bottom-2 right-2 text-right text-sm text-gray-500">
                        <p>{t('version')} {version}</p>
                        <p>{t('hoi4_version')} {versionHOI4}</p>
                        <p>African Dawn Team ©{(new Date().getFullYear())}</p>
                    </footer>
                </div>
            </Layout>
        </div>
    );
};