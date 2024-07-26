import React from "react";
import ReactDOM from "react-dom/client";


import "react-toastify/dist/ReactToastify.css";
import "./styles/index.css";
import "./styles/tailwind.css";
import "./styles/titlebar.css";
import { I18nextProvider } from 'react-i18next';
import i18n from './pages/tr';  // Импортируйте ваш tr.tsx

import { Router } from "./router";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

root.render(
	<I18nextProvider i18n={i18n}>
	<React.StrictMode>
		<Router />
	</React.StrictMode>
	</I18nextProvider>,
);
