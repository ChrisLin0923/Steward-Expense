import React, { useEffect, useRef, useState } from "react";
import styles from "./Transaction.module.css";
import editFormStyles from "../InputExpense/TransactionCard.module.css";
import { auth } from "../../../Backend/config/firebaseConfig";
import { FirestoreService } from "../../../Backend/config/firestoreService";
import { Transaction as TransactionType } from "../../types";
import Sidebar from "../Sidebar/sidebar";
import {
	AttachMoney,
	ShoppingCart,
	Home,
	DirectionsCar,
	Restaurant,
	LocalHospital,
	School,
	FlightTakeoff,
	TrendingUp,
	// ... import other icons as needed
} from "@mui/icons-material";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
import EditTransactionCard from "./EditTransactionCard";
import MeatballMenu from "./MeatballMenu";
import { Pencil, Trash2 } from "lucide-react";
import InputButton from "../InputExpense/InputButton";

const Transaction: React.FC = () => {
	// State Management
	// ---------------
	// Track all transactions loaded from Firestore
	const [transactions, setTransactions] = useState<TransactionType[]>([]);
	// Loading state for showing skeleton screens
	const [loading, setLoading] = useState(true);
	// Store user profile data
	const [userData, setUserData] = useState<any>(null);
	// Filter state: 'all', 'income', or 'expense'
	const [filter, setFilter] = useState("all");
	// Search input state for filtering transactions
	const [searchTerm, setSearchTerm] = useState("");

	// Add these state variables after other state declarations
	const [editingTransaction, setEditingTransaction] =
		useState<TransactionType | null>(null);
	const [showEditForm, setShowEditForm] = useState(false);
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
	// Date Range Picker Configuration
	// ------------------------------
	// State for managing date range selection
	const [dateRange, setDateRange] = useState<
		{
			startDate: Date;
			endDate: Date;
			key: string;
		}[]
	>([
		{
			startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)), // 1 months ago
			endDate: new Date(), // Today
			key: "selection",
		},
	]);

	// Toggle visibility of date picker
	const [showDatePicker, setShowDatePicker] = useState(false);
	// Add this near your other state declarations
	const [error, setError] = useState<string | null>(null);
	const datePickerRef = useRef<HTMLDivElement>(null);

	// Add this ref at the top of your component with other state declarations
	const inputButtonRef = useRef<HTMLDivElement>(null);

	// Add this state to track screen width
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

	// Add this useEffect to handle window resizing
	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 480);
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				datePickerRef.current &&
				!datePickerRef.current.contains(event.target as Node)
			) {
				setShowDatePicker(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const [showDropdown, setShowDropdown] = useState(false);
	// Add this useEffect to handle clicks outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				inputButtonRef.current &&
				!inputButtonRef.current.contains(event.target as Node)
			) {
				// Call the close dropdown function from InputButton
				// You'll need to pass this as a prop to InputButton
				setShowDropdown(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Data Loading Effect
	// ------------------
	useEffect(() => {
		const loadData = async () => {
			try {
				// Wait for auth to be initialized
				await new Promise((resolve) => {
					const unsubscribe = auth.onAuthStateChanged((user) => {
						unsubscribe();
						resolve(user);
					});
				});

				const user = auth.currentUser;
				if (user) {
					setLoading(true);
					// Load user profile data
					const userDataResult = await FirestoreService.getUserData(
						user.uid
					);
					if (userDataResult) {
						setUserData(userDataResult);
					}

					// Load transactions
					const transactions = await FirestoreService.getTransactions(
						user.uid
					);
					setTransactions(
						transactions.map((t) => ({
							...t,
							userId: user.uid,
							currency: t.currency || "USD",
							status: t.status || "completed",
							date: new Date(
								t.date.toDate().getTime() +
									new Date().getTimezoneOffset() * 60000
							),
							tags: t.tags || [],
						})) as TransactionType[]
					);
				}
			} catch (error) {
				console.error("Error loading data:", error);
				setError("Failed to load transactions");
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []);

	const fetchTransactions = async (userId: string) => {
		try {
			const transactions = await FirestoreService.getTransactions(userId);
			return transactions.map((t) => ({
				...t,
				userId: userId,
				currency: t.currency || "USD",
				status: t.status || "completed",
				date: new Date(
					t.date.toDate().getTime() +
						new Date().getTimezoneOffset() * 60000
				),
			})) as TransactionType[];
		} catch (error) {
			console.error("Error fetching transactions:", error);
		}
	};

	const refreshTransactions = async () => {
		if (auth.currentUser) {
			try {
				setLoading(true);
				const updatedTransactions = await fetchTransactions(
					auth.currentUser.uid
				);
				if (updatedTransactions) {
					setTransactions(updatedTransactions);
				} else {
					setTransactions([]);
				}
			} catch (error) {
				console.error("Error refreshing transactions:", error);
				setTransactions([]);
			} finally {
				setLoading(false);
			}
		}
	};

	// Transaction Filtering Logic
	// -------------------------
	const filteredTransactions = transactions.filter((transaction) => {
		// Convert transaction date for comparison
		const transactionDate = new Date(transaction.date);

		// Check if transaction falls within selected date range
		const withinDateRange =
			transactionDate >= dateRange[0].startDate &&
			transactionDate <= dateRange[0].endDate;

		// Check if transaction matches selected type filter
		const matchesFilter = filter === "all" || transaction.type === filter;

		// Create searchable fields array and convert to lowercase
		const searchFields = [
			transaction.description,
			transaction.category,
			transaction.paymentMethod,
			transaction.amount.toString(),
			...(transaction.tags || []),
		]?.map((field: string) => field.toLowerCase());

		// Multi-word search: each word must match at least one field
		const matchesSearch = searchTerm
			.split(" ")
			.every((term: string) =>
				searchFields.some((field: string) => field.includes(term))
			);

		return matchesFilter && matchesSearch && withinDateRange;
	});

	// Sort transactions by date (newest first)
	filteredTransactions.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);

	// Loading State Components
	// -----------------------
	// Render skeleton loading placeholder for transactions
	const renderTransactionSkeleton = () => (
		<div className={styles.transactionCard}>
			<div className={styles.transactionIcon}>
				<div className={styles.skeleton}></div>
			</div>
			<div className={styles.transactionDetails}>
				<div className={styles.skeleton}></div>
				<div className={styles.skeleton}></div>
			</div>
			<div className={styles.transactionAmount}>
				<div className={styles.skeleton}></div>
			</div>
		</div>
	);

	// Category Icon Mapping
	// --------------------
	// Maps transaction categories to their corresponding Material-UI icons
	const getCategoryIcon = (category: string) => {
		const lowerCategory = category.toLowerCase();

		switch (lowerCategory) {
			case "salary":
				return <AttachMoney />;
			case "food":
				return <Restaurant />;
			case "groceries":
				return <ShoppingCart />;
			case "housing":
				return <Home />;
			case "transportation":
				return <DirectionsCar />;
			case "dining":
				return <Restaurant />;
			case "medical":
				return <LocalHospital />;
			case "investments":
				return <TrendingUp />;
			case "education":
				return <School />;
			case "travel":
				return <FlightTakeoff />;
			// ... add more cases
			default:
				return <AttachMoney />;
		}
	};

	const handleDelete = async (id: string): Promise<void> => {
		if (!auth.currentUser) {
			alert("Please log in to delete transactions");
			return;
		}

		try {
			await FirestoreService.deleteTransaction(auth.currentUser.uid, id);
			await refreshTransactions();
		} catch (error) {
			console.error("Error deleting transaction:", error);
			alert("Failed to delete transaction");
		} finally {
			setLoading(false);
		}
	};

	// Add this handler function
	const handleEdit = (transaction: TransactionType) => {
		if (!transaction.id) {
			console.error("Transaction ID is missing");
			return;
		}
		setEditingTransaction(transaction);
		setShowEditForm(true);
	};

	const formatLocalDate = (date: Date) => {
		// Create a new date object and adjust for timezone
		const localDate = new Date(
			date.getTime() - date.getTimezoneOffset() * 60000
		);
		return localDate.toLocaleDateString();
	};

	// Update the DatePickerMobile component
	const DatePickerMobile = () => {
		return (
			<div className={styles.mobileDatePicker}>
				<div className={styles.datePickerHeader}>
					<h3>Select Date Range</h3>
					<button
						className={styles.closeButton}
						onClick={() => setShowDatePicker(false)}
					>
						✕
					</button>
				</div>
				<div className={styles.dateInputGroup}>
					<label>Start Date</label>
					<input
						type='date'
						value={
							dateRange[0].startDate.toISOString().split("T")[0]
						}
						max={dateRange[0].endDate.toISOString().split("T")[0]}
						onChange={(e) => {
							const start = new Date(e.target.value);
							start.setHours(0, 0, 0, 0);
							setDateRange([
								{
									...dateRange[0],
									startDate: start,
									key: "selection",
								},
							]);
						}}
					/>
				</div>
				<div className={styles.dateInputGroup}>
					<label>End Date</label>
					<input
						type='date'
						value={dateRange[0].endDate.toISOString().split("T")[0]}
						min={dateRange[0].startDate.toISOString().split("T")[0]}
						max={new Date().toISOString().split("T")[0]}
						onChange={(e) => {
							const end = new Date(e.target.value);
							end.setHours(23, 59, 59, 999);
							setDateRange([
								{
									...dateRange[0],
									endDate: end,
									key: "selection",
								},
							]);
						}}
					/>
				</div>
				<button
					className={styles.applyDateBtn}
					onClick={() => setShowDatePicker(false)}
				>
					Apply
				</button>
			</div>
		);
	};

	// Component Render
	// ---------------
	return (
		<div className={styles.transaction}>
			<Sidebar />

			<main className={styles.mainContent}>
				<div className={styles.header}>
					<h1>Transactions</h1>
					<div className={styles.controls}>
						<div className={styles.searchBar}>
							<input
								type='text'
								placeholder='Search transactions...'
								value={searchTerm}
								onChange={(e) =>
									setSearchTerm(e.target.value.toLowerCase())
								}
							/>
						</div>
						<div className={styles.filterButtons}>
							<button
								className={`${styles.filterBtn} ${
									filter === "all" ? styles.active : ""
								}`}
								onClick={() => setFilter("all")}
							>
								All
							</button>
							<button
								className={styles.filterBtn}
								onClick={() =>
									setShowDatePicker(!showDatePicker)
								}
							>
								Date Range
							</button>
							{showDatePicker && (
								<>
									{isMobile ? (
										// Mobile version
										<>
											<div
												className={`${styles.overlay} ${
													showDatePicker
														? styles.visible
														: ""
												}`}
												onClick={() =>
													setShowDatePicker(false)
												}
											/>
											<div
												ref={datePickerRef}
												className={
													styles.datePickerContainer
												}
											>
												<DatePickerMobile />
											</div>
										</>
									) : (
										// Desktop/Tablet version
										<div
											ref={datePickerRef}
											className={
												styles.datePickerContainer
											}
										>
											<DateRangePicker
												ranges={dateRange}
												onChange={(item: any) => {
													if (
														item.selection
															.startDate &&
														item.selection.endDate
													) {
														const start = new Date(
															item.selection.startDate
														);
														start.setHours(
															0,
															0,
															0,
															0
														);
														const end = new Date(
															item.selection.endDate
														);
														end.setHours(
															23,
															59,
															59,
															999
														);
														setDateRange([
															{
																startDate:
																	start,
																endDate: end,
																key: "selection",
															},
														]);
														setShowDatePicker(
															false
														);
													}
												}}
												months={2}
												direction='vertical'
												editableDateInputs={true}
												rangeColors={["#0052cc"]}
												showPreview={true}
												moveRangeOnFirstSelection={
													false
												}
												showMonthAndYearPickers={true}
												showDateDisplay={true}
												minDate={new Date(2020, 0, 1)}
												maxDate={new Date()}
											/>
										</div>
									)}
								</>
							)}
							<button
								className={`${styles.filterBtn} ${
									filter === "income" ? styles.active : ""
								}`}
								onClick={() => setFilter("income")}
							>
								Income
							</button>
							<button
								className={`${styles.filterBtn} ${
									filter === "expense" ? styles.active : ""
								}`}
								onClick={() => setFilter("expense")}
							>
								Expenses
							</button>
							<div ref={inputButtonRef}>
								<InputButton
									setTransactions={setTransactions}
									onTransactionAdded={refreshTransactions}
									showDropdown={showDropdown}
									setShowDropdown={setShowDropdown}
								/>
							</div>
						</div>
					</div>
				</div>

				<div className={styles.transactionList}>
					{loading ? (
						// Show skeleton loading state while data is being fetched
						Array(10)
							.fill(null)
							.map((_, index) => (
								<React.Fragment key={index}>
									{renderTransactionSkeleton()}
								</React.Fragment>
							))
					) : (
						// Render actual transactions once data is loaded
						<>
							{filteredTransactions.map((transaction) => (
								<div
									key={transaction.id}
									className={`${styles.transactionCard} ${
										styles[transaction.type]
									}`}
								>
									<div className={styles.transactionIcon}>
										{getCategoryIcon(transaction.category)}
									</div>
									<div className={styles.transactionDetails}>
										<h3>{transaction.category}</h3>
										<p>{transaction.description}</p>
										{transaction.tags &&
											transaction.tags.length > 0 && (
												<div
													className={
														styles.tagContainer
													}
												>
													{transaction.tags.map(
														(
															tag: string,
															index: number
														) => (
															<span
																key={`${transaction.id}-tag-${index}`}
																className={
																	styles.tag
																}
															>
																#{tag}
															</span>
														)
													)}
												</div>
											)}
										<span className={styles.date}>
											{formatLocalDate(transaction.date)}
										</span>
									</div>

									<div className={styles.transactionAmount}>
										<div className={styles.menuContainer}>
											<MeatballMenu
												options={[
													{
														label: "Edit",
														onClick: () =>
															handleEdit(
																transaction
															),
														icon: (
															<Pencil size={16} />
														),
														variant: "edit",
													},
													{
														label:
															pendingDeleteId ===
															transaction.id
																? "Confirm Delete"
																: "Delete",
														onClick: () =>
															handleDelete(
																transaction.id
															),
														icon: (
															<Trash2 size={16} />
														),
														variant: "danger",
													},
												]}
											/>
										</div>

										<div className={styles.actions}></div>
										<span
											className={
												transaction.type === "income"
													? styles.income
													: styles.expense
											}
										>
											{transaction.type === "income"
												? "+"
												: "-"}
											$
											{Math.abs(
												transaction.amount
											).toFixed(2)}
										</span>
										<span className={styles.paymentMethod}>
											{transaction.paymentMethod}
										</span>
									</div>
								</div>
							))}
						</>
					)}
				</div>
			</main>
			<EditTransactionCard
				isVisible={showEditForm}
				onClose={() => {
					setShowEditForm(false);
					setEditingTransaction(null);
				}}
				transaction={editingTransaction}
				setTransactions={setTransactions}
				onTransactionUpdated={refreshTransactions}
			/>
			<div
				className={`${editFormStyles.overlay} ${
					showEditForm
						? editFormStyles.visible
						: editFormStyles.hidden
				}`}
			></div>
			{error && (
				<div className={styles.errorMessage}>
					{error}
					<button onClick={() => window.location.reload()}>
						Retry
					</button>
				</div>
			)}
		</div>
	);
};

export default Transaction;
