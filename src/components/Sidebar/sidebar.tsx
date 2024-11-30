import React, { useEffect, useState } from "react";
import Navbar from "../Dashboard/Navbar";
import styles from "./Sidebar.module.css";
import { FirestoreService } from "../../../Backend/config/firestoreService";
import { auth } from "../../../Backend/config/firebaseConfig";
import { ThemeType, useTheme } from "../../contexts/ThemeContext";
import { Moon, Sun, Menu } from "lucide-react"; // Import icons

const Sidebar: React.FC = () => {
	const [userData, setUserData] = useState<any>(null);
	const [avatar, setAvatar] = useState<string>("");
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

	const fetchAvatarData = async () => {
		const userSettings = await FirestoreService.getUserSetting(
			auth.currentUser?.uid || ""
		);
		setAvatar(userSettings?.avatar || "");
	};

	fetchAvatarData();

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const currentUser = auth.currentUser;
				if (currentUser) {
					const userDoc = await FirestoreService.getUserData(
						currentUser.uid
					);
					if (userDoc) {
						setUserData(userDoc);
					}
				}
			} catch (error) {
				console.error("Error fetching user data:", error);
			}
		};

		fetchUserData();
	}, []);

	// Check screen size on mount and resize
	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobileOrTablet(window.innerWidth <= 1024);
		};

		// Initial check
		checkScreenSize();

		// Add resize listener
		window.addEventListener("resize", checkScreenSize);

		// Cleanup
		return () => window.removeEventListener("resize", checkScreenSize);
	}, []);

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
		// Prevent body scroll when sidebar is open
		document.body.style.overflow = !isSidebarOpen ? "hidden" : "auto";
	};

	return (
		<>
			{isMobileOrTablet && (
				<>
					<header className={styles.mobileHeader}>
						<div className={styles.mobileHeaderContent}>
							<button
								className={styles.mobileMenuBtn}
								onClick={toggleSidebar}
								aria-label='Toggle menu'
							>
								<Menu size={24} />
							</button>
							<div className={styles.logo}>
								<img
									src='src/assets/steward_logo.png'
									alt='Steward Logo'
									className={styles.stewardlogo}
								/>
							</div>
						</div>
					</header>

					{/* Overlay */}
					<div
						className={`${styles.sidebarOverlay} ${
							isSidebarOpen ? styles.active : ""
						}`}
						onClick={toggleSidebar}
					/>
				</>
			)}

			{/* Sidebar - Don't conditionally render based on mobile */}
			<aside
				className={`${styles.sidebar} ${
					isSidebarOpen ? styles.active : ""
				}`}
			>
				{!isMobileOrTablet && (
					<div className={styles.logo}>
						<img
							src='src/assets/steward_logo.png'
							alt='Steward Logo'
							className={styles.stewardlogo}
						/>
					</div>
				)}

				<div className={styles.navigation}>
					<Navbar />
				</div>

				<div className={styles.userInfo}>
					{userData ? (
						<>
							<div className={styles.avatar}>
								<img
									src={avatar}
									alt='profile picture'
									className={styles.stewardlogo}
								/>
							</div>
							<div className={styles.userInfoText}>
								<h5>
									{userData.firstName} {userData.lastName}
								</h5>
								<p>{userData.email}</p>
							</div>
						</>
					) : (
						<>
							<div
								className={`${styles.skeleton} ${styles.avatarSkeleton}`}
							></div>
							<div className={styles.skeleton}></div>
							<div className={styles.skeleton}></div>
						</>
					)}
				</div>
			</aside>
		</>
	);
};

export default Sidebar;
