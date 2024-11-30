import React, { useEffect, useState } from "react";
import {
	LineChart as RechartsLineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Area,
} from "recharts";
import { Transaction as TransactionType } from "../../types";
import { FirestoreService } from "../../../Backend/config/firestoreService";
import { auth } from "../../../Backend/config/firebaseConfig";
import styles from "./visualizer.module.css";
import style from "./BarChart.module.css";
import { getDatabase, ref, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";

const LineChart: React.FC = () => {
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
	console.log("line");

	const prepareLineChartData = () => {
		const sortedTransactions = [...transactions].sort(
			(a, b) => a.date.getTime() - b.date.getTime()
		);

		return sortedTransactions.map((transaction) => ({
			date: transaction.date.toISOString().split("T")[0],
			amount:
				transaction.type === "expense"
					? -transaction.amount
					: transaction.amount,
			type: transaction.type,
		}));
	};

	const lineChartData = prepareLineChartData();

	return (
		<div className={styles.card}>
			<h3>Income vs. Expenses</h3>
			<div className={styles.chartContainer}>
				<ResponsiveContainer width='100%' height='98%'>
					<RechartsLineChart data={lineChartData}>
						<defs>
							<linearGradient
								id='colorAmount'
								x1='0'
								y1='0'
								x2='0'
								y2='1'
							>
								<stop
									offset='5%'
									stopColor='var(--chart-gradient-1)'
									stopOpacity={0.3}
								/>
								<stop
									offset='95%'
									stopColor='var(--chart-gradient-1)'
									stopOpacity={0}
								/>
							</linearGradient>
							<linearGradient
								id='lineGradient'
								x1='0'
								y1='0'
								x2='1'
								y2='0'
							>
								<stop
									offset='0%'
									stopColor='var(--chart-gradient-1)'
								/>
								<stop
									offset='100%'
									stopColor='var(--chart-gradient-2)'
								/>
							</linearGradient>
						</defs>

						<CartesianGrid
							stroke='var(--chart-grid)'
							strokeDasharray='3 3'
							vertical={false}
							opacity={0.3}
						/>

						<XAxis
							dataKey='date'
							axisLine={false}
							tickLine={false}
							style={{
								fontSize: "12px",
								fontFamily: "Inter, sans-serif",
								color: "var(--text-secondary)",
							}}
							dy={10}
							textAnchor='end'
							tickFormatter={(date) => {
								const options = {
									month: "short" as "short",
									day: "numeric" as "numeric",
								};
								return new Date(date).toLocaleDateString(
									undefined,
									options
								);
							}}
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							style={{
								fontSize: "12px",
								fontFamily: "Inter, sans-serif",
								color: "var(--text-secondary)",
							}}
							dx={-10}
							tickFormatter={(value) => `$${value}`}
						/>

						<Tooltip
							contentStyle={{
								backgroundColor: "var(--bg-white)",
								borderRadius: "12px",
								border: "none",
								boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
								padding: "12px 16px",
							}}
							labelStyle={{
								color: "var(--text-secondary)",
								fontSize: "12px",
								fontWeight: 600,
								marginBottom: "4px",
							}}
							itemStyle={{
								color: "var(--text-primary)",
								fontSize: "14px",
								padding: "4px 0",
							}}
							formatter={(value: number) => [
								`$${Math.abs(value)}`,
								value >= 0 ? "Income" : "Expense",
							]}
						/>

						<Area
							type='monotone'
							dataKey='amount'
							stroke='none'
							fill='url(#colorAmount)'
							fillOpacity={1}
							className={styles.areaPath}
							isAnimationActive={false}
							style={{ animation: "none" }}
						/>

						<Line
							type='monotone'
							dataKey='amount'
							stroke='url(#lineGradient)'
							strokeWidth={3}
							dot={false}
							className={styles.lineChartPath}
							activeDot={{
								r: 6,
								fill: "var(--bg-white)",
								stroke: "var(--chart-gradient-1)",
								strokeWidth: 3,
							}}
							isAnimationActive={false}
						/>
					</RechartsLineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default LineChart;
