// Dashboard.tsx
import React, { useEffect, useState, useRef } from "react"; //Reach hooks (UseState, useEffect)
import { useNavigate } from "react-router-dom";
import { Transaction as TransactionType } from "../../types";
import { auth } from "../../../Backend/config/firebaseConfig"; // Adjust import path
import styles from "./Dashboard.module.css";

import { FirestoreService } from "../../../Backend/config/firestoreService";
import { ArrowUpCircle, ArrowDownCircle, PiggyBank } from "lucide-react"; // Add this import
import PieChart from "../Visualizer/PieChart";
import Sidebar from "../Sidebar/sidebar";
import LineChart from "../Visualizer/LineChart";
import BarChart from "../Visualizer/BarChart";

// Add this interface at the top of your file
interface SavingsGoal {
	id: string;
	title: string;
	targetAmount: number;
	amountSaved: number;
	createdAt: Date;
	type: "savings";
}

// Add these interfaces if you don't have them
interface BudgetGoalData {
	id: string;
	title: string;
	targetAmount: number;
	tags: string[];
	type: string;
	interval: {
		type: string;
		startDate?: Date;
	};
}

//React,FC = React.FunctionComponent which is a typescript type used to define function components.
const Dashboard: React.FC = () => {
	//State and navigation setup:
	const [transactions, setTransactions] = useState<any[]>([]);
	const [userData, setUserData] = useState<any>(null); //Here we create a state variable for user data. initialized to null to begin with
	const [loading, setLoading] = useState(true); // Add loading state
	const [totalSavingsAmount, setTotalSavingsAmount] = useState<number>(0);
	const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
	const navigate = useNavigate(); //Used this to redirect user if not signed in.
	const [budgetGoals, setBudgetGoals] = useState<BudgetGoalData[]>([]);

	/**
	 * Checks if user is logged in
	 * If logged in -> Fetch user data from firebase
	 * If not -> Redirect to log-in
	 * 
	 * User returns the following : 
	 *  Example of what auth.currentUser returns when a user is logged in
		const user = {
			uid: "abc123xyz789",        // Unique user ID
			email: "user@example.com",  // User's email address
			emailVerified: true,        // Whether email is verified
			displayName: "John Doe",    // User's display name (if set)
			photoURL: "https://...",    // URL of user's profile photo (if set)
			phoneNumber: "+1234567890", // Phone number (if provided)
			metadata: {
        creationTime: "...",    // When the account was created
        lastSignInTime: "..."   // When the user last signed in
    }
}		
	 */

	useEffect(() => {
		const loadData = async () => {
			if (auth.currentUser) {
				try {
					// Load user data, transactions, and budget goals simultaneously
					const [
						userDataResult,
						transactions,
						budgetGoals,
						savingsGoals,
					] = await Promise.all([
						FirestoreService.getUserData(auth.currentUser.uid),
						FirestoreService.getTransactions(auth.currentUser.uid),
						FirestoreService.getBudgetGoals(auth.currentUser.uid),
						FirestoreService.getSavingsGoals(auth.currentUser.uid),
					]);

					// Set user data
					if (userDataResult) {
						setUserData(userDataResult);
					}

					// Set budget goals
					setBudgetGoals(budgetGoals as BudgetGoalData[]);

					// Set savings goals
					setSavingsGoals(
						savingsGoals.map((sg) => ({
							...sg,
							createdAt: sg.createdAt.toDate(),
						})) as SavingsGoal[]
					);

					// Set transactions
					setTransactions(
						transactions.map((t) => ({
							...t,
							userId: auth.currentUser!.uid,
							currency: t.currency || "USD",
							status: t.status || "completed",
							date: t.date.toDate(),
						})) as TransactionType[]
					);

					// Calculate and set total savings
					const totalSavingsAmount = savingsGoals.reduce(
						(sum, saving) => sum + (saving.amountSaved || 0),
						0
					);
					setTotalSavingsAmount(totalSavingsAmount);
				} catch (error) {
					console.error("Error loading data:", error);
				} finally {
					setLoading(false);
				}
			} else {
				setLoading(false);
			}
		};

		loadData();
	}, []);
	//This is the function that filters the transactions based on the filter and search term

	const TotalIncome = () => {
		const incometrans = transactions.filter((t) => t.type === "income");

		let res = 0;

		incometrans.forEach((transaction) => {
			res += transaction.amount;
		});

		return parseFloat(res.toFixed(2));
	};

	const TotalExpense = () => {
		const expensetrans = transactions.filter((t) => t.type === "expense");
		let res = 0;

		expensetrans.forEach((transaction) => {
			res += transaction.amount;
		});

		return parseFloat(res.toFixed(2));
	};

	const tot_i = TotalIncome();
	const tot_e = TotalExpense();

	// Skeleton components
	const CardSkeleton = () => (
		<div className={`${styles.card} ${styles.skeleton}`}>
			<div className={styles.skeletonText}></div>
		</div>
	);

	const ChartSkeleton = () => (
		<div className={`${styles.chart} ${styles.card} ${styles.skeleton}`}>
			<div className={styles.skeletonChart}></div>
		</div>
	);

	// Add these helper functions
	const calculateBudgetHealth = (
		currentAmount: number,
		targetAmount: number
	) => {
		const usagePercentage = (currentAmount / targetAmount) * 100;
		if (usagePercentage <= 35) return "excellent";
		else if (usagePercentage <= 60) return "good";
		else if (usagePercentage <= 70) return "warning";
		return "danger";
	};

	const getTimeProgress = () => {
		const today = new Date();
		const monthProgress =
			(today.getDate() /
				new Date(
					today.getFullYear(),
					today.getMonth() + 1,
					0
				).getDate()) *
			100;
		return monthProgress;
	};

	const BudgetSection = () => {
		const [isScrollable, setIsScrollable] = useState(false);
		const sectionRef = useRef<HTMLDivElement>(null);

		useEffect(() => {
			const section = sectionRef.current;
			if (!section) return;

			const checkScroll = () => {
				// Check if content is scrollable and not at bottom
				const hasMoreContent =
					section.scrollHeight > section.clientHeight &&
					section.scrollTop + section.clientHeight <
						section.scrollHeight;
				setIsScrollable(hasMoreContent);
			};

			// Initial check
			checkScroll();
			// Check on scroll
			section.addEventListener("scroll", checkScroll);
			// Check on resize
			window.addEventListener("resize", checkScroll);

			return () => {
				section.removeEventListener("scroll", checkScroll);
				window.removeEventListener("resize", checkScroll);
			};
		}, []);

		return (
			<div
				className={`${styles.budgetSection} ${
					isScrollable ? styles.showGradient : ""
				}`}
				ref={sectionRef}
			>
				{/* Your budget goals content */}
			</div>
		);
	};

	// Add this helper function
	const isTransactionInCurrentPeriod = (
		transactionDate: Date,
		intervalType: string,
		startDate: Date
	): boolean => {
		const now = new Date();
		const start = new Date(startDate);

		switch (intervalType) {
			case "daily":
				// Reset every 24 hours from start date
				const daysSinceStart = Math.floor(
					(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
				);
				const currentPeriodStart = new Date(start);
				currentPeriodStart.setDate(start.getDate() + daysSinceStart);
				const currentPeriodEnd = new Date(currentPeriodStart);
				currentPeriodEnd.setDate(currentPeriodStart.getDate() + 1);
				return (
					transactionDate >= currentPeriodStart &&
					transactionDate < currentPeriodEnd
				);

			case "weekly":
				// Reset every 7 days from start date
				const weeksSinceStart = Math.floor(
					(now.getTime() - start.getTime()) /
						(1000 * 60 * 60 * 24 * 7)
				);
				const currentWeekStart = new Date(start);
				currentWeekStart.setDate(start.getDate() + weeksSinceStart * 7);
				const currentWeekEnd = new Date(currentWeekStart);
				currentWeekEnd.setDate(currentWeekStart.getDate() + 7);
				return (
					transactionDate >= currentWeekStart &&
					transactionDate < currentWeekEnd
				);

			case "monthly":
				// Reset on same day each month
				const currentMonthStart = new Date(
					now.getFullYear(),
					now.getMonth(),
					start.getDate()
				);
				const currentMonthEnd = new Date(
					now.getFullYear(),
					now.getMonth() + 1,
					start.getDate()
				);
				return (
					transactionDate >= currentMonthStart &&
					transactionDate < currentMonthEnd
				);

			case "yearly":
				// Reset on same date each year
				const currentYearStart = new Date(
					now.getFullYear(),
					start.getMonth(),
					start.getDate()
				);
				const currentYearEnd = new Date(
					now.getFullYear() + 1,
					start.getMonth(),
					start.getDate()
				);
				return (
					transactionDate >= currentYearStart &&
					transactionDate < currentYearEnd
				);

			case "once":
				return transactionDate >= start;

			default:
				return false;
		}
	};

	//This is the component for the dashboard.
	//It displays the user's data, and the dashboard visuals.
	//The left side is the navigation sidebar, and the right side is the main container that contains the dashboard visuals.
	return (
		<div className={styles.dashboard}>
			<Sidebar />

			<main className={styles.dashboardContent}>
				<section className={styles.topCards}>
					{loading ? (
						<>
							<CardSkeleton />
							<CardSkeleton />
							<CardSkeleton />
						</>
					) : (
						<>
							<div
								className={`${styles.card} ${styles.incomeCard}`}
							>
								<div className={styles.cardContent}>
									<div className={styles.cardIcon}>
										<ArrowUpCircle size={20} />
									</div>
									<div className={styles.cardInfo}>
										<h3>Total Income</h3>
										<p className={styles.amount}>
											${tot_i}
										</p>
									</div>
								</div>
							</div>

							<div
								className={`${styles.card} ${styles.expenseCard}`}
							>
								<div className={styles.cardContent}>
									<div className={styles.cardIcon}>
										<ArrowDownCircle size={20} />
									</div>
									<div className={styles.cardInfo}>
										<h3>Total Expense</h3>
										<p className={styles.amount}>
											${tot_e}
										</p>
									</div>
								</div>
							</div>

							<div
								className={`${styles.card} ${styles.savingsCard}`}
							>
								<div className={styles.cardContent}>
									<div className={styles.cardIcon}>
										<PiggyBank size={20} />
									</div>
									<div className={styles.cardInfo}>
										<h3>Total Savings</h3>
										<p className={styles.amount}>
											${totalSavingsAmount}
										</p>
									</div>
								</div>
							</div>
						</>
					)}
				</section>

				<section className={styles.charts}>
					{loading ? (
						<>
							<div
								className={`${styles.chart} ${styles.fullWidthChart}`}
							>
								<ChartSkeleton />
							</div>
							<div className={styles.goals}>
								<div className={styles.goalSection}>
									<ChartSkeleton />
								</div>
								<div className={styles.goalSection}>
									<ChartSkeleton />
								</div>
							</div>
							<div
								className={`${styles.chart} ${styles.pieChart}`}
							>
								<ChartSkeleton />
							</div>
							<div
								className={`${styles.chart} ${styles.lineChart}`}
							>
								<ChartSkeleton />
							</div>
						</>
					) : (
						<>
							<div
								className={`${styles.chart} ${styles.fullWidthChart}`}
							>
								<BarChart />
							</div>
							<div className={styles.goals}>
								<section className={styles.budgetSection}>
									<div className={styles.sectionHeader}>
										<h3>Budget Goals</h3>
										<span className={styles.monthProgress}>
											Month Progress:{" "}
											{getTimeProgress().toFixed(0)}%
										</span>
									</div>
									<div className={styles.goalsList}>
										{budgetGoals.map((goal) => {
											const currentAmount = transactions
												.filter(
													(transaction) =>
														transaction.type ===
															"expense" &&
														transaction.tags?.some(
															(tag: string) =>
																goal.tags.includes(
																	tag
																)
														) &&
														isTransactionInCurrentPeriod(
															transaction.date ||
																new Date(),
															goal.interval.type,
															goal.interval
																.startDate ||
																new Date()
														)
												)
												.reduce(
													(sum, t) => sum + t.amount,
													0
												);
											const healthStatus =
												calculateBudgetHealth(
													currentAmount,
													goal.targetAmount
												);
											return (
												<div
													key={goal.id}
													className={styles.goalItem}
												>
													<div
														className={
															styles.goalHeader
														}
													>
														<span
															className={
																styles.goalTitle
															}
														>
															{goal.title}
														</span>
														<span
															className={`${styles.status} ${styles[healthStatus]}`}
														>
															{(
																(currentAmount /
																	goal.targetAmount) *
																100
															).toFixed(0)}
															%
														</span>
													</div>
													<div
														className={
															styles.progressContainer
														}
													>
														<div
															className={
																styles.progressBars
															}
														>
															<div
																className={`${styles.progressBar} ${styles[healthStatus]}`}
																style={{
																	width: `${
																		(currentAmount /
																			goal.targetAmount) *
																		100
																	}%`,
																}}
															/>
															<div
																className={
																	styles.monthIndicator
																}
																style={{
																	left: `${getTimeProgress()}%`,
																}}
																title='Month Progress'
															/>
														</div>
														<div
															className={
																styles.amounts
															}
														>
															<span>
																$
																{currentAmount.toLocaleString()}
															</span>
															<span
																className={
																	styles.targetAmount
																}
															>
																of $
																{goal.targetAmount.toLocaleString()}
															</span>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								</section>

								<section className={styles.savingsSection}>
									<div className={styles.sectionHeader}>
										<h3>Savings Goals</h3>
										<span className={styles.monthProgress}>
											Month Progress:{" "}
											{getTimeProgress().toFixed(0)}%
										</span>
									</div>
									<div className={styles.goalsList}>
										{savingsGoals.map((goal) => {
											const progressPercentage =
												(goal.amountSaved /
													goal.targetAmount) *
												100;
											const remaining =
												goal.targetAmount -
												goal.amountSaved;

											return (
												<div
													key={goal.id}
													className={styles.goalItem}
												>
													<div
														className={
															styles.goalHeader
														}
													>
														<span
															className={
																styles.goalTitle
															}
														>
															{goal.title}
														</span>
														<span
															className={`${styles.status} ${styles.savings}`}
														>
															{progressPercentage.toFixed(
																0
															)}
															%
														</span>
													</div>
													<div
														className={
															styles.progressContainer
														}
													>
														<div
															className={
																styles.progressBar
															}
														>
															<div
																className={
																	styles.savingsProgress
																}
																style={{
																	width: `${progressPercentage}%`,
																}}
															/>
														</div>
														<div
															className={
																styles.amounts
															}
														>
															<span>
																$
																{goal.amountSaved.toLocaleString()}{" "}
																saved
															</span>
															<span
																className={
																	styles.remaining
																}
															>
																$
																{remaining.toLocaleString()}{" "}
																to go
															</span>
														</div>
													</div>
													<div
														className={
															styles.monthlyTarget
														}
													>
														Monthly target: $
														{Math.ceil(
															remaining / 12
														).toLocaleString()}
													</div>
												</div>
											);
										})}
									</div>
								</section>
							</div>
							<div
								className={`${styles.chart} ${styles.pieChart}`}
							>
								<PieChart />
							</div>
							<div
								className={`${styles.chart} ${styles.lineChart}`}
							>
								<LineChart />
							</div>
						</>
					)}
				</section>
			</main>
		</div>
	);
};

export default Dashboard;
