import React, { useEffect, useState } from "react";
import styles from "./Budget.module.css";
import Sidebar from "../Sidebar/sidebar";
import ProgressBar from "./ProgressBar";
import NewGoalForm from "./NewGoalForm";
import { FirestoreService } from "../../../Backend/config/firestoreService";
import { auth } from "../../../Backend/config/firebaseConfig";
import MeatballMenu from "../Transactions/MeatballMenu";
import { Pencil, Trash2 } from "lucide-react";

interface BudgetGoal {
	id: string;
	title: string;
	currentAmount: number;
	targetAmount: number;
	tags: {
		name: string;
		amount: number;
		color: string;
	}[];
}

interface NewGoalData {
	title: string;
	targetAmount: number;
	tags: string[];
}

interface BudgetGoalData {
	id: string;
	title: string;
	targetAmount: number;
	tags: string[];
	type: string;
	createdAt: Date;
}

interface NewGoalFormProps {
	isVisible: boolean;
	onClose: () => void;
	onSubmit: (goalData: NewGoalData) => Promise<void>;
	type: "budget" | "savings";
	initialData?: BudgetGoal | null;
}

const Budget: React.FC = () => {
	const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
	const [loading, setLoading] = useState(true);
	const [showNewBudgetForm, setShowNewBudgetForm] = useState(false);
	const [showNewSavingsForm, setShowNewSavingsForm] = useState(false);
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
	const [showEditForm, setShowEditForm] = useState(false);
	const [editingGoal, setEditingGoal] = useState<BudgetGoal | null>(null);
	useEffect(() => {
		const loadBudgetData = async () => {
			const user = auth.currentUser;
			if (!user) return;

			try {
				// Get all transactions
				const transactions = await FirestoreService.getTransactions(
					user.uid
				);

				// Get budget goals
				const budgetGoalsData = (await FirestoreService.getBudgetGoals(
					user.uid
				)) as BudgetGoalData[];

				// Process each budget goal
				const processedGoals = budgetGoalsData.map(
					(goal: BudgetGoalData) => {
						// Filter transactions that match this goal's tags
						const matchingTransactions = transactions.filter(
							(transaction) =>
								transaction.type === "expense" &&
								transaction.tags?.some((tag) =>
									goal.tags.includes(tag)
								)
						);

						const currentAmount = matchingTransactions.reduce(
							(total, transaction) => total + transaction.amount,
							0
						);

						// Group amounts by tag with assigned colors
						const colors = [
							"#3498db",
							"#2ecc71",
							"#e74c3c",
							"#f1c40f",
							"#9b59b6",
						];
						const tagAmounts = goal.tags.map((tag, index) => ({
							name: tag,
							amount: matchingTransactions
								.filter((t) => t.tags?.includes(tag))
								.reduce((sum, t) => sum + t.amount, 0),
							color: colors[index % colors.length],
						}));

						return {
							id: goal.id,
							title: goal.title,
							currentAmount,
							targetAmount: goal.targetAmount,
							tags: tagAmounts,
						};
					}
				);

				setBudgetGoals(processedGoals);
				setLoading(false);
			} catch (error) {
				console.error("Error loading budget data:", error);
				setLoading(false);
			}
		};

		loadBudgetData();
	}, []);

	const handleEdit = (goal: BudgetGoal) => {
		setEditingGoal(goal);
		setShowNewBudgetForm(true);
	};

	const handleDelete = async (goalId: string) => {
		if (!auth.currentUser) {
			alert("Please log in to delete goals");
			return;
		}
		try {
			await FirestoreService.deleteBudgetGoal(
				auth.currentUser.uid,
				goalId
			);
			await refreshBudgetData();
		} catch (error) {
			console.error("Error deleting budget goal:", error);
		}
	};

	const GoalItem: React.FC<{ goal: BudgetGoal }> = ({ goal }) => {
		const percentageUsed = Math.round(
			(goal.currentAmount / goal.targetAmount) * 100
		);
		const isOverBudget = percentageUsed > 100;

		return (
			<div className={styles.goalItem}>
				<div className={styles.goalHeader}>
					<div className={styles.goalTitleSection}>
						<h4 className={styles.goalTitle}>{goal.title}</h4>
						<span
							className={`${styles.percentageBadge} ${
								isOverBudget ? styles.overBudget : ""
							}`}
						>
							{percentageUsed}% Used
						</span>
					</div>
					<MeatballMenu
						options={[
							{
								label: "Edit",
								onClick: () => handleEdit(goal),
								icon: <Pencil size={16} />,
								variant: "edit",
							},
							{
								label:
									pendingDeleteId === goal.id
										? "Confirm Delete"
										: "Delete",
								onClick: () => handleDelete(goal.id),
								icon: <Trash2 size={16} />,
								variant: "danger",
							},
						]}
					/>
				</div>

				<div className={styles.goalAmount}>
					<span className={styles.currentAmount}>
						${goal.currentAmount.toLocaleString()}
					</span>
					<span className={styles.separator}>/</span>
					<span className={styles.targetAmount}>
						${goal.targetAmount.toLocaleString()}
					</span>
				</div>

				<div className={styles.progressSection}>
					<ProgressBar tags={goal.tags} total={goal.targetAmount} />
				</div>

				<div className={styles.tagBreakdown}>
					<div className={styles.tagBreakdownHeader}>
						<span>Category</span>
						<span>Amount</span>
						<span>% of Total</span>
					</div>
					{goal.tags.map((tag) => (
						<div key={tag.name} className={styles.tagItem}>
							<div className={styles.tagLabel}>
								<div
									className={styles.tagColor}
									style={{ backgroundColor: tag.color }}
								/>
								<span>{tag.name}</span>
							</div>
							<span className={styles.tagAmount}>
								${tag.amount.toLocaleString()}
							</span>
							<span className={styles.tagPercentage}>
								{Math.round(
									(tag.amount / goal.targetAmount) * 100
								)}
								%
							</span>
						</div>
					))}
				</div>
			</div>
		);
	};

	const AddButton: React.FC<{ onClick: () => void; label: string }> = ({
		onClick,
		label,
	}) => (
		<button className={styles.addButton} onClick={onClick}>
			<span className={styles.addIcon}></span>
			<span>{label}</span>
		</button>
	);

	const refreshBudgetData = async () => {
		setLoading(true);
		const user = auth.currentUser;
		if (!user) return;

		try {
			const transactions = await FirestoreService.getTransactions(
				user.uid
			);
			const budgetGoalsData = (await FirestoreService.getBudgetGoals(
				user.uid
			)) as BudgetGoalData[];

			// Process each budget goal
			const processedGoals = budgetGoalsData.map(
				(goal: BudgetGoalData) => {
					const matchingTransactions = transactions.filter(
						(transaction) =>
							transaction.type === "expense" &&
							transaction.tags?.some((tag) =>
								goal.tags.includes(tag)
							)
					);

					const currentAmount = matchingTransactions.reduce(
						(total, transaction) => total + transaction.amount,
						0
					);

					const colors = [
						"#3498db",
						"#2ecc71",
						"#e74c3c",
						"#f1c40f",
						"#9b59b6",
					];
					const tagAmounts = goal.tags.map((tag, index) => ({
						name: tag,
						amount: matchingTransactions
							.filter((t) => t.tags?.includes(tag))
							.reduce((sum, t) => sum + t.amount, 0),
						color: colors[index % colors.length],
					}));

					return {
						id: goal.id,
						title: goal.title,
						currentAmount,
						targetAmount: goal.targetAmount,
						tags: tagAmounts,
					};
				}
			);

			setBudgetGoals(processedGoals);
		} catch (error) {
			console.error("Error refreshing budget data:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmitBudgetGoal = async (goalData: NewGoalData) => {
		const user = auth.currentUser;
		if (!user) return;

		try {
			if (editingGoal) {
				// Update existing goal
				await FirestoreService.updateBudgetGoal(
					user.uid,
					editingGoal.id,
					{
						title: goalData.title,
						targetAmount: goalData.targetAmount,
						tags: goalData.tags,
						type: "budget",
					}
				);
			} else {
				// Create new goal
				await FirestoreService.addBudgetGoal(user.uid, {
					title: goalData.title,
					targetAmount: goalData.targetAmount,
					tags: goalData.tags,
					createdAt: new Date(),
					type: "budget",
				});
			}

			await refreshBudgetData();
			setShowNewBudgetForm(false);
			setEditingGoal(null);
		} catch (error) {
			console.error("Error saving budget goal:", error);
		}
	};

	const handleSubmitSavingsGoal = (goalData: any) => {
		// Handle savings goal submission
		console.log("New savings goal:", goalData);
		// Add your logic here to save to database
	};

	return (
		<div className={styles.budget}>
			<Sidebar />
			<div className={styles.mainContent}>
				<div className={styles.container}>
					<div className={styles.sectionHeader}>
						<h3>Budget Tracker</h3>
						<AddButton
							onClick={() => setShowNewBudgetForm(true)}
							label='New Budget Goal'
						/>
					</div>
					{loading ? (
						<div>Loading...</div>
					) : (
						budgetGoals.map((goal, index) => (
							<GoalItem key={index} goal={goal} />
						))
					)}
				</div>

				<div className={styles.container}>
					<div className={styles.sectionHeader}>
						<h3>Savings Tracker</h3>
						<AddButton
							onClick={() => setShowNewSavingsForm(true)}
							label='New Savings Goal'
						/>
					</div>
				</div>

				<NewGoalForm
					isVisible={showNewBudgetForm}
					onClose={() => {
						setShowNewBudgetForm(false);
						setEditingGoal(null);
					}}
					onSubmit={handleSubmitBudgetGoal}
					type='budget'
					initialData={editingGoal || undefined}
				/>

				<NewGoalForm
					isVisible={showNewSavingsForm}
					onClose={() => setShowNewSavingsForm(false)}
					onSubmit={handleSubmitSavingsGoal}
					type='savings'
				/>
			</div>
		</div>
	);
};

export default Budget;
