import React, { useEffect, useRef, useState } from "react";
import styles from "./onboard.module.css";
import NewGoalForm from "../Budget/NewGoalForm";
import { auth } from "../../../Backend/config/firebaseConfig";
import { FirestoreService } from "../../../Backend/config/firestoreService";
import ReactConfetti from "react-confetti";
import TransactionCard from "../InputExpense/TransactionCard";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useNavigate } from "react-router-dom";
interface NewGoalData {
	title: string;
	targetAmount: number;
	tags?: string[];
	interval?: {
		type: "monthly" | "yearly" | "weekly" | "daily" | "once";
		startDate: Date;
	};
}

const Onboard: React.FC = () => {
	const [currentCard, setCurrentCard] = useState(0);
	const [budgetCompleted, setBudgetCompleted] = useState(false);
	const [savingsCompleted, setSavingsCompleted] = useState(false);
	const [showConfetti, setShowConfetti] = useState(false);
	const [message, setMessage] = useState("");
	const [transactionType, setTransactionType] = useState("income");
	const [counter, setCounter] = useState(0);
	const navigate = useNavigate();
	const handleSuccess = (type: "budget" | "savings" | "transaction") => {
		setShowConfetti(true);
		if (type === "budget") {
			setMessage(
				"Congrats! You've added your first budget goal tracker!"
			);
			setBudgetCompleted(true);
		} else if (type === "savings") {
			setMessage("Great! You've set up your first savings goal!");
			setSavingsCompleted(true);
		} else if (type === "transaction") {
			const newCount = counter + 1;
			setCounter(newCount);
			if (newCount === 3) {
				setMessage("Great! Click next to complete onboarding!");
			} else {
				setMessage(
					`You've added ${newCount} / 3 transactions! Keep going!`
				);
			}
		}

		const timer = setTimeout(() => {
			setShowConfetti(false);
			setMessage("");
		}, 4000);

		return () => clearTimeout(timer);
	};

	const IntroCard: React.FC = () => {
		return (
			<div className={styles.card}>
				<h2>Welcome to Steward Expense! 👋</h2>

				<div className={styles.introContent}>
					<p>Let's personalize your experience in 3 quick steps:</p>

					<ul className={styles.setupSteps}>
						<li>💰 Create your first budget</li>
						<li>🎯 Define your savings goals</li>
						<li>💳 Add your first transaction</li>
					</ul>

					<p className={styles.timeEstimate}>
						This will take about 3 minutes
					</p>

					<p className={styles.skipNote}>
						You can always update these later in Settings
					</p>
				</div>
			</div>
		);
	};

	const BudgetCard: React.FC = () => {
		const handleSubmitBudgetGoal = async (goalData: NewGoalData) => {
			const user = auth.currentUser;
			if (!user) return;

			try {
				await FirestoreService.addBudgetGoal(user.uid, {
					title: goalData.title,
					targetAmount: goalData.targetAmount,
					tags: goalData.tags || [],
					interval: {
						type: goalData.interval?.type || "monthly",
						startDate: goalData.interval?.startDate || new Date(),
					},
					createdAt: new Date(),
					type: "budget",
				});

				handleSuccess("budget");
			} catch (error) {
				console.error("Error saving budget goal:", error);
				setMessage("Oops! Something went wrong. Please try again.");

				const timer = setTimeout(() => {
					setMessage("");
				}, 4000);

				return () => clearTimeout(timer);
			}
		};

		return (
			<div className={styles.card}>
				<h2>Create Your First Budget 💰</h2>
				<p className={styles.cardDescription}>
					Set up a budget to help track your spending
				</p>
				<div className={`${styles.formWrapper}`}>
					{message && <div className={styles.message}>{message}</div>}
					<NewGoalForm
						isVisible={true}
						onClose={() => {}}
						type='budget'
						label='Add your first budget'
						onSubmit={handleSubmitBudgetGoal}
						embedded={true}
					/>
				</div>
			</div>
		);
	};

	const SavingsCard: React.FC = () => {
		const handleSubmitSavingsGoal = async (goalData: any) => {
			const user = auth.currentUser;
			if (!user) return;
			try {
				if (goalData.amountSaved > 0) {
					const initialContribution = {
						amount: Number(goalData.amountSaved),
						date: new Date(),
					};
					await FirestoreService.addSavingsGoal(user.uid, {
						title: goalData.title,
						targetAmount: goalData.targetAmount,
						amountSaved: goalData.amountSaved || 0,
						createdAt: new Date(),
						contributions: [
							{
								...initialContribution,
								date: initialContribution.date,
							},
						],
						type: "savings",
					});
				} else {
					await FirestoreService.addSavingsGoal(user.uid, {
						title: goalData.title,
						targetAmount: goalData.targetAmount,
						amountSaved: goalData.amountSaved || 0,
						createdAt: new Date(),
						type: "savings",
					});
				}
				setSavingsCompleted(true);
				handleSuccess("savings");
			} catch (error) {
				console.error("Error saving savings goal:", error);
				setMessage("Oops! Something went wrong. Please try again.");

				// Clear error message after delay
				const timer = setTimeout(() => {
					setMessage("");
				}, 4000);

				return () => clearTimeout(timer);
			}
		};
		return (
			<div className={styles.card}>
				<h2>Create Your First Savings Goal 🎯</h2>
				<p>Set up your savings goals and track your progress.</p>
				<div className={styles.formWrapper}>
					{message && (
						<div className={`${styles.message} ${styles.fadeIn}`}>
							{message}
						</div>
					)}
					<NewGoalForm
						isVisible={true}
						onClose={() => {}}
						type='savings'
						label=''
						onSubmit={handleSubmitSavingsGoal}
						embedded={true}
					/>
				</div>
			</div>
		);
	};

	const Transaction: React.FC = () => {
		return (
			<div className={styles.card}>
				<h2>Add Your First Transactions 💳</h2>
				<p>
					Add your first 3 income or expense to get started: {counter}
					/3
				</p>
				<ToggleButtonGroup
					className={styles.toggleButtonGroup}
					value={transactionType}
					exclusive
					onChange={(_, newValue) =>
						newValue && setTransactionType(newValue)
					}
				>
					<ToggleButton
						className={styles.toggleButton}
						value='income'
					>
						Income
					</ToggleButton>
					<ToggleButton
						className={styles.toggleButton}
						value='expense'
					>
						Expense
					</ToggleButton>
				</ToggleButtonGroup>
				<div className={styles.formWrapper}>
					{message && (
						<div className={`${styles.message} ${styles.fadeIn}`}>
							{message}
						</div>
					)}
					<TransactionCard
						isVisible={true}
						onClose={() => {}}
						setTransactions={() => {}}
						type={transactionType as "income" | "expense"}
						onTransactionAdded={() => handleSuccess("transaction")}
						embedded={true}
					/>
				</div>
			</div>
		);
	};

	const cards = [
		<IntroCard key='intro' />,
		<BudgetCard key='budget' />,
		<SavingsCard key='savings' />,
		<Transaction key='transaction' />,
	];

	const handleNext = async () => {
		if (currentCard < cards.length - 1) {
			setCurrentCard(currentCard + 1);
		} else if (currentCard === cards.length - 1) {
			const user = auth.currentUser;
			if (user) {
				await FirestoreService.completeOnboarding(user.uid);
			}
			navigate("/dashboard");
		}
	};

	const handleBack = () => {
		if (currentCard > 0) setCurrentCard(currentCard - 1);
	};

	return (
		<div className={styles.onboard}>
			<div className={styles.cardContainer}>
				{cards[currentCard]}
				{showConfetti && (
					<div className={styles.confettiWrapper}>
						<ReactConfetti
							recycle={false}
							numberOfPieces={300}
							gravity={0.3}
							initialVelocityY={10}
						/>
					</div>
				)}
				<div className={styles.buttonContainer}>
					<button className={styles.button} onClick={handleBack}>
						Back
					</button>
					<button
						className={`${styles.button} ${
							currentCard === 0 ||
							(currentCard === 1 && budgetCompleted) ||
							(currentCard === 2 && savingsCompleted) ||
							(currentCard === cards.length - 1 && counter >= 3)
								? styles.buttonCompleted
								: ""
						}`}
						onClick={handleNext}
						disabled={
							(currentCard === 1 && !budgetCompleted) ||
							(currentCard === 2 && !savingsCompleted) ||
							(currentCard === cards.length - 1 && counter < 3)
						}
					>
						Next
					</button>
				</div>
			</div>
		</div>
	);
};

export default Onboard;
