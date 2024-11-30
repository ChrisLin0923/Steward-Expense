import React from "react";
import styles from "./Budget.module.css";

interface ProgressBarProps {
	tags: {
		name: string;
		amount: number;
		color: string;
	}[];
	total: number;
}

interface SavingsProgressBarProps {
	savedAmount: number;
	total: number;
}

const SavingsProgressBar: React.FC<SavingsProgressBarProps> = ({
	savedAmount,
	total,
}) => {
	const percentageSaved = (savedAmount / total) * 100;
	return (
		<div className={styles.progressContainer}>
			<div className={styles.progressBarContainer}>
				<div className={styles.progressBar}>
					<div
						className={styles.progressSegment}
						style={{
							width: `${percentageSaved}%`,
							backgroundColor: "var(--chart-gradient-3)",
						}}
					/>
				</div>
				<span className={styles.progressLabel}>
					${savedAmount.toLocaleString()} / ${total.toLocaleString()}
				</span>
			</div>
		</div>
	);
};

const BudgetProgressBar: React.FC<ProgressBarProps> = ({ tags, total }) => {
	const totalSpent = tags.reduce((acc, tag) => acc + tag.amount, 0);
	const percentageUsed = (totalSpent / total) * 100;

	return (
		<div className={styles.progressContainer}>
			<div className={styles.progressBarContainer}>
				<div className={styles.progressBar}>
					{tags.map((tag, index) => (
						<div
							key={tag.name}
							className={styles.progressSegment}
							style={{
								width: `${(tag.amount / total) * 100}%`,
								backgroundColor: tag.color,
								left: `${tags
									.slice(0, index)
									.reduce(
										(acc, t) =>
											acc + (t.amount / total) * 100,
										0
									)}%`,
							}}
							title={`${
								tag.name
							}: $${tag.amount.toLocaleString()} (${Math.round(
								(tag.amount / total) * 100
							)}%)`}
						>
							<span className={styles.segmentLabel}>
								{(tag.amount / total) * 100 > 10 &&
									`${tag.name}`}
							</span>
						</div>
					))}
				</div>
				{/* Target indicator */}
				<div
					className={`${styles.targetIndicator} ${
						percentageUsed > 100 ? styles.exceeded : ""
					}`}
					style={{ left: "100%" }}
				>
					<div className={styles.targetLine}></div>
					<span className={styles.targetLabel}>Target</span>
				</div>
			</div>
		</div>
	);
};

export default { BudgetProgressBar, SavingsProgressBar };
