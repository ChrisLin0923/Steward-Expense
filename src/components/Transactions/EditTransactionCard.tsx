import React, { useEffect, useState } from "react";
import { auth } from "../../../Backend/config/firebaseConfig";
import { FirestoreService } from "../../../Backend/config/firestoreService";
import { Transaction } from "../../types";
import styles from "../InputExpense/TransactionCard.module.css";

interface EditTransactionCardProps {
	isVisible: boolean;
	onClose: () => void;
	transaction: Transaction | null;
	setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
	onTransactionUpdated: () => Promise<void>;
}

export default function EditTransactionCard({
	isVisible,
	onClose,
	transaction,
	setTransactions,
}: EditTransactionCardProps) {
	const [formData, setFormData] = useState({
		amount: "",
		category: "",
		description: "",
		tags: "",
		paymentMethod: "",
		date: new Date().toISOString().split("T")[0],
	});

	useEffect(() => {
		if (transaction) {
			setFormData({
				amount: transaction.amount.toString(),
				category: transaction.category,
				description: transaction.description,
				tags: transaction.tags?.join(", ") || "",
				paymentMethod: transaction.paymentMethod,
				date: new Date(transaction.date).toISOString().split("T")[0],
			});
		}
	}, [transaction]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		// Prevent default form submission behavior
		e.preventDefault();

		// Early return if no user is logged in or no transaction to edit
		if (!auth.currentUser || !transaction) return;

		try {
			// Create updated transaction object by spreading existing transaction
			// and updating with new form values
			const updatedTransaction = {
				...transaction, // Keep existing transaction properties
				amount: parseFloat(formData.amount), // Convert amount string to number
				category: formData.category,
				description: formData.description,
				// Convert comma-separated tags string to array, trim whitespace, remove empty tags
				tags: formData.tags
					? formData.tags
							.split(",")
							.map((tag) => tag.trim())
							.filter((tag) => tag !== "")
					: [],
				paymentMethod: formData.paymentMethod,
				date: new Date(formData.date), // Convert date string to Date object
				type: transaction.type, // Keep original transaction type
			};

			// Update transaction in Firestore database
			await FirestoreService.updateTransaction(
				auth.currentUser.uid, // User ID
				transaction.id, // Transaction ID
				updatedTransaction // New transaction data
			);

			// Update local state with the edited transaction
			setTransactions((prev) =>
				prev.map((t) =>
					// If this is the edited transaction, return updated version
					// Otherwise return the original transaction unchanged
					t.id === transaction.id
						? {
								...updatedTransaction,
								tags: updatedTransaction.tags as never[],
						  }
						: t
				)
			);

			// Close the edit modal/form
			onClose();
		} catch (error) {
			// Handle any errors during the update
			console.error("Error updating transaction:", error);
			alert("Failed to update transaction");
		}
	};

	if (!isVisible || !transaction) return null;

	return (
		<div
			className={`${styles.cardform} ${
				isVisible ? styles.visible : styles.hidden
			}`}
		>
			<form onSubmit={handleSubmit}>
				<h2>
					Edit{" "}
					{transaction.type.charAt(0).toUpperCase() +
						transaction.type.slice(1)}
				</h2>

				<div className={styles.formGroup}>
					<label htmlFor='amount'>Amount</label>
					<input
						type='number'
						id='amount'
						name='amount'
						value={formData.amount}
						onChange={handleChange}
						required
						min='0'
						step='0.01'
					/>
				</div>

				<div className={styles.formGroup}>
					<label htmlFor='category'>Category</label>
					<select
						id='category'
						name='category'
						value={formData.category}
						onChange={handleChange}
						required
					>
						<option value=''>Select Category</option>
						{transaction.type === "income" ? (
							<>
								<option value='Salary'>Salary</option>
								<option value='Freelance'>Freelance</option>
								<option value='Investments'>Investments</option>
							</>
						) : (
							<>
								<option value='Housing'>Housing</option>
								<option value='Transportation'>
									Transportation
								</option>
								<option value='Food'>Food</option>
								<option value='Utilities'>Utilities</option>
								<option value='Entertainment'>
									Entertainment
								</option>
								<option value='Healthcare'>Healthcare</option>
							</>
						)}
						<option value='Other'>Other</option>
					</select>
				</div>

				<div className={styles.formGroup}>
					<label htmlFor='description'>Description</label>
					<input
						type='text'
						id='description'
						name='description'
						value={formData.description}
						onChange={handleChange}
						required
					/>
				</div>

				<div className={styles.formGroup}>
					<label htmlFor='tags'>Tags</label>
					<input
						type='text'
						id='tags'
						name='tags'
						value={formData.tags}
						onChange={handleChange}
						placeholder='Enter tags separated by commas'
					/>
				</div>

				<div className={styles.formGroup}>
					<label htmlFor='paymentMethod'>Payment Method</label>
					<select
						id='paymentMethod'
						name='paymentMethod'
						value={formData.paymentMethod}
						onChange={handleChange}
						required
					>
						<option value=''>Select Payment Method</option>
						<option value='Cash'>Cash</option>
						<option value='Credit Card'>Credit Card</option>
						<option value='Debit Card'>Debit Card</option>
						<option value='Bank Transfer'>Bank Transfer</option>
						<option value='Other'>Other</option>
					</select>
				</div>

				<div className={styles.formGroup}>
					<label htmlFor='date'>Date</label>
					<input
						type='date'
						id='date'
						name='date'
						value={formData.date}
						onChange={handleChange}
						required
					/>
				</div>

				<div className={styles.formActions}>
					<button
						type='button'
						onClick={onClose}
						className={styles.cancelBtn}
					>
						Cancel
					</button>
					<button type='submit' className={styles.submitBtn}>
						Update
					</button>
				</div>
			</form>
		</div>
	);
}
