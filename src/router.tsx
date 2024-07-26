import { FC } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { IndexPage } from "./pages";
import { InstallPage } from "./pages/installer";

export const Router: FC = () => {
	return (
		<HashRouter>
			<Routes>
				<Route path="/">
					<Route index element={<IndexPage />} />
					<Route path="installer" element={<InstallPage />} />
				</Route>
			</Routes>
		</HashRouter>
	);
};
