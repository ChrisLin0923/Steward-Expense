import styles from "./Settings.module.css";
import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../Sidebar/sidebar";
import { auth } from "../../../Backend/config/firebaseConfig";
import { FirestoreService } from "../../../Backend/config/firestoreService";
import { useTheme, ThemeType } from "../../contexts/ThemeContext";
import {
	User,
	Mail,
	Key,
	Palette,
	LifeBuoy,
	Shuffle,
	ChevronRight,
	Sun,
	Monitor,
	Moon,
	Sunset,
	Waves,
	Flower,
} from "lucide-react";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

interface ThemeOption {
	id: ThemeType;
	name: string;
	icon: React.ReactNode;
	description: string;
}

interface UserSettings {
	firstName?: string;
	lastName?: string;
	avatar?: string;
	theme?: ThemeType;
	email?: string;
}

interface PresetAvatar {
	id: string;
	url: string;
	alt: string;
}

const Settings: React.FC = () => {
	const { theme, setTheme } = useTheme();
	const [selectedTheme, setSelectedTheme] = useState<ThemeType>(theme);
	const [userProfile, setUserProfile] = useState({
		firstName: "",
		lastName: "",
		email: "",
		avatar: "",
		theme: "",
	});
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [isChangingEmail, setIsChangingEmail] = useState(false);
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
	const [passwordCurrentPassword, setPasswordCurrentPassword] = useState("");
	const [authProvider, setAuthProvider] = useState<string>("");
	const [avatarSeeds, setAvatarSeeds] = useState({
		adventurer: "felix",
		bottts: "bella",
		lorelei: "luna",
		pixelArt: "oliver",
		thumbs: "milo",
		funEmoji: "leo",
	});

	const shuffleAvatars = () => {
		const newSeeds = {
			adventurer: Math.random().toString(36).substring(7),
			bottts: Math.random().toString(36).substring(7),
			lorelei: Math.random().toString(36).substring(7),
			pixelArt: Math.random().toString(36).substring(7),
			thumbs: Math.random().toString(36).substring(7),
			funEmoji: Math.random().toString(36).substring(7),
		};
		setAvatarSeeds(newSeeds);
	};

	const themeOptions: ThemeOption[] = [
		{
			id: "light",
			name: "Light",
			icon: <Sun size={20} />,
			description: "Clean and bright interface",
		},
		{
			id: "dark",
			name: "Dark",
			icon: <Moon size={20} />,
			description: "Easy on the eyes",
		},
		{
			id: "Sunset",
			name: "Sunset",
			icon: <Sunset size={20} />,
			description: "Warm and cozy interface",
		},
		{
			id: "Ocean",
			name: "Ocean",
			icon: <Waves size={20} />,
			description: "Calm and serene interface",
		},
		{
			id: "Olivia",
			name: "Olivia",
			icon: <Flower size={20} />,
			description: "Elegant black & pink theme",
		},
	];

	const presetAvatars: PresetAvatar[] = [
		{
			id: "avatar1",
			url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeeds.adventurer}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`,
			alt: "Adventurer Style",
		},
		{
			id: "avatar2",
			url: `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeeds.bottts}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`,
			alt: "Robot Style",
		},
		{
			id: "avatar3",
			url: `https://api.dicebear.com/7.x/lorelei/svg?seed=${avatarSeeds.lorelei}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`,
			alt: "Lorelei Style",
		},
		{
			id: "avatar4",
			url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${avatarSeeds.pixelArt}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`,
			alt: "Pixel Art Style",
		},
		{
			id: "avatar5",
			url: `https://api.dicebear.com/7.x/thumbs/svg?seed=${avatarSeeds.thumbs}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`,
			alt: "Thumbs Style",
		},
		{
			id: "avatar6",
			url: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${avatarSeeds.funEmoji}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50`,
			alt: "Fun Emoji Style",
		},
	];
	const handleThemeChange = async (newTheme: ThemeType) => {
		try {
			setSelectedTheme(newTheme);

			await setTheme(newTheme);
			await FirestoreService.saveUserSetting(auth.currentUser?.uid!, {
				theme: newTheme,
			});
		} catch (error) {
			console.error("Error changing theme:", error);
		}
	};

	const handleEmailChange = async () => {
		if (!emailCurrentPassword) {
			setError("Please enter your current password");
			return;
		}
		if (!newEmail) {
			setError("Please enter a new email address");
			return;
		}
		if (newEmail === userProfile.email) {
			setError("New email cannot be the same as the current email");
			return;
		}
		if (!/\S+@\S+\.\S+/.test(newEmail)) {
			setError("Please enter a valid email address");
			return;
		}
		if (!userProfile.email) {
			setError("User email is undefined");
			return;
		}

		try {
			if (!auth.currentUser || !userProfile.email) {
				throw new Error("No authenticated user found");
			}

			const credential = EmailAuthProvider.credential(
				userProfile.email,
				emailCurrentPassword
			);

			await reauthenticateWithCredential(auth.currentUser, credential);
			setIsChangingEmail(true);
			setError("");

			const result = await FirestoreService.updateUserEmail(
				newEmail,
				emailCurrentPassword
			);
			alert(result.message);

			setEmailCurrentPassword("");
			setNewEmail("");
		} catch (error: any) {
			console.log("Error code:", error.code);
			if (
				error.code === "auth/wrong-password" ||
				error.code === "auth/invalid-credential" ||
				error.code === "auth/invalid-login-credentials"
			) {
				setError("Incorrect password");
				alert("Incorrect password");
			} else {
				const errorMessage = error.message || "Failed to update email";
				setError(errorMessage);
				alert(errorMessage);
			}
			return;
		} finally {
			setIsChangingEmail(false);
		}
	};

	const handlePasswordChange = async () => {
		if (!passwordCurrentPassword) {
			setError("Please enter your current password");
			return;
		}
		if (newPassword !== confirmPassword) {
			setError("New passwords don't match");
			return;
		}
		if (newPassword.length < 6) {
			setError("New password must be at least 6 characters");
			return;
		}

		try {
			setIsChangingPassword(true);
			setError("");
			await FirestoreService.updateUserPassword(
				passwordCurrentPassword,
				newPassword
			);
			setPasswordCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			alert("Password updated successfully!");
		} catch (error: any) {
			setError(error.message);
		} finally {
			setIsChangingPassword(false);
		}
	};

	useEffect(() => {
		const loadUserProfile = async () => {
			setLoading(true);
			try {
				const currentUser = auth.currentUser;
				if (currentUser) {
					const providers = currentUser.providerData.map(
						(provider) => provider.providerId
					);

					const hasPasswordAuth = providers.includes("password");
					setAuthProvider(
						hasPasswordAuth ? "password" : "google.com"
					);

					const userData = await FirestoreService.getUserData(
						currentUser.uid
					);
					const userSettings = await FirestoreService.getUserSetting(
						currentUser.uid
					);

					setUserProfile({
						firstName: userData?.firstName || "",
						lastName: userData?.lastName || "",
						email: userData?.email || "",
						avatar: userData?.avatar || "",
						theme: userData?.theme || "",
					});
				}
			} catch (error) {
				console.error("Error loading user profile:", error);
			} finally {
				setLoading(false);
			}
		};

		loadUserProfile();
	}, [theme]);

	useEffect(() => {
		const handleEmailVerification = async () => {
			const searchParams = new URLSearchParams(window.location.search);
			const isEmailVerification =
				searchParams.get("mode") === "verifyEmail";
			const isEmailUpdate =
				searchParams.get("operation") === "updateEmail";

			if (isEmailVerification && isEmailUpdate) {
				window.history.replaceState({}, "", window.location.pathname);

				if (auth.currentUser) {
					const userData = await FirestoreService.getUserData(
						auth.currentUser.uid
					);
					setUserProfile({
						firstName: userData?.firstName || "",
						lastName: userData?.lastName || "",
						email: userData?.email || "",
						avatar: userData?.avatar || "",
						theme: userData?.theme || "",
					});
				}
			}
		};

		handleEmailVerification();
	}, [window.location.search]);

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(async (user) => {
			if (user) {
				try {
					await FirestoreService.handleUserLogin(user);
					const userData = await FirestoreService.getUserData(
						user.uid
					);
					setUserProfile({
						firstName: userData?.firstName || "",
						lastName: userData?.lastName || "",
						email: userData?.email || "",
						avatar: userData?.avatar || "",
						theme: userData?.theme || "",
					});
					if (userData && userData.theme) {
						setSelectedTheme(userData.theme as ThemeType);
						await setTheme(userData.theme as ThemeType);
					}
				} catch (error) {
					// Keep error handling but remove console.error
				}
			}
		});

		return () => unsubscribe();
	}, [setTheme]);

	const handleSaveChanges = async () => {
		setIsSaving(true);
		try {
			if (!userProfile.firstName || !userProfile.lastName) {
				throw new Error("Please fill in all required fields");
			}

			const settingsData: UserSettings = {};

			if (userProfile.firstName)
				settingsData.firstName = userProfile.firstName.trim();
			if (userProfile.lastName)
				settingsData.lastName = userProfile.lastName.trim();
			if (userProfile.avatar) settingsData.avatar = userProfile.avatar;

			await FirestoreService.saveUserSetting(
				auth.currentUser?.uid!,
				settingsData
			);
		} catch (error) {
			console.error("Error saving changes:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const handlePresetAvatarSelect = (avatarUrl: string) => {
		setUserProfile({
			...userProfile,
			avatar: avatarUrl,
		});
	};

	useEffect(() => {
		setSelectedTheme(theme);
	}, [theme]);

	return (
		<div className={styles.settings}>
			<Sidebar />
			<main className={styles.settingsContent}>
				{/* Left Column - Account Settings */}
				<div className={styles.accountColumn}>
					<section className={styles.settingsSection}>
						<h2 className={styles.sectionTitle}>
							<User className={styles.sectionIcon} /> Account
						</h2>

						{/* Personal Information + Avatar */}
						<div className={styles.settingCard}>
							<div className={styles.settingInfo}>
								<div className={styles.settingIcon}>
									<User size={20} />
								</div>
								<div>
									<h3>Personal Information</h3>
									<p>Update your profile details</p>
								</div>
							</div>

							<div className={styles.personalInfoContent}>
								{/* Avatar Selection */}
								<div className={styles.avatarSection}>
									<div className={styles.avatarWrapper}>
										{userProfile.avatar ? (
											<img
												src={userProfile.avatar}
												alt='Profile'
												className={styles.avatar}
											/>
										) : (
											<div
												className={
													styles.avatarPlaceholder
												}
											>
												<User size={40} />
											</div>
										)}
									</div>
									<div className={styles.avatarControls}>
										<button
											className={styles.shuffleButton}
											onClick={shuffleAvatars}
											title='Generate new avatars'
										>
											<Shuffle size={20} />
											Shuffle Avatars
										</button>
									</div>
									<div className={styles.presetAvatars}>
										{presetAvatars.map((avatar) => (
											<button
												key={avatar.id}
												className={`${
													styles.presetAvatar
												} ${
													userProfile.avatar ===
													avatar.url
														? styles.selectedAvatar
														: ""
												}`}
												onClick={() =>
													handlePresetAvatarSelect(
														avatar.url
													)
												}
											>
												<img
													src={avatar.url}
													alt={avatar.alt}
												/>
											</button>
										))}
									</div>
								</div>

								{/* Personal Info Form */}
								<div className={styles.settingForm}>
									<input
										type='text'
										placeholder='First Name'
										value={userProfile.firstName}
										onChange={(e) =>
											setUserProfile({
												...userProfile,
												firstName: e.target.value,
											})
										}
									/>
									<input
										type='text'
										placeholder='Last Name'
										value={userProfile.lastName}
										onChange={(e) =>
											setUserProfile({
												...userProfile,
												lastName: e.target.value,
											})
										}
									/>

									<button
										className={styles.saveButton}
										onClick={handleSaveChanges}
										disabled={isSaving}
									>
										{isSaving ? (
											<>
												<span
													className={styles.spinner}
												/>
												Saving...
											</>
										) : (
											"Save Changes"
										)}
									</button>
								</div>
							</div>
						</div>

						{/* Email Settings */}
						{authProvider === "password" ? (
							<div className={styles.settingCard}>
								<div className={styles.settingInfo}>
									<div className={styles.settingIcon}>
										<Mail size={20} />
									</div>
									<div>
										<h3>Email</h3>
										<p>{userProfile.email}</p>
									</div>
								</div>
								<div className={styles.settingForm}>
									<input
										type='password'
										placeholder='Current Password'
										value={emailCurrentPassword}
										onChange={(e) =>
											setEmailCurrentPassword(
												e.target.value
											)
										}
									/>
									<input
										type='email'
										placeholder='New Email'
										value={newEmail}
										onChange={(e) =>
											setNewEmail(e.target.value)
										}
									/>
									<button
										onClick={handleEmailChange}
										disabled={isChangingEmail}
									>
										{isChangingEmail
											? "Updating..."
											: "Update Email"}
									</button>
								</div>
							</div>
						) : (
							<div className={styles.settingCard}>
								<div className={styles.settingInfo}>
									<div className={styles.settingIcon}>
										<Mail size={20} />
									</div>
									<div>
										<h3>Email</h3>
										<p>{userProfile.email}</p>
										<p className={styles.providerNote}>
											Managed by Google Account
										</p>
									</div>
								</div>
							</div>
						)}

						{/* Password Settings */}
						{authProvider === "password" ? (
							<div className={styles.settingCard}>
								<div className={styles.settingInfo}>
									<div className={styles.settingIcon}>
										<Key size={20} />
									</div>
									<div>
										<h3>Password</h3>
										<p>Change your account password</p>
									</div>
								</div>
								<div className={styles.settingForm}>
									<input
										type='password'
										placeholder='Current Password'
										value={passwordCurrentPassword}
										onChange={(e) =>
											setPasswordCurrentPassword(
												e.target.value
											)
										}
									/>
									<input
										type='password'
										placeholder='New Password'
										value={newPassword}
										onChange={(e) =>
											setNewPassword(e.target.value)
										}
									/>
									<input
										type='password'
										placeholder='Confirm New Password'
										value={confirmPassword}
										onChange={(e) =>
											setConfirmPassword(e.target.value)
										}
									/>
									<button
										onClick={handlePasswordChange}
										disabled={isChangingPassword}
									>
										{isChangingPassword
											? "Updating..."
											: "Update Password"}
									</button>
								</div>
							</div>
						) : (
							<div className={styles.settingCard}>
								<div className={styles.settingInfo}>
									<div className={styles.settingIcon}>
										<Key size={20} />
									</div>
									<div>
										<h3>Password</h3>
										<p className={styles.providerNote}>
											Managed by Google Account
										</p>
									</div>
								</div>
							</div>
						)}
					</section>
				</div>

				{/* Right Column - Theme and Support */}
				<div className={styles.customizationColumn}>
					<section className={styles.settingsSection}>
						<h2 className={styles.sectionTitle}>
							<Palette className={styles.sectionIcon} />{" "}
							Appearance
						</h2>
						<div className={styles.themeSelector}>
							<h3>Theme</h3>
							<p className={styles.themeDescription}>
								Choose how Steward looks to you
							</p>
							<div className={styles.themeOptions}>
								{themeOptions.map((option) => (
									<div
										key={option.id}
										className={`${styles.themeCard} ${
											selectedTheme === option.id
												? styles.selected
												: ""
										}`}
										onClick={() =>
											handleThemeChange(option.id)
										}
									>
										<div
											className={styles.themeIconWrapper}
										>
											{option.icon}
										</div>
										<div className={styles.themeInfo}>
											<h4>{option.name}</h4>
											<p>{option.description}</p>
										</div>
										<div className={styles.themeSelector}>
											<div className={styles.radioOuter}>
												<div
													className={`${
														styles.radioInner
													} ${
														selectedTheme ===
														option.id
															? styles.radioSelected
															: ""
													}`}
												/>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</section>

					<section className={styles.settingsSection}>
						<h2 className={styles.sectionTitle}>
							<LifeBuoy size={24} /> Support
						</h2>
						<div className={styles.supportCard}>
							<div className={styles.settingInfo}>
								<h3>Contact Developer</h3>
								<p className={styles.developerContact}>
									Email:
									<a
										href='https://mail.google.com/mail/?view=cm&fs=1&to=chrislinflhs@gmail.com&su=Steward%20Expense%20Inquiry&body=Hello%20Chris,'
										onClick={(e) => {
											// If Gmail app/web fails, fall back to mailto
											if (
												!window.open(
													e.currentTarget.href,
													"_blank"
												)
											) {
												window.location.href =
													"mailto:chrislinflhs@gmail.com";
											}
											e.preventDefault();
										}}
									>
										chrislinflhs@gmail.com
									</a>
								</p>
							</div>
							<ChevronRight
								color='var(--text-secondary)'
								size={20}
							/>
						</div>
					</section>
				</div>
			</main>
		</div>
	);
};

export default Settings;
