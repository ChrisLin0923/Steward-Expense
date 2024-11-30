import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";
import { LayoutDashboard, Receipt, Target, Settings } from "lucide-react";

const Navbar: React.FC = () => {
	const location = useLocation();

	return (
		<nav className={styles.nav}>
			<ul>
				<li>
					<Link
						to='/dashboard'
						className={
							location.pathname === "/dashboard"
								? styles.active
								: ""
						}
					>
						<LayoutDashboard size={20} />
						<span>Dashboard</span>
					</Link>
				</li>
				<li>
					<Link
						to='/transaction'
						className={
							location.pathname === "/transaction"
								? styles.active
								: ""
						}
					>
						<Receipt size={20} />
						<span>Transactions</span>
					</Link>
				</li>
				<li>
					<Link
						to='/GoalsTracker'
						className={
							location.pathname === "/GoalsTracker"
								? styles.active
								: ""
						}
					>
						<Target size={20} />
						<span>Goals Tracker</span>
					</Link>
				</li>
				<li>
					<Link
						to='/settings'
						className={
							location.pathname === "/settings"
								? styles.active
								: ""
						}
					>
						<Settings size={20} />
						<span>Settings</span>
					</Link>
				</li>
			</ul>
		</nav>
	);
};

export default Navbar;
