import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { auth } from "../Backend/config/firebaseConfig"; // Ensure this is Firebase auth instance
import LandingPage from "./components/LandingPage/LandingPage";
import Login from "./components/Login/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import ProtectedRoute from "../Backend/Routes/ProtectedRoute";
import Transaction from "./components/Transactions/Transaction";
import Budget from "./components/Budget/Budget";
import Settings from "./components/Setting/Settings";
import { ThemeProvider } from "./contexts/ThemeContext";
const App: React.FC = () => {
	return (
		<ThemeProvider>
			<Router>
				<Routes>
					<Route path='/' element={<LandingPage />} />
					<Route
						path='/login'
						element={<Login showForm={true} onClose={() => {}} />}
					/>

					{/** we want to use protected routes to protect the parts of the website that displayes personal info
					 * Logic: The app checks whether a user is authenticated (logged in) before allowing them to access a protected page.
					 * Redirecting: If the user is not authenticated, they are typically redirected to a login page or another public route.
					 */}
					<Route element={<ProtectedRoute auth={auth} />}>
						<Route path='/dashboard' element={<Dashboard />} />
						<Route path='/transaction' element={<Transaction />} />
						<Route path='/GoalsTracker' element={<Budget />} />
						<Route path='/settings' element={<Settings />} />
						{/* Add more protected routes here */}
					</Route>
				</Routes>
			</Router>
		</ThemeProvider>
	);
};

export default App;
