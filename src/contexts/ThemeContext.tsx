import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../../Backend/config/firebaseConfig";
import { FirestoreService } from "../../Backend/config/firestoreService";

export type ThemeType = "light" | "dark" | "Sunset" | "Ocean" | "Olivia";

interface ThemeContextType {
	theme: ThemeType;
	setTheme: (theme: ThemeType) => Promise<void>;
}

// Create context with a default value
const ThemeContext = createContext<ThemeContextType>({
	theme: "dark",
	setTheme: async () => {},
});

// Helper function to validate theme
const isValidTheme = (theme: string): theme is ThemeType => {
	return ["light", "dark", "Sunset", "Ocean", "Olivia"].includes(theme);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	// Initialize with default theme
	const [theme, setThemeState] = useState<ThemeType>("dark");
	const [isLoading, setIsLoading] = useState(true);

	// Initialize theme from localStorage or default
	useEffect(() => {
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme && isValidTheme(savedTheme)) {
			document.documentElement.setAttribute("data-theme", savedTheme);
			setThemeState(savedTheme);
		} else {
			document.documentElement.setAttribute("data-theme", "dark");
		}
	}, []);

	// Load theme from Firebase when auth state changes
	useEffect(() => {
		let isMounted = true;

		const unsubscribe = auth.onAuthStateChanged(async (user) => {
			if (user && isMounted) {
				try {
					const userSettings = await FirestoreService.getUserSettings(
						user.uid
					);
					if (
						userSettings?.theme &&
						isValidTheme(userSettings.theme)
					) {
						document.documentElement.setAttribute(
							"data-theme",
							userSettings.theme
						);
						setThemeState(userSettings.theme);
						localStorage.setItem("theme", userSettings.theme);
					}
				} catch (error) {
					console.error("Error loading theme:", error);
				}
			}
			if (isMounted) {
				setIsLoading(false);
			}
		});

		return () => {
			isMounted = false;
			unsubscribe();
		};
	}, []);

	const setTheme = async (newTheme: ThemeType) => {
		if (!isValidTheme(newTheme)) {
			throw new Error("Invalid theme type");
		}

		document.documentElement.setAttribute("data-theme", newTheme);
		setThemeState(newTheme);
		localStorage.setItem("theme", newTheme);

		try {
			const user = auth.currentUser;
			if (user) {
				await FirestoreService.saveUserSetting(user.uid, {
					theme: newTheme,
				});
			}
		} catch (error) {
			console.error("Error saving theme:", error);
			throw error;
		}
	};

	const value = {
		theme,
		setTheme,
	};

	if (isLoading) {
		return null;
	}

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};
