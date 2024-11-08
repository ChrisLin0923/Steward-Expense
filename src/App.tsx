import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { auth } from "../Backend/config/firebaseConfig"; // Ensure this is Firebase auth instance
import LandingPage from "./components/LandingPage/LandingPage";
import Login from "./components/Login/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import ProtectedRoute from "../Backend/Routes/ProtectedRoute";
import Transaction from "./components/Transactions/Transaction";
import Budget from "./components/Budget/Budget";
const App: React.FC = () => {
	return (
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
					<Route path='/budget' element={<Budget />} />
					{/* Add more protected routes here */}
				</Route>
			</Routes>
		</Router>
	);
};

export default App;
