import React, { useEffect, useState } from "react";
import {
	BarChart as RechartsBarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
	Area,
	Line,
} from "recharts";
import { Transaction as TransactionType } from "../../types";
import { FirestoreService } from "../../../Backend/config/firestoreService";
import { auth } from "../../../Backend/config/firebaseConfig";

import styles from "./visualizer.module.css";
import { getDatabase, ref, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { Key } from "lucide-react";

const BarChart: React.FC = () => {
	const [transactions, setTransactions] = useState<TransactionType[]>([]);
	const [loading, setLoading] = useState(true); //This is the loading state, which is true by default.
	const [userData, setUserData] = useState<any>(null); //This is the user data, which is null by default.
	const [filter, setFilter] = useState("all"); //This is the default filter, which is all transactions.
	const [searchTerm, setSearchTerm] = useState(""); //This is the search term, which is the search input in the search bar.
	const navigate = useNavigate();

	useEffect(() => {
		const loadData = async () => {
			if (auth.currentUser) {
				try {
					// Load user data from Firestore
					const userDataResult = await FirestoreService.getUserData(
						auth.currentUser.uid
					);
					if (userDataResult) {
						setUserData(userDataResult);
					}

					// Load transactions
					const transactions = await FirestoreService.getTransactions(
						auth.currentUser.uid
					);
					setTransactions(
						transactions.map((t) => ({
							...t,
							userId: auth.currentUser!.uid,
							currency: t.currency || "USD",
							status: t.status || "completed",
							date: t.date.toDate(), // Convert Firestore Timestamp to Date
						})) as TransactionType[]
					);
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

	const prepareBarChartData = () => {
		const expenseTransactions = transactions.filter(
			(t) => t.type === "expense"
		);

		const categoryTotals = expenseTransactions.reduce(
			(acc, transaction) => {
				const { category, amount } = transaction;
				if (!acc[category]) {
					acc[category] = 0;
				}
				acc[category] += amount;
				return acc;
			},
			{} as Record<string, number>
		);
		//filter out categories that have empty names;
		const filteredCategoryTotals = Object.fromEntries(
			Object.entries(categoryTotals).filter(
				([categories, _]) => categories !== ""
			)
		);

		const sortedExpenses = Object.entries(filteredCategoryTotals)
			.map(([category, amount]) => ({ category, amount }))
			.sort((a, b) => b.amount - a.amount)
			.slice(0, 5);

		return sortedExpenses;
	};

	const barChartData = prepareBarChartData();

	return (
		<div className={`${styles.card}`}>
			<h3>Expense Categories</h3>
			<div className={styles.chartContainer}>
				<ResponsiveContainer width='100%' height='98%'>
					<RechartsBarChart data={barChartData} barSize={45}>
						<defs>
							<linearGradient
								id='barGradient'
								x1='0'
								y1='0'
								x2='0'
								y2='1'
							>
								<stop
									offset='0%'
									stopColor='var(--chart-gradient-1)'
									stopOpacity={0.9}
								/>
								<stop
									offset='50%'
									stopColor='var(--chart-gradient-2)'
									stopOpacity={0.8}
								/>
								<stop
									offset='100%'
									stopColor='var(--chart-gradient-2)'
									stopOpacity={0.7}
								/>
							</linearGradient>
							<linearGradient
								id='barHoverGradient'
								x1='0'
								y1='0'
								x2='0'
								y2='1'
							>
								<stop
									offset='0%'
									stopColor='var(--chart-gradient-3)'
									stopOpacity={0.95}
								/>
								<stop
									offset='100%'
									stopColor='var(--chart-gradient-4)'
									stopOpacity={0.85}
								/>
							</linearGradient>
							<linearGradient
								id='bgGradient'
								x1='0'
								y1='0'
								x2='0'
								y2='1'
							>
								<stop
									offset='0%'
									stopColor='#f8fafc'
									stopOpacity={0.5}
								/>
								<stop
									offset='100%'
									stopColor='#f1f5f9'
									stopOpacity={0.2}
								/>
							</linearGradient>
						</defs>

						<CartesianGrid
							strokeDasharray='3 3'
							vertical={false}
							stroke='var(--chart-grid)'
						/>

						<XAxis
							dataKey='category'
							axisLine={false}
							tickLine={false}
							tick={{
								fill: "var(--text-secondary)",
								fontSize: 12,
								fontFamily: "Inter, sans-serif",
								fontWeight: 700,
								textAnchor: "middle",
							}}
							dy={10}
							height={50}
							interval={0}
							tickFormatter={(value) =>
								value.length > 15
									? `${value.substring(0, 15)}...`
									: value
							}
						/>

						<YAxis
							axisLine={false}
							tickLine={false}
							tick={{
								fill: "var(--text-secondary)",
								fontSize: 12,
								fontFamily: "Inter, sans-serif",
								fontWeight: 500,
							}}
							dx={-10}
							tickFormatter={(value) =>
								`$${value.toLocaleString()}`
							}
						/>

						<Tooltip
							cursor={{ fill: "rgba(0, 0, 0, 0.02)" }}
							contentStyle={{
								backgroundColor: "var(--bg-white)",
								borderRadius: "16px",
								border: "none",
								boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
								padding: "16px",
							}}
							labelStyle={{
								color: "var(--text-primary)",
								fontSize: "12px",
								fontWeight: 600,
								marginBottom: "8px",
							}}
							itemStyle={{
								color: "var(--text-secondary)",
								fontSize: "13px",
								padding: "2px 0",
							}}
							formatter={(value) => [
								`$${value.toLocaleString()}`,
								"Spent",
							]}
						/>

						<Bar
							dataKey='amount'
							fill='url(#barGradient)'
							radius={[6, 6, 0, 0]}
							maxBarSize={50}
							isAnimationActive={false}
						>
							{barChartData.map((_entry, index) => (
								<Cell
									key={`cell-${index}`}
									cursor='pointer'
									className={styles.barCell}
								/>
							))}
						</Bar>
					</RechartsBarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default BarChart;
