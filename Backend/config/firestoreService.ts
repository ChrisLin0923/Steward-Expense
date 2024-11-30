import {
	doc,
	setDoc,
	collection,
	addDoc,
	Timestamp,
	getDocs,
	getDoc,
	deleteDoc,
	updateDoc,
	deleteField,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { auth } from "./firebaseConfig";
import {
	updateEmail,
	updatePassword,
	EmailAuthProvider,
	reauthenticateWithCredential,
	sendEmailVerification,
	ActionCodeSettings,
	verifyBeforeUpdateEmail,
} from "firebase/auth";

interface Transaction {
	status: string;
	currency: string;
	id: string;
	type: "income" | "expense" | "transfer";
	amount: number;
	category: string;
	date: Timestamp;
	description: string;
	tags: string[];
	paymentMethod: string;
}

interface BudgetGoalData {
	id: string;
	title: string;
	targetAmount: number;
	tags: string[];
	interval: {
		type: "monthly" | "yearly" | "weekly" | "daily" | "once";
		startDate: Date;
	};
	createdAt: Date;
	type: string;
}

interface SavingsGoal {
	id: string;
	title: string;
	targetAmount: number;
	amountSaved: number;
	createdAt: Timestamp;
	type: "savings";
}

import { ThemeType } from "../../src/contexts/ThemeContext";

interface UserSettings {
	firstName?: string;
	lastName?: string;
	avatar?: string;
	theme?: ThemeType;
	email?: string;
	updatedAt?: Timestamp;
}

// Service class for handling all Firestore database operations
// This class provides methods for creating, retrieving, updating, and deleting user data and transactions.
// Static methods are used to ensure that each method is callable without instantiating the class.
export class FirestoreService {
	// Creates a new user document or updates an existing one
	static async saveUserData(
		userId: string,
		userData: {
			//Here we add more fields to the user data, such as User age, gender, etc.
			email: string;
			firstName: string;
			lastName: string;
			last_login: number;
		}
	) {
		try {
			// Creates/updates a document in the 'users' collection
			// The merge option ensures existing data isn't completely overwritten
			await setDoc(
				doc(db, "users", userId),
				{
					...userData,
					updatedAt: Timestamp.now(), // Adds a timestamp for when the document was last updated
				},
				{ merge: true }
			);
		} catch (error) {
			console.error("Error saving user data:", error);
			throw error;
		}
	}

	static async saveUserSetting(userId: string, settings: UserSettings) {
		try {
			await setDoc(
				doc(db, "users", userId),
				{
					...settings,
					updatedAt: Timestamp.now(),
				},
				{ merge: true } // Add merge option to preserve existing data
			);
		} catch (error) {
			console.error("Error saving user settings:", error);
			throw error;
		}
	}

	static async getUserSetting(userId: string) {
		try {
			const userSetting = await getDoc(doc(db, "users", userId));
			return userSetting.data();
		} catch (error) {
			console.error("Error getting user settings:", error);
			throw error;
		}
	}

	static async updateUserSetting(userId: string, settings: UserSettings) {
		try {
			await updateDoc(doc(db, "users", userId), settings as {});
		} catch (error) {
			console.error("Error updating user settings:", error);
			throw error;
		}
	}

	// Retrieves a user's data from Firestore
	static async getUserData(userId: string) {
		if (!userId) throw new Error("User ID is required");

		try {
			const userDoc = await getDoc(doc(db, "users", userId));
			return userDoc.exists() ? userDoc.data() : null; // Returns null if user doesn't exist
		} catch (error) {
			console.error("Error getting user data:", error);
			throw error;
		}
	}

	// Adds a new transaction to a user's subcollection of transactions
	static async addTransaction(
		userId: string,
		transactionData: {
			type: "income" | "expense";
			amount: number;
			category: string;
			tags: string[];
			date: Date; // Accepts JavaScript Date object
			description: string;
			paymentMethod: string;
			currency: string;
			status: "completed" | "pending";
			metadata: {
				tags: string[];
			};
		}
	) {
		try {
			// Creates a reference to the user's transactions subcollection
			const transactionsRef = collection(
				db,
				"users",
				userId,
				"transactions"
			);
			// Adds new document and converts JS Date to Firestore Timestamp
			await addDoc(transactionsRef, {
				...transactionData,
				date: Timestamp.fromDate(transactionData.date),
			});
		} catch (error) {
			console.error("Error adding transaction:", error);
			throw error;
		}
	}

	// Retrieves all transactions for a specific user
	//We use this to display the transactions in the dashboard
	static async getTransactions(userId: string): Promise<Transaction[]> {
		if (!userId) throw new Error("User ID is required");

		try {
			// 1. Get reference to the transactions subcollection
			const transactionsRef = collection(
				db,
				"users",
				userId,
				"transactions"
			);

			// 2. Get all documents from this collection
			const querySnapshot = await getDocs(transactionsRef);

			// 3. Transform the documents into an array of Transaction objects
			const filteredTransactions = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Transaction[];

			// Sort transactions by date (newest first)
			filteredTransactions.sort(
				(a, b) => b.date.toDate().getTime() - a.date.toDate().getTime()
			);

			return filteredTransactions;
		} catch (error) {
			console.error("Error fetching transactions:", error);
			throw error; // Re-throw the error to handle it in the component
		}
	}

	// Checks if a user document exists in Firestore
	//promise means that the function will return a boolean value, and it will either return true or false
	static async checkUserExists(userId: string): Promise<boolean> {
		try {
			const userDoc = await getDoc(doc(db, "users", userId));
			return userDoc.exists();
		} catch (error) {
			console.error("Error checking user existence:", error);
			throw error;
		}
	}

	static async deleteTransaction(userId: string, transactionId: string) {
		try {
			const transactionRef = doc(
				db,
				"users",
				userId,
				"transactions",
				transactionId
			);
			await deleteDoc(transactionRef);
			return true;
		} catch (error) {
			console.error("Error deleting transaction:", error);
			throw error;
		}
	}

	static async updateTransaction(
		userId: string,
		transactionId: string,
		updatedData: any
	) {
		try {
			const transactionRef = doc(
				db,
				"users",
				userId,
				"transactions",
				transactionId
			);
			await updateDoc(transactionRef, updatedData);
			return true;
		} catch (error) {
			console.error("Error updating transaction:", error);
			throw error;
		}
	}

	// Deletes a user's document from Firestore
	//We use this when the user is deleted from the list of authenticated users, so that if the user try register again, they can do so. And it won't say the account already exists.
	static async deleteUserData(userId: string) {
		try {
			await deleteDoc(doc(db, "users", userId));
		} catch (error) {
			console.error("Error deleting user data:", error);
			throw error;
		}
	}

	static async addBudgetGoal(
		userId: string,
		goalData: {
			title: string;
			targetAmount: number;
			tags: string[];
			interval: {
				type: "monthly" | "yearly" | "weekly" | "daily" | "once";
				startDate: Date;
			};
			createdAt: Date;
			type: "budget" | "savings";
		}
	) {
		try {
			const budgetGoalsRef = collection(
				db,
				"users",
				userId,
				"budgetGoals"
			);
			const docRef = await addDoc(budgetGoalsRef, {
				...goalData,
				createdAt: new Date(),
				interval: {
					type: goalData.interval.type,
					startDate: goalData.interval.startDate,
				},
			});
			return docRef.id;
		} catch (error) {
			console.error("Error adding budget goal:", error);
			throw error;
		}
	}

	static async getBudgetGoals(userId: string): Promise<BudgetGoalData[]> {
		try {
			const budgetGoalsRef = collection(
				db,
				"users",
				userId,
				"budgetGoals"
			);
			const querySnapshot = await getDocs(budgetGoalsRef);
			return querySnapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					...data,
					interval: {
						type: data.interval.type,
						startDate: data.interval.startDate.toDate(),
					},
					createdAt: data.createdAt.toDate(),
				} as BudgetGoalData;
			});
		} catch (error) {
			console.error("Error getting budget goals:", error);
			throw error;
		}
	}

	static async updateBudgetGoal(
		userId: string,
		goalId: string,
		updatedData: {
			title: string;
			targetAmount: number;
			tags?: string[];
			interval?: {
				type: "monthly" | "yearly" | "weekly" | "daily" | "once";
				startDate: Date;
			};
		}
	) {
		try {
			const goalRef = doc(db, "users", userId, "budgetGoals", goalId);
			const updateFields: any = {
				title: updatedData.title,
				targetAmount: updatedData.targetAmount,
				interval: updatedData.interval
					? {
							type: updatedData.interval.type,
							startDate: updatedData.interval.startDate,
					  }
					: undefined,
			};
			await updateDoc(goalRef, updateFields);
		} catch (error) {
			console.error("Error updating budget goal:", error);
			throw error;
		}
	}

	static async deleteBudgetGoal(userId: string, goalId: string) {
		try {
			const goalRef = doc(db, "users", userId, "budgetGoals", goalId);
			await deleteDoc(goalRef);
		} catch (error) {
			console.error("Error deleting budget goal:", error);
			throw error;
		}
	}

	//savings goals functions for add, update, delete, and get
	static async addSavingsGoal(
		userId: string,
		goalData: {
			title: string;
			targetAmount: number;
			amountSaved: number;
			createdAt: Date;
			contributions?: Array<{ amount: number; date: Date }>;
			type: "savings";
		}
	) {
		try {
			const savingGoalsRef = collection(
				db,
				"users",
				userId,
				"savingGoals"
			);
			const docRef = await addDoc(savingGoalsRef, {
				...goalData,
				createdAt: Timestamp.fromDate(goalData.createdAt),
			});
			return docRef.id;
		} catch (error) {
			console.error("Error adding saving goal:", error);
			throw error;
		}
	}
	static async updateSavingsGoal(
		userId: string,
		goalId: string,
		updatedData: any
	) {
		try {
			const goalRef = await doc(
				db,
				"users",
				userId,
				"savingGoals",
				goalId
			);
			await updateDoc(goalRef, updatedData);
		} catch (error) {
			console.error("Error updating saving goal:", error);
			throw error;
		}
	}

	static async deleteSavingsGoal(userId: string, goalId: string) {
		try {
			const goalRef = doc(db, "users", userId, "savingGoals", goalId);
			await deleteDoc(goalRef);
		} catch (error) {
			console.error("Error deleting saving goal:", error);
			throw error;
		}
	}

	static async getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
		try {
			const savingGoalsRef = collection(
				db,
				"users",
				userId,
				"savingGoals"
			);
			const querySnapshot = await getDocs(savingGoalsRef);

			return querySnapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					...data,
				} as SavingsGoal;
			});
		} catch (error) {
			console.error("Error getting saving goals:", error);
			throw error;
		}
	}

	static async handleUserLogin(user: any) {
		if (!user || !user.email) return;

		try {
			// Get current user data from Firestore
			const userDoc = await getDoc(doc(db, "users", user.uid));
			const userData = userDoc.data();

			// Check if email needs to be synced
			if (userData && userData.email !== user.email) {
				await updateDoc(doc(db, "users", user.uid), {
					email: user.email,
					updatedAt: Timestamp.now(),
				});
			}
		} catch (error) {
			throw error;
		}
	}

	// Update the existing updateUserEmail method
	static async updateUserEmail(newEmail: string, currentPassword: string) {
		const user = auth.currentUser;
		if (!user || !user.email) {
			throw new Error("No authenticated user found");
		}

		try {
			// First, reauthenticate the user
			const credential = EmailAuthProvider.credential(
				user.email,
				currentPassword
			);
			await reauthenticateWithCredential(user, credential);

			const actionCodeSettings: ActionCodeSettings = {
				url: `${window.location.origin}/settings?mode=verifyEmail&operation=updateEmail`,
				handleCodeInApp: true,
			};

			// Send verification email
			await verifyBeforeUpdateEmail(user, newEmail, actionCodeSettings);

			// Set up an auth state listener to handle the email update
			const unsubscribe = auth.onAuthStateChanged(async (updatedUser) => {
				if (updatedUser && updatedUser.email === newEmail) {
					try {
						await this.handleUserLogin(updatedUser);
					} finally {
						unsubscribe(); // Clean up the listener
					}
				}
			});

			return {
				success: true,
				message:
					"Verification email sent to " +
					newEmail +
					". Please check your inbox and verify your new email address. " +
					"Your current email will remain active until verification is complete.",
			};
		} catch (error: any) {
			console.error("Email update error:", error);
			if (error.code === "auth/requires-recent-login") {
				throw new Error("Please log in again and retry");
			} else if (error.code === "auth/email-already-in-use") {
				throw new Error("This email is already registered");
			}
			throw new Error(error.message || "Failed to update email");
		}
	}

	// Update the syncEmailWithFirestore method to be more robust
	static async syncEmailWithFirestore() {
		const user = auth.currentUser;
		if (!user || !user.email) {
			throw new Error("No authenticated user found");
		}

		try {
			const userDocRef = doc(db, "users", user.uid);

			// Get current user data first
			const userData = await getDoc(userDocRef);
			if (!userData.exists()) {
				throw new Error("User document not found");
			}

			// Update only email and updatedAt fields
			await updateDoc(userDocRef, {
				email: user.email,
				updatedAt: Timestamp.now(),
			});

			return true;
		} catch (error) {
			throw error;
		}
	}

	static async updateUserPassword(
		currentPassword: string,
		newPassword: string
	) {
		try {
			const user = auth.currentUser;
			if (!user || !user.email) throw new Error("No user logged in");

			// Re-authenticate user before changing password
			const credential = EmailAuthProvider.credential(
				user.email,
				currentPassword
			);
			await reauthenticateWithCredential(user, credential);

			// Update password
			await updatePassword(user, newPassword);

			return true;
		} catch (error: any) {
			if (error.code === "auth/wrong-password") {
				throw new Error("Current password is incorrect");
			}
			throw error;
		}
	}

	static async updateUserTheme(userId: string, theme: ThemeType) {
		await updateDoc(doc(db, "users", userId), { theme });
	}

	static async getUserSettings(userId: string) {
		try {
			const userDoc = await getDoc(doc(db, "users", userId));
			return userDoc.data();
		} catch (error) {
			console.error("Error getting user settings:", error);
			throw error;
		}
	}

	static async updateUserSettings(userId: string, settings: Partial<any>) {
		try {
			const userRef = doc(db, "users", userId);
			const userDoc = await getDoc(userRef);

			if (userDoc.exists()) {
				await updateDoc(userRef, settings);
			} else {
				await setDoc(userRef, settings);
			}
		} catch (error) {
			console.error("Error updating user settings:", error);
			throw error;
		}
	}

	static async clearUserTheme() {
		try {
			const user = auth.currentUser;
			if (user) {
				await updateDoc(doc(db, "users", user.uid), {
					theme: deleteField(),
				});
			}
		} catch (error) {
			console.error("Error clearing user theme:", error);
			throw error;
		}
	}
}
