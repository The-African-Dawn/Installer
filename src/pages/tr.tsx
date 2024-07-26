import LanguageDetector from 'i18next-browser-languagedetector';
import i18n from "i18next";
import { initReactI18next } from 'react-i18next';

i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
        resources: {
            ru: {
                translation: {
                    "officialwebsite": "African Dawn",
                    "internet_connection": "У вас отсутствует интернет соединение!",
                    "internet_question": "Вы точно находитесь в зоне Internet???",
                    "mod_not_found": "У вас отсутствует мод или хойка!",
                    "mod_install_question": "Вы точно все установили?",
                    "latest_version": "У вас уже последняя версия модификации!",
                    "installing": "Ищем мод...",
                    "install_mod": "Установить мод",
                    "update_mod": "Обновить мод",
                    "reinstall_mod": "Переустановить мод",
                    "no_steam_version": "У вас не обнаружена Steam версия HOI4.",
                    "steam_version_exists": "Она у меня есть!",
                    "steam_version_not_exists": "У меня ее нет!",
                    "check_updates": "Установить/Обновить",
                    "install": "Установка",
                    "version": "Версия",
                    "hoi4_version": "Hearts of Iron IV",
                    "run_game": "Запуск игры"
                }
            },
            en: {
                translation: {
                    "officialwebsite": "African Dawn",
                    "internet_connection": "You have no internet connection!",
                    "internet_question": "Are you sure you are in the Internet zone?",
                    "mod_not_found": "You are missing a mod or HOI4!",
                    "mod_install_question": "Are you sure you installed everything?",
                    "latest_version": "You already have the latest version of the modification!",
                    "installing": "Searching for mod...",
                    "install_mod": "Install mod",
                    "update_mod": "Update mod",
                    "reinstall_mod": "Reinstall mod",
                    "no_steam_version": "You do not have the Steam version of HOI4.",
                    "steam_version_exists": "I have it!",
                    "steam_version_not_exists": "I do not have it!",
                    "check_updates": "Install / Update",
                    "install": "Installation",
                    "version": "Version",
                    "hoi4_version": "Hearts of Iron IV",
                    "run_game": "Start game"
                }
            },
            fr: {
                translation: {
                    "officialwebsite": "African Dawn",
                    "internet_connection": "Vous n'êtes pas connecté à Internet !",
                    "internet_question": "Êtes-vous sûr d'être dans une zone Internet ???",
                    "mod_not_found": "Le mod ou HOI4 est introuvable !",
                    "mod_install_question": "Êtes-vous sûr d'avoir tout installé ?",
                    "latest_version": "Vous avez déjà la dernière version du mod !",
                    "installing": "Recherche du mod...",
                    "install_mod": "Installer le mod",
                    "update_mod": "Mettre à jour le mod",
                    "reinstall_mod": "Réinstaller le mod",
                    "no_steam_version": "Aucune version Steam de HOI4 n'a été trouvée.",
                    "steam_version_exists": "Je l'ai !",
                    "steam_version_not_exists": "Je ne l'ai pas !",
                    "check_updates": "Installer/Mettre à jour",
                    "install": "Installation",
                    "version": "Version",
                    "hoi4_version": "Hearts of Iron IV",
                    "run_game": "Lancer le jeu"
                }
            }
        },
        fallbackLng: "en",
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;