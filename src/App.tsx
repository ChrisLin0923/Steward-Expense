import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { auth } from "../Backend/config/firebaseConfig";
import { FirestoreService } from "../Backend/config/firestoreService";
import LandingPage from "./components/LandingPage/LandingPage";
import Login from "./components/Login/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import ProtectedRoute from "../Backend/Routes/ProtectedRoute";
import Transaction from "./components/Transactions/Transaction";
import Budget from "./components/Budget/Budget";
import Settings from "./components/Setting/Settings";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

const AppContent: React.FC = () => {
	const { setTheme } = useTheme();

	useEffect(() => {
		const initializeTheme = async () => {
			const unsubscribe = auth.onAuthStateChanged(async (user) => {
				if (user) {
					try {
						const userSettings =
							await FirestoreService.getUserSettings(user.uid);
						if (userSettings?.theme) {
							document.documentElement.setAttribute(
								"data-theme",
								userSettings.theme
							);
							await setTheme(userSettings.theme);
						}
					} catch (error) {
						console.error("Error loading theme:", error);
					}
				}
			});

			return () => unsubscribe();
		};

		initializeTheme();
	}, [setTheme]);

	return (
		<Router>
			<Routes>
				<Route path='/' element={<LandingPage />} />
				<Route
					path='/login'
					element={<Login showForm={true} onClose={() => {}} />}
				/>
				<Route element={<ProtectedRoute auth={auth} />}>
					<Route path='/dashboard' element={<Dashboard />} />
					<Route path='/transaction' element={<Transaction />} />
					<Route path='/GoalsTracker' element={<Budget />} />
					<Route path='/settings' element={<Settings />} />
				</Route>
			</Routes>
		</Router>
	);
};

const App: React.FC = () => {
	return (
		<ThemeProvider>
			<AppContent />
		</ThemeProvider>
	);
};

export default App;
