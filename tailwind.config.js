/** @type {import("tailwindcss").Config} */
module.exports = {
	theme: {
		extend: {
			fontFamily: {
				minecraft: ["Minecraft", "sans-serif"],
				"minecraft-bold": ["MinecraftBold", "sans-serif"],
			},
			backgroundColor: {
				black: '#000000',  // используем для pageBg, cardBg, textareaBg
			},
			textColor: {
				white: '#FFFFFF',  // используем для текста
			},
			borderColor: {
				white: '#FFFFFF',  // используем для рамок
			},
			boxShadow: {
				white: '0 2px 4px 0 rgba(255, 255, 255, 0.1)', // используем для теней
			},
		},
	},
	important: true,
	content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
	darkMode: "media",
	plugins: [
		require('tailwindcss-no-scrollbar'),
	],
};
