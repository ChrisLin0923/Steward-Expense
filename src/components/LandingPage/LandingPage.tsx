import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import styles from "./LandingPage.module.css"; // Importing the CSS module
import stewardLogo from "@/assets/steward_logo.png";

const LandingPage: React.FC = () => {
	const navigate = useNavigate(); // Initialize useNavigate

	const handleSignIn = () => {
		navigate("/login"); // Redirect to the login page
	};

	return (
		<div className={styles.landingPage}>
			{/* Navbar */}
			<nav className={styles.navbar}>
				<div className={styles.logo}>
					<img
						src={stewardLogo}
						alt='Steward Logo'
						className={styles.stewardlogo}
					/>
				</div>

				<div>
					<button className={styles.logInBtn} onClick={handleSignIn}>
						Log In
					</button>
				</div>
			</nav>

			{/* Hero Section */}
			<header className={styles.heroSection}>
				<h1>Take Control of Your Finances</h1>
				<p>
					Track, manage, and organize your expenses effortlessly. Stay
					on top of your spending with ease.
				</p>
			</header>

			{/* Features Section */}
			<section className={styles.featuresSection}>
				<div className={styles.feature}>
					<h3>Easy to Use</h3>
					<p>
						Add, edit, and categorize expenses quickly and
						intuitively.
					</p>
				</div>
				<div className={styles.feature}>
					<h3>Track Spending</h3>
					<p>
						View a detailed breakdown of your expenses by category
						and date.
					</p>
				</div>
				<div className={styles.feature}>
					<h3>Stay Organized</h3>
					<p>
						Export data and keep everything organized in one place.
					</p>
				</div>
			</section>

			{/* Footer */}
			<footer className={styles.footer}>
				<div className={styles.footerLinks}>
					<a href='#'>About Us</a>
					<a href='#'>Contact</a>
				</div>
			</footer>
		</div>
	);
};

export default LandingPage;
