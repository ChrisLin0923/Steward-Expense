import React, { useState, useEffect } from "react";
import styles from "./NewGoalForm.module.css";
import { X } from "lucide-react";
import { Firestore, Timestamp } from "firebase/firestore";
import { FirestoreService } from "../../../Backend/config/firestoreService";
import { auth } from "../../../Backend/config/firebaseConfig";

interface NewGoalFormProps {
	isVisible: boolean;
	onClose: () => void;
	onSubmit: (goalData: {
		title: string;
		targetAmount: number;
		tags?: string[];
		amountSaved?: number;
		interval?: {
			type: "monthly" | "yearly" | "weekly" | "daily" | "once";
			startDate: Date;
		};
	}) => void;
	type: "budget" | "savings";
	label: string;
	initialData?: {
		title: string;
		targetAmount: number;
		tags?: { name: string }[];
		amountSaved?: number;
		interval?: {
			type: "monthly" | "yearly" | "weekly" | "daily" | "once";
			startDate: Date;
		};
	};
}

interface FormData {
	title: string;
	targetAmount: number;
	amountSaved?: number;
	tags?: string;
	interval: {
		type: "monthly" | "yearly" | "weekly" | "daily" | "once";
		startDate: Date;
	};
}

const NewGoalForm: React.FC<NewGoalFormProps> = ({
	isVisible,
	onClose,
	onSubmit,
	type,
	label,
	initialData,
}) => {
	const [formData, setFormData] = useState<FormData>({
		title: initialData?.title || "",
		targetAmount: initialData?.targetAmount || 0,
		amountSaved: initialData?.amountSaved || 0,
		tags:
			type === "budget"
				? initialData?.tags?.map((tag) => tag.name).join(", ") || ""
				: undefined,
		interval: {
			type: initialData?.interval?.type || "monthly",
			startDate: initialData?.interval?.startDate || new Date(),
		},
	});
	const [isClosing, setIsClosing] = useState(false);

	// Reset form when initialData changes
	useEffect(() => {
		if (initialData) {
			setFormData({
				title: initialData.title,
				targetAmount: initialData.targetAmount,
				amountSaved: initialData.amountSaved || 0,
				tags:
					type === "budget"
						? initialData.tags?.map((tag) => tag.name).join(", ") ||
						  ""
						: undefined,
				interval: initialData.interval
					? {
							type: initialData.interval.type,
							startDate: initialData.interval.startDate,
					  }
					: {
							type: "monthly",
							startDate: new Date(),
					  },
			});
		} else {
			setFormData({
				title: "",
				targetAmount: 0,
				amountSaved: type === "savings" ? 0 : undefined,
				tags: type === "budget" ? "" : undefined,
				interval: {
					type: "monthly",
					startDate: new Date(),
				},
			});
		}
	}, [initialData, type]);

	const formatDateForInput = (date: Date) => {
		try {
			const dateObj = date instanceof Date ? date : date;
			return dateObj.toISOString().split("T")[0];
		} catch (error) {
			console.error("Error formatting date:", error);
			return new Date().toISOString().split("T")[0];
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const processedData = {
			title: formData.title,
			targetAmount: Number(formData.targetAmount),
			amountSaved: formData.amountSaved
				? Number(formData.amountSaved)
				: undefined,
			tags: formData.tags
				? formData.tags.split(",").map((tag) => tag.trim())
				: undefined,
			interval: formData.interval
				? {
						type: formData.interval.type,
						startDate:
							formData.interval.startDate instanceof Timestamp
								? formData.interval.startDate.toDate()
								: formData.interval.startDate,
				  }
				: undefined,
		};
		onSubmit(processedData);
		onClose();
	};

	const handleClose = () => {
		setIsClosing(true);
		setTimeout(() => {
			onClose();
			setIsClosing(false);
		}, 300);
	};

	if (!isVisible) return null;

	return (
		<div className={`${styles.overlay} ${isClosing ? styles.closing : ""}`}>
			<div
				className={`${styles.container} ${
					isClosing ? styles.closing : ""
				}`}
			>
				<button onClick={handleClose} className={styles.closeButton}>
					<X size={24} />
				</button>
				<div className={styles.header}>
					<h2>
						{type === "budget"
							? "New Budget Goal"
							: "New Savings Goal"}
					</h2>
				</div>

				<div className={styles.formContent}>
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
								min={0}
								value={formData.targetAmount || ""}
								onKeyDown={(e) => {
									if (e.key === "-") e.preventDefault();
								}}
								onChange={(e) => {
									const value = e.target.value;
									const regex = /^\d*\.?\d{0,2}$/;
									if (regex.test(value) || value === "") {
										setFormData({
											...formData,
											targetAmount: Number(
												e.target.value
											),
										});
									}
								}}
								placeholder='Enter amount'
								required
							/>
						</div>

						{type === "savings" && label === "" && (
							<div className={styles.formGroup}>
								<label htmlFor='amountSaved'>
									Amount Saved
								</label>
								<input
									type='number'
									id='amountSaved'
									value={formData.targetAmount || ""}
									onChange={(e) => {
										const value = e.target.value;
										const regex = /^\d*\.?\d{0,2}$/;
										if (regex.test(value) || value === "") {
											setFormData({
												...formData,
												targetAmount: Number(
													e.target.value
												),
											});
										}
									}}
									onKeyDown={(e) => {
										if (e.key === "-") e.preventDefault();
									}}
								/>
							</div>
						)}

						{type === "budget" && (
							<div className={styles.formGroup}>
								<label htmlFor='tags'>
									Tags you want to Track (comma-separated)
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

						{type === "budget" && (
							<div className={styles.formGroup}>
								<div className={styles.intervalGroup}>
									<div style={{ flex: 1 }}>
										<label htmlFor='interval'>
											Interval
										</label>
										<select
											id='interval'
											className={styles.intervalSelect}
											value={formData.interval?.type}
											onChange={(e) =>
												setFormData((prevData) => ({
													...prevData,
													interval: {
														...prevData.interval!,
														type: e.target
															.value as FormData["interval"]["type"],
													},
												}))
											}
										>
											<option value='monthly'>
												Monthly
											</option>
											<option value='yearly'>
												Yearly
											</option>
											<option value='weekly'>
												Weekly
											</option>
											<option value='daily'>Daily</option>
											<option value='once'>Once</option>
										</select>
									</div>

									<div style={{ flex: 1 }}>
										<label htmlFor='startDate'>
											Start Date
										</label>
										<input
											type='date'
											id='startDate'
											className={styles.dateInput}
											value={formatDateForInput(
												formData.interval.startDate
											)}
											onChange={(e) => {
												const newDate = new Date(
													e.target.value
												);
												if (!isNaN(newDate.getTime())) {
													setFormData((prevData) => ({
														...prevData,
														interval: {
															...prevData.interval,
															startDate: newDate,
														},
													}));
												}
											}}
										/>
									</div>
								</div>
							</div>
						)}

						<div className={styles.formActions}>
							<button
								type='button'
								onClick={handleClose}
								className={styles.cancelBtn}
							>
								Cancel
							</button>
							<button type='submit' className={styles.submitBtn}>
								{type === "budget"
									? "Save Budget Goal"
									: "Save Savings Goal"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default NewGoalForm;
