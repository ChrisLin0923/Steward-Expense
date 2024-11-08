import React, { useState, useEffect } from "react";
import styles from "./NewGoalForm.module.css";

interface NewGoalFormProps {
	isVisible: boolean;
	onClose: () => void;
	onSubmit: (goalData: {
		title: string;
		targetAmount: number;
		tags: string[];
	}) => void;
	type: "budget" | "savings";
	initialData?: {
		title: string;
		targetAmount: number;
		tags: { name: string }[];
	};
}

const NewGoalForm: React.FC<NewGoalFormProps> = ({
	isVisible,
	onClose,
	onSubmit,
	type,
	initialData,
}) => {
	const [formData, setFormData] = useState<{
		title: string;
		targetAmount: string;
		tags: string | undefined;
	}>({
		title: initialData?.title || "",
		targetAmount: initialData?.targetAmount.toString() || "",
		tags: initialData?.tags
			? initialData.tags.map((tag) => tag.name).join(", ")
			: "",
	});

	// Reset form when initialData changes
	useEffect(() => {
		if (initialData) {
			setFormData({
				title: initialData.title,
				targetAmount: initialData.targetAmount.toString(),
				tags: initialData.tags.map((tag) => tag.name).join(", "),
			});
		} else {
			setFormData({
				title: "",
				targetAmount: "",
				tags: type === "budget" ? "" : undefined,
			});
		}
	}, [initialData, type]);

	if (!isVisible) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit({
			...formData,
			targetAmount: parseFloat(formData.targetAmount),
			tags: formData.tags?.split(",").map((tag) => tag.trim()) || [],
		});
		onClose();
	};

	return (
		<div className={styles.modalOverlay}>
			<div className={styles.modalContent}>
				<h2>New {type === "budget" ? "Budget" : "Savings"} Goal</h2>
				<form onSubmit={handleSubmit}>
					<div className={styles.formGroup}>
						<label htmlFor='title'>Title</label>
						<input
							type='text'
							id='title'
							value={formData.title}
							onChange={(e) =>
								setFormData({
									...formData,
									title: e.target.value,
								})
							}
							required
						/>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor='targetAmount'>Target Amount</label>
						<input
							type='number'
							id='targetAmount'
							value={formData.targetAmount}
							onChange={(e) =>
								setFormData({
									...formData,
									targetAmount: e.target.value,
								})
							}
							required
						/>
					</div>

					{type === "budget" && (
						<div className={styles.formGroup}>
							<label htmlFor='tags'>
								Tags you want to Track(comma-separated)
							</label>
							<input
								type='text'
								id='tags'
								value={formData.tags}
								onChange={(e) =>
									setFormData({
										...formData,
										tags: e.target.value,
									})
								}
								placeholder='e.g., groceries, coffee, dining'
							/>
						</div>
					)}

					<div className={styles.formActions}>
						<button
							type='button'
							onClick={onClose}
							className={styles.cancelBtn}
						>
							Cancel
						</button>
						<button type='submit' className={styles.submitBtn}>
							Create Goal
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default NewGoalForm;
