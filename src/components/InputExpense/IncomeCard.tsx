import React, { useState } from "react";
import { auth } from "../../../Backend/config/firebaseConfig";
import { FirestoreService } from "../../../Backend/config/firestoreService";
import styles from "./IncomeCard.module.css";

type InputCardProps = {
	isVisible: boolean;
	onClose: () => void;
}

export default function IncomeCard({ isVisible, onClose }: InputCardProps) {
	const [formData, setFormData] = useState({
		amount: '',
		category: '',
		description: '',
		paymentMethod: '',
		date: new Date().toISOString().split('T')[0]
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!auth.currentUser) {
			alert("Please log in to add transactions");
			return;
		}

		setIsSubmitting(true);
		try {
			await FirestoreService.addTransaction(auth.currentUser.uid, {
				type: 'income',
				amount: parseFloat(formData.amount),
				category: formData.category,
				description: formData.description,
				paymentMethod: formData.paymentMethod,
				date: new Date(formData.date),
				currency: 'USD',
				status: 'completed' as 'completed' | 'pending',
				metadata: {
					tags: []
				}
			});
			

			// Reset form and close
			setFormData({
				amount: '',
				category: '',
				description: '',
				paymentMethod: '',
				date: new Date().toISOString().split('T')[0]
			});
			onClose();
		} catch (error) {
			console.error("Error adding income:", error);
			if (error instanceof Error) {
				alert(`Failed to add income: ${error.message}`);
			} else {
				alert("Failed to add income. Please try again.");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		setFormData(prev => ({
			...prev,
			[e.target.name]: e.target.value
		}));
	};

	return (
		<div className={`${styles.cardform} ${isVisible ? styles.visible : styles.hidden}`}>
			<form onSubmit={handleSubmit}>
				<h2>Add Income</h2>
				
				<div className={styles.formGroup}>
					<label htmlFor="amount">Amount</label>
					<input
						type="number"
						id="amount"
						name="amount"
						value={formData.amount}
						onChange={handleChange}
						required
						min="0"
						step="0.01"
					/>
				</div>

				<div className={styles.formGroup}>
					<label htmlFor="category">Category</label>
					<select
						id="category"
						name="category"
						value={formData.category}
						onChange={handleChange}
						required
					>
						<option value="">Select Category</option>
						<option value="Salary">Salary</option>
						<option value="Freelance">Freelance</option>
						<option value="Investments">Investments</option>
						<option value="Other">Other</option>
					</select>
				</div>

				<div className={styles.formGroup}>
					<label htmlFor="description">Description</label>
					<input
						type="text"
						id="description"
						name="description"
						value={formData.description}
						onChange={handleChange}
						required
					/>
				</div>

				<div className={styles.formGroup}>
					<label htmlFor="paymentMethod">Payment Method</label>
					<select
						id="paymentMethod"
						name="paymentMethod"
						value={formData.paymentMethod}
						onChange={handleChange}
						required
					>
						<option value="">Select Payment Method</option>
						<option value="Bank Transfer">Bank Transfer</option>
						<option value="Cash">Cash</option>
						<option value="Check">Check</option>
						<option value="Other">Other</option>
					</select>
				</div>

				<div className={styles.formGroup}>
					<label htmlFor="date">Date</label>
					<input
						type="date"
						id="date"
						name="date"
						value={formData.date}
						onChange={handleChange}
						required
					/>
				</div>

				<div className={styles.formActions}>
					<button 
						type="button" 
						onClick={onClose}
						className={styles.cancelBtn}
					>
						Cancel
					</button>
					<button 
						type="submit" 
						disabled={isSubmitting}
						className={styles.submitBtn}
					>
						{isSubmitting ? 'Adding...' : 'Add Income'}
					</button>
				</div>
			</form>
		</div>
	);
}
