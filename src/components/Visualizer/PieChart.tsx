import React, { useEffect, useState } from "react";
import {
	PieChart as RechartsPieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
	Sector,
} from "recharts";
import { Transaction as TransactionType } from "../../types";
import { FirestoreService } from "../../../Backend/config/firestoreService";
import { auth } from "../../../Backend/config/firebaseConfig";
import styles from "./visualizer.module.css";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer } from "recharts";
import { Category } from "@mui/icons-material";

const COLORS = [
	"var(--chart-gradient-5)",
	"var(--chart-gradient-6)",
	"var(--chart-gradient-2)",
	"var(--chart-gradient-9)",
];
const firestoreService = new FirestoreService();

//This is the component for the transactions page.
//It displays all the transactions of the user, and allows the user to filter and search through the transactions.

// Add this function for the active shape rendering
const renderActiveShape = (props: any) => {
	const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
		props;

	return (
		<g>
			{/* Subtle outer glow */}
			<Sector
				cx={cx}
				cy={cy}
				innerRadius={innerRadius - 1}
				outerRadius={outerRadius + 5}
				startAngle={startAngle}
				endAngle={endAngle}
				fill={fill}
				opacity={0.1}
			/>

			{/* Main sector with slight expansion */}
			<Sector
				cx={cx}
				cy={cy}
				innerRadius={innerRadius}
				outerRadius={outerRadius + 3}
				startAngle={startAngle}
				endAngle={endAngle}
				fill={fill}
			/>

			{/* Inner highlight for depth */}
			<Sector
				cx={cx}
				cy={cy}
				startAngle={startAngle}
				endAngle={endAngle}
				innerRadius={innerRadius - 2}
				outerRadius={innerRadius}
				fill={fill}
				opacity={0.3}
			/>
		</g>
	);
};

const PieChart: React.FC = () => {
	//The following useState hooks manage the state of the transactions, user data, and loading.
	const [transactions, setTransactions] = useState<TransactionType[]>([]);
	const [loading, setLoading] = useState(true); //This is the loading state, which is true by default.
	const [userData, setUserData] = useState<any>(null); //This is the user data, which is null by default.
	const [filter, setFilter] = useState("all"); //This is the default filter, which is all transactions.
	const [searchTerm, setSearchTerm] = useState(""); //This is the search term, which is the search input in the search bar.
	const navigate = useNavigate();

	// Add state for active index
	const [activeIndex, setActiveIndex] = useState<number>(-1);

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
					//filter the expenses that is greater than 0 percent

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

	// Prepare pie chart data by aggregating transactions by category
	const preparePieChartData = () => {
		// Filter for expense transactions only
		const expenseTransactions = transactions.filter(
			(t) => t.type === "expense"
		);

		// Aggregate amounts by category
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

		// Calculate total amount for percentage calculation
		const totalAmount = Object.values(categoryTotals).reduce(
			(sum, amount) => sum + amount,
			0
		);

		// Filter out categories with zero or negligible percentages
		const filteredCategoryTotals = Object.fromEntries(
			Object.entries(categoryTotals).filter(([_, value]) => {
				const percentage = (value / totalAmount) * 100;
				return value > 0 && percentage >= 1; // Filter out values less than 1%
			})
		);

		// Convert to array format needed for Recharts
		const pieData = Object.entries(filteredCategoryTotals).map(
			([category, value]) => ({
				name: category,
				value: value,
			})
		);

		return pieData;
	};

	const pieData = preparePieChartData();

	// Add hover handlers
	const onPieEnter = (_: any, index: number) => {
		setActiveIndex(index);
	};

	const onPieLeave = () => {
		setActiveIndex(-1);
	};

	return (
		<div className={`${styles.card}`}>
			<h3>Expense Breakdown</h3>
			<div className={styles.chartContainer}>
				<ResponsiveContainer width='100%' height='98%'>
					<RechartsPieChart
						margin={{ top: 20, right: 20, bottom: 20, left: 45 }}
					>
						<defs>
							<filter
								id='glow'
								height='200%'
								width='200%'
								x='-50%'
								y='-50%'
							>
								<feGaussianBlur
									stdDeviation='2'
									result='coloredBlur'
								/>
								<feOffset dx='0' dy='0' result='offsetBlur' />
								<feFlood
									floodColor='rgba(255,255,255,0.2)'
									result='glowColor'
								/>
								<feComposite
									in='glowColor'
									in2='coloredBlur'
									operator='in'
									result='softGlow'
								/>
								<feMerge>
									<feMergeNode in='softGlow' />
									<feMergeNode in='SourceGraphic' />
								</feMerge>
							</filter>
						</defs>

						<Pie
							data={pieData}
							labelLine={{
								offset: 30,
								stroke: "var(--chart-label-stroke)",
							}}
							dataKey='value'
							nameKey='name'
							cx='50%'
							cy='50%'
							innerRadius='60%'
							outerRadius='80%'
							paddingAngle={5}
							label={({ percent }) =>
								`${(percent * 100).toFixed(0)}%`
							}
							activeIndex={activeIndex}
							activeShape={renderActiveShape}
							onMouseEnter={onPieEnter}
							onMouseLeave={onPieLeave}
							isAnimationActive={true}
							animationBegin={0}
							animationDuration={600}
							animationEasing='ease-out'
						>
							{pieData.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={COLORS[index % COLORS.length]}
									stroke='none'
								/>
							))}
						</Pie>
						<Tooltip
							formatter={(value: number) =>
								`$${value.toFixed(2)}`
							}
							contentStyle={{
								backgroundColor: "var(--chart-tooltip-bg)",
								borderRadius: "var(--card-radius)",
								border: "none",
								boxShadow: `0 4px 12px var(--chart-tooltip-shadow)`,
							}}
							itemStyle={{
								color: "var(--text-primary)",
							}}
						/>
						<Legend
							layout='vertical'
							align='right'
							verticalAlign='middle'
							iconType='circle'
							wrapperStyle={{
								fontSize: "12px",
								paddingLeft: "20px",
							}}
						/>
					</RechartsPieChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default PieChart;
