import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../../Backend/config/firebaseConfig";
import { FirestoreService } from "../../Backend/config/firestoreService";

export type ThemeType = "light" | "dark" | "Sunset" | "Ocean" | "Olivia";

interface ThemeContextType {
	theme: ThemeType;
	setTheme: (theme: ThemeType) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [theme, setThemeState] = useState<ThemeType>("light");
	const [isLoading, setIsLoading] = useState(true);

	// Load theme when auth state changes or component mounts
	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(async (user) => {
			if (user) {
				try {
					// Get user settings from Firestore
					const userSettings = await FirestoreService.getUserSettings(
						user.uid
					);
					if (userSettings?.theme) {
						setThemeState(userSettings.theme as ThemeType);
						document.documentElement.setAttribute(
							"data-theme",
							userSettings.theme
						);
					}
				} catch (error) {
					console.error("Error loading theme:", error);
				}
			}
			setIsLoading(false);
		});

		return () => unsubscribe();
	}, []);

	const setTheme = async (newTheme: ThemeType) => {
		try {
			const user = auth.currentUser;
			if (user) {
				// Save to Firestore
				await FirestoreService.saveUserSetting(user.uid, {
					theme: newTheme,
				});
			}
			// Update local state and DOM
			setThemeState(newTheme);
			document.documentElement.setAttribute("data-theme", newTheme);
		} catch (error) {
			console.error("Error saving theme:", error);
			throw error;
		}
	};

	if (isLoading) {
		return null; // Or a loading spinner
	}

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};
