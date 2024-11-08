import React, { SetStateAction, useState } from "react";
import styles from "./InputButton.module.css";
import TransactionCard from "./TransactionCard";

//Props for the InputButton component, it is used to add a new transaction
interface InputButtonProps {
	setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
	onTransactionAdded: () => Promise<void>;
}

export default function InputButton({
	setTransactions,
	onTransactionAdded,
}: InputButtonProps) {
	const [showOptions, setShowOptions] = useState(false);
	const [showTransactionForm, setShowTransactionForm] = useState(false);
	const [transactionType, setTransactionType] = useState<
		"income" | "expense"
	>("income");

	const handleAddTransaction = (type: "income" | "expense") => {
		setShowOptions(false);
		setTransactionType(type);
		setShowTransactionForm(true);
	};

	return (
		<div className={styles.container}>
			<button
				className={styles.addButton}
				onClick={() => setShowOptions(!showOptions)}
			>
				<span>+</span>Add Transaction
			</button>

			{showOptions && (
				<div className={styles.optionsMenu}>
					<button onClick={() => handleAddTransaction("income")}>
						Add Income
					</button>
					<button onClick={() => handleAddTransaction("expense")}>
						Add Expense
					</button>
				</div>
			)}

			<TransactionCard
				isVisible={showTransactionForm}
				onClose={() => setShowTransactionForm(false)}
				setTransactions={setTransactions}
				type={transactionType}
				onTransactionAdded={onTransactionAdded}
			/>
		</div>
	);
}
