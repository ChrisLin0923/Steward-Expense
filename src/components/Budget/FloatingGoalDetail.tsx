import React, { useState } from "react";
import styles from "./FloatingGoalDetail.module.css";
import { X } from "lucide-react";
import BudgetProgressBar from "./ProgressBar";
import SavingsProgressBar from "./ProgressBar";
import { Timestamp } from "firebase/firestore";
import {
	toLocalDate,
	formatDate,
	startOfDay,
	endOfDay,
} from "../../utils/dateUtils";

interface Transaction {
	id: string;
	amount: number;
	description: string;
	date: Date;
	tags: string[];
	type: string;
}

interface FloatingGoalDetailProps {
	isVisible: boolean;
	onClose: () => void;
	goal: BudgetGoal | SavingsGoalData;
	type: "budget" | "savings";
	transactions?: Transaction[];
}

interface BudgetGoal {
	id: string;
	title: string;
	currentAmount: number;
	targetAmount: number;
	tags: string[] | { name: string; amount: number; color: string }[];
	interval: {
		type: string;
		startDate: Date;
	};
}

interface SavingsGoalData {
	id: string;
	title: string;
	targetAmount: number;
	amountSaved: number;
	createdAt: Date;
	contributions?: Array<{
		amount: number;
		date: Date;
	}>;
}

const FloatingGoalDetail: React.FC<FloatingGoalDetailProps> = ({
	isVisible,
	onClose,
	goal,
	type,
	transactions,
}) => {
	const [isClosing, setIsClosing] = useState(false);

	const handleClose = () => {
		setIsClosing(true);
		setTimeout(() => {
			onClose();
			setIsClosing(false);
		}, 300); // Match animation duration
	};
	//Create a handler to handle click event on overlay outside of floating window.
	const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.currentTarget === e.target) handleClose();
	};
	if (!isVisible) return null;

	return (
		<div
			className={`${styles.overlay} ${isClosing ? styles.closing : ""}`}
			onClick={handleOverlayClick}
		>
			<div
				className={`${styles.container} ${
					isClosing ? styles.closing : ""
				}`}
			>
				<div className={styles.header}>
					<h2>{goal.title}</h2>
					<button
						onClick={handleClose}
						className={styles.closeButton}
					>
						<X size={24} />
					</button>
				</div>

				<div className={styles.content}>
					{type === "budget" ? (
						<BudgetGoalDetail
							goal={goal as BudgetGoal}
							transactions={transactions}
						/>
					) : (
						<SavingsGoalDetail goal={goal as SavingsGoalData} />
					)}
				</div>
			</div>
		</div>
	);
};

const BudgetGoalDetail: React.FC<{
	goal: BudgetGoal;
	transactions?: Transaction[];
}> = ({ goal, transactions }) => {
	// Helper function to check if a transaction falls within the current period
	const isTransactionInCurrentPeriod = (
		transactionDate: Date,
		intervalType: string,
		startDate: Date
	) => {
		const localNow = new Date();
		const localTransactionDate = new Date(transactionDate);
		const start = new Date(startDate);

		// Calculate current period's start and end dates
		const getCurrentPeriodBounds = () => {
			if (intervalType.toLowerCase() === "daily") {
				const todayStart = new Date(
					localNow.getFullYear(),
					localNow.getMonth(),
					localNow.getDate(),
					0,
					0,
					0
				);
				const todayEnd = new Date(
					localNow.getFullYear(),
					localNow.getMonth(),
					localNow.getDate(),
					23,
					59,
					59,
					999
				);

				return { periodStart: todayStart, periodEnd: todayEnd };
			}

			let periodStart = new Date(start);
			let periodEnd = new Date(start);

			// Move end date to end of first period
			switch (intervalType.toLowerCase()) {
				case "weekly":
					periodEnd.setDate(periodEnd.getDate() + 7);
					periodEnd = endOfDay(periodEnd);
					break;
				case "monthly":
					periodEnd.setMonth(periodEnd.getMonth() + 1);
					periodEnd = endOfDay(periodEnd);
					break;
				case "yearly":
					periodEnd.setFullYear(periodEnd.getFullYear() + 1);
					periodEnd = endOfDay(periodEnd);
					break;
			}

			// Keep moving both dates forward until we find the period containing now
			while (localNow > periodEnd) {
				periodStart = new Date(periodEnd);
				switch (intervalType.toLowerCase()) {
					case "weekly":
						periodEnd.setDate(periodEnd.getDate() + 7);
						break;
					case "monthly":
						periodEnd.setMonth(periodEnd.getMonth() + 1);
						break;
					case "yearly":
						periodEnd.setFullYear(periodEnd.getFullYear() + 1);
						break;
				}
				periodEnd = endOfDay(periodEnd);
			}

			return { periodStart, periodEnd };
		};

		switch (intervalType.toLowerCase()) {
			case "daily":
			case "weekly":
			case "monthly":
			case "yearly": {
				const { periodStart, periodEnd } = getCurrentPeriodBounds();
				const isInPeriod =
					localTransactionDate >= periodStart &&
					localTransactionDate <= periodEnd;
				return isInPeriod;
			}
			case "once":
				return localTransactionDate >= start;
			default:
				return false;
		}
	};

	// Calculate current amount from related transactions
	const currentAmount =
		transactions
			?.filter((transaction) => {
				// Convert transaction date to local date
				const localTransactionDate = new Date(
					new Date(transaction.date).toLocaleString("en-US", {
						timeZone:
							Intl.DateTimeFormat().resolvedOptions().timeZone,
					})
				);

				const isInPeriod = isTransactionInCurrentPeriod(
					localTransactionDate,
					goal.interval.type,
					goal.interval.startDate
				);

				const hasMatchingTag = transaction.tags?.some((tag) =>
					goal.tags.some((goalTag) =>
						typeof goalTag === "string"
							? goalTag === tag
							: goalTag.name === tag
					)
				);

				return (
					transaction.type === "expense" &&
					hasMatchingTag &&
					isInPeriod
				);
			})
			.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

	const percentageUsed = Math.round(
		(currentAmount / goal.targetAmount) * 100
	);

	const relevantTransactions = transactions?.filter((transaction) => {
		const isInPeriod = isTransactionInCurrentPeriod(
			transaction.date,
			goal.interval.type,
			goal.interval.startDate
		);

		if (!isInPeriod) return false;

		return (
			transaction.type === "expense" &&
			transaction.tags?.some((tag) =>
				goal.tags.some((goalTag) =>
					typeof goalTag === "string"
						? goalTag === tag
						: goalTag.name === tag
				)
			)
		);
	});

	return (
		<>
			<div className={styles.summary}>
				<div className={styles.amounts}>
					<span className={styles.current}>
						${currentAmount.toLocaleString()}
					</span>
					<span className={styles.separator}>/</span>
					<span className={styles.target}>
						${goal.targetAmount.toLocaleString()}
					</span>
					<span className={styles.recurring}>
						{goal.interval.type.charAt(0).toUpperCase() +
							goal.interval.type.slice(1)}
					</span>
				</div>

				<div className={styles.progress}>
					<BudgetProgressBar.BudgetProgressBar
						tags={
							goal.tags as {
								name: string;
								amount: number;
								color: string;
							}[]
						}
						total={goal.targetAmount}
					/>
				</div>
			</div>

			<div className={styles.transactionsList}>
				<h3>Related Transactions</h3>
				{relevantTransactions && relevantTransactions.length > 0 ? (
					relevantTransactions.map((transaction) => (
						<div
							key={transaction.id}
							className={styles.transactionItem}
						>
							<div className={styles.transactionMain}>
								<div className={styles.transactionInfo}>
									<span className={styles.description}>
										{transaction.description}
									</span>
									<span className={styles.amount}>
										-${transaction.amount.toLocaleString()}
									</span>
								</div>
								<span className={styles.date}>
									{new Date(
										transaction.date
									).toLocaleDateString()}
								</span>
							</div>
							<div className={styles.tags}>
								{transaction.tags?.map((tag) => (
									<span key={tag} className={styles.tag}>
										{tag}
									</span>
								))}
							</div>
						</div>
					))
				) : (
					<div className={styles.noTransactions}>
						<p>No related transactions found</p>
						<p>
							Transactions matching this goal's categories will
							appear here
						</p>
					</div>
				)}
			</div>
		</>
	);
};

const SavingsGoalDetail: React.FC<{ goal: SavingsGoalData }> = ({ goal }) => {
	const totalContributions =
		goal.contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
	const remainingAmount = goal.targetAmount - goal.amountSaved;
	const percentageComplete = Math.round(
		(goal.amountSaved / goal.targetAmount) * 100
	);

	return (
		<>
			<div className={styles.summary}>
				<div className={styles.summaryStats}>
					<div className={styles.statItem}>
						<span className={styles.statLabel}>Total Saved</span>
						<span className={styles.statValue}>
							${goal.amountSaved.toLocaleString()}
						</span>
					</div>
					<div className={styles.statItem}>
						<span className={styles.statLabel}>Remaining</span>
						<span className={styles.statValue}>
							${remainingAmount.toLocaleString()}
						</span>
					</div>
					<div className={styles.statItem}>
						<span className={styles.statLabel}>Progress</span>
						<span className={styles.statValue}>
							{percentageComplete}%
						</span>
					</div>
				</div>

				<SavingsProgressBar.SavingsProgressBar
					savedAmount={goal.amountSaved}
					total={goal.targetAmount}
				/>
			</div>

			<div className={styles.contributionsList}>
				<div className={styles.contributionsHeader}>
					<h3>Contribution History</h3>
					<span className={styles.totalContributions}>
						{goal.contributions?.length || 0} contributions
					</span>
				</div>

				{goal.contributions && goal.contributions.length > 0 ? (
					<div className={styles.contributionsContainer}>
						<div className={styles.contributionsTableHeader}>
							<span>Amount</span>
							<span>Date</span>
							<span>Progress at Time</span>
						</div>
						{goal.contributions
							.sort(
								(a, b) =>
									new Date(b.date).getTime() -
									new Date(a.date).getTime()
							)
							.map((contribution, index) => {
								const runningTotal =
									goal.contributions
										?.slice(0, index + 1)
										.reduce((sum, c) => {
											return sum + c.amount;
										}, 0) || 0;

								const progressAtTime = Math.round(
									(runningTotal / goal.targetAmount) * 100
								);

								return (
									<div
										key={index}
										className={styles.contributionItem}
									>
										<span
											className={`${
												styles.contributionAmount
											} ${
												contribution.amount > 0
													? styles.positive
													: styles.negative
											}`}
										>
											{contribution.amount > 0
												? "+"
												: "-"}
											$
											{Math.abs(
												contribution.amount
											).toLocaleString()}
										</span>
										<span
											className={styles.contributionDate}
										>
											{new Date(
												contribution.date
											).toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
												year: "numeric",
												timeZone:
													Intl.DateTimeFormat().resolvedOptions()
														.timeZone,
											})}
										</span>
										<span
											className={
												styles.contributionProgress
											}
										>
											{progressAtTime}%
										</span>
									</div>
								);
							})}
					</div>
				) : (
					<div className={styles.noContributions}>
						<p>No contributions yet</p>
						<p className={styles.noContributionsSubtext}>
							Start adding to your savings to track your progress
						</p>
					</div>
				)}
			</div>
		</>
	);
};

export default FloatingGoalDetail;
