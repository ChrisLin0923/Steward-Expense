import React, { useState } from "react";
import styles from "./Login.module.css";
import {
	createUserWithEmailAndPassword,
	sendEmailVerification,
	signInWithEmailAndPassword,
	signInWithPopup,
	fetchSignInMethodsForEmail,
} from "firebase/auth";

/**getDatabase() returns a reference to the firebase realtime database, we use it to establish a connection with the database.
 *ref () creates a reference to a specific location in the database.(e.g. user specific node in the database);
 set() uses ref() to target a specific location in database and replaces it. We use it to save data to the database. 
 */
import { getDatabase, ref, set } from "firebase/database";

import {
	auth,
	googleProvider,
	database,
} from "../../../Backend/config/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { FirestoreService } from "../../../Backend/config/firestoreService";

interface LoginProps {
	showForm: boolean; // Whether the form is visible
	onClose: () => void; // Function to close the form
}

const Login: React.FC<LoginProps> = ({ showForm, onClose }) => {
	const navigate = useNavigate(); //Function from react-router-dom
	// The following useState hooks manage the state of the input fields,
	// monitoring any changes in the form data (email, password, etc.)
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [isCreatingAccount, setIsCreatingAccount] = useState(false); //The default state is saying setIsCreatingAccount is false, indicating the user by default is greated with sign-in option.

	/**
	 *
	 * @param e React.FormEvent,this is a type provided by React that represents events associated with forms. Ex: submitting a form or making changes to input fields.
	 * @returns alert if password doesn't match with confirmPassword.
	 * This function is called when the form is submitted, Both log-in and register form.
	 */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault(); // Prevent default form submission behavior

		if (isCreatingAccount) {
			// Handle account creation
			if (password !== confirmPassword) {
				alert("Passwords do not match!");
				return;
			}
			//If password & confrimPassword matches, we can call handle register. Since we are under the creating account form.
			await handleRegister();
		} else {
			//
			await handleLogin(e); //If we aren't in the creating account form, that means we are signing in, so directly call handleLogin when form is submitted.
		}
	};

	/**
	 * This function handles creating a new user using the data collected in the registration form.
	 * It uses Firebase Authentication to create the user's credentials and stores additional
	 * user information in the Firestore Database.
	 */
	const handleRegister = async () => {
		try {
			// Validate input fields first
			if (!email || !password || !firstName || !lastName) {
				alert("Please fill in all fields");
				return;
			}

			// Log the registration method
			console.log("Registering with email/password");

			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email,
				password
			);
			const user = userCredential.user;

			// Log the user's provider data after creation
			console.log("New user provider data:", user.providerData);

			try {
				// Save user data to Firestore
				await FirestoreService.saveUserData(user.uid, {
					email: email,
					firstName: firstName,
					lastName: lastName,
					last_login: Date.now(),
				});
			} catch (firestoreError) {
				// If Firestore save fails, delete the auth user
				await user.delete();
				throw new Error("Failed to save user data. Please try again.");
			}

			await sendEmailVerification(user);
			alert(
				"Registration successful! Please check your email for verification."
			);
			navigate("/dashboard");
			onClose();
		} catch (error: any) {
			console.error("Error during registration:", error);
			switch (error.code) {
				case "auth/email-already-in-use":
					alert(
						"This email is already registered. Please try logging in instead."
					);
					break;
				case "auth/invalid-email":
					alert("Please enter a valid email address.");
					break;
				case "auth/weak-password":
					alert("Password should be at least 6 characters long.");
					break;
				default:
					alert(
						error.message || "An error occurred during registration"
					);
			}
		}
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const userCredential = await signInWithEmailAndPassword(
				auth,
				email,
				password
			);

			// Sync email after successful login
			await FirestoreService.handleUserLogin(userCredential.user);

			console.log("Signed In Successfully!");
			navigate("/dashboard");
		} catch (error: any) {
			console.error("Error signing in:", error);
			alert(error);
		}
	};

	//This function enables users to sign-in directly with their existing Google's accoount.
	const handleGoogleSignIn = async () => {
		try {
			const result = await signInWithPopup(auth, googleProvider); //The signInWithPopup function is google's built-in function
			//Auth is an instance of firebase authentication. Tracks the state of the user's authentication and performs actions like signing in or out.
			//googleProvider is an instance of GoogleAuthProvider,which is a class from firebase that specifically handles authentication with Google. It allows app to configure Google as a sign in provider.
			//signInWithPopup returns a Promise that resolves a object typeUserCredential. The object contains importants info about the authenticated user.

			/**
			 * user: This is the most important property and contains the User object that represents the authenticated user. It holds various details such as:
				uid: The unique identifier for the user.
				displayName: The user's display name (if available).
				email: The user's email address.
				photoURL: The user's profile picture (if available).
				emailVerified: A boolean indicating whether the email has been verified.
			 */
			const user = result.user;

			const userEmail = user.email; // User's email
			const userRef = ref(database, "users/" + user.uid);

			// Get userName and check for null
			const userName = user.displayName;

			// Initialize first and last name variables
			let firstName = "";
			let lastName = "";

			if (userName) {
				//If userName is not empty, we will proceed to split the first and last name to be saved in the database.
				// Split the display name into first and last names
				const nameParts = userName.split(" ");
				firstName = nameParts[0]; // First name
				lastName =
					nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""; // Last name (if exists)
			} else {
				//Otherwise if it is empty, we will just fill-in default data for the name. User should later be able to change it.
				// Handle the case where userName is null
				firstName = "User"; // Default first name or any fallback logic
				lastName = ""; // You can leave last name empty or set a default value
			}

			// // Save user data to the Realtime Database
			// await set(userRef, {
			// 	//userRef is the exact location in the database in which we will write our data. (Think of index)
			// 	email: userEmail,
			// 	firstName: firstName,
			// 	lastName: lastName,
			// 	last_login: Date.now(), // Store the timestamp of the last login
			// });

			// Optionally save user data separately, if needed
			saveUserToDatabase(user.uid, firstName, lastName, userEmail);

			// Navigate to the dashboard after successful login
			navigate("/dashboard");
		} catch (error) {
			console.error("Error signing in with Google:", error);
			alert("Google Sign-In failed!");
		}
	};

	const saveUserToDatabase = async (
		userId: string,
		firstName: string | null,
		lastName: string | null,
		email: string | null
	) => {
		try {
			await FirestoreService.saveUserData(userId, {
				firstName: firstName || "",
				lastName: lastName || "",
				email: email || "",
				last_login: Date.now(),
			});
			console.log("User data saved successfully!");
		} catch (error) {
			console.error("Error saving user data:", error);
		}
	};
	//A toggle to display sign in page and create account form
	const toggleCreateAccount = () => {
		setIsCreatingAccount(!isCreatingAccount);
	};

	return (
		<div className={styles["login-page"]}>
			<div className={styles.modalWrapper}>
				<div className={styles.modalContent}>
					<h2>{isCreatingAccount ? "Create Account" : "Login"}</h2>
					<form onSubmit={handleSubmit}>
						<div>
							<label>Email</label>
							<input
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div>
							<label>Password</label>
							<input
								type='password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
						{isCreatingAccount && (
							<div>
								<label>Confirm Password</label>
								<input
									type='password'
									value={confirmPassword}
									onChange={(e) =>
										setConfirmPassword(e.target.value)
									}
									required
								/>
								<label>First Name</label>
								<input
									type='text'
									value={firstName}
									onChange={(e) =>
										setFirstName(e.target.value)
									}
									required
								/>
								<label>Last Name</label>
								<input
									type='text'
									value={lastName}
									onChange={(e) =>
										setLastName(e.target.value)
									}
									required
								/>
							</div>
						)}
						<button className={styles.btn} type='submit'>
							{isCreatingAccount ? "Create Account" : "Sign In"}
						</button>
					</form>

					<button
						className={styles.btn}
						onClick={toggleCreateAccount}
					>
						{isCreatingAccount
							? "Already have an account? Sign In"
							: "Don't have an account? Create one"}
					</button>

					{/* Add Google Sign In Button */}
					<button className={styles.btn} onClick={handleGoogleSignIn}>
						Sign In with Google
					</button>
				</div>
			</div>
		</div>
	);
};

export default Login;
