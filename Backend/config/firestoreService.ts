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
} from "firebase/firestore";
import { db } from "./firebaseConfig";
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

interface FirestoreBudgetGoal {
	id: string;
	title: string;
	targetAmount: number;
	tags: string[];
	createdAt: Date;
	type: string;
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
				createdAt: Timestamp.fromDate(goalData.createdAt),
			});
			return docRef.id;
		} catch (error) {
			console.error("Error adding budget goal:", error);
			throw error;
		}
	}

	static async getBudgetGoals(userId: string) {
		try {
			const budgetGoalsRef = collection(
				db,
				"users",
				userId,
				"budgetGoals"
			);
			const querySnapshot = await getDocs(budgetGoalsRef);
			return querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
		} catch (error) {
			console.error("Error getting budget goals:", error);
			throw error;
		}
	}

	static async updateBudgetGoal(
		userId: string,
		goalId: string,
		updatedData: any
	) {
		try {
			const goalRef = doc(db, "users", userId, "budgetGoals", goalId);
			await updateDoc(goalRef, updatedData);
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
}
