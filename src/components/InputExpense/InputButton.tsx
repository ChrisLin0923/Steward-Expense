import React, { SetStateAction, useState, useRef, useEffect } from "react";
import styles from "./InputButton.module.css";
import TransactionCard from "./TransactionCard";

//Props for the InputButton component, it is used to add a new transaction
interface InputButtonProps {
	setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
	onTransactionAdded: () => Promise<void>;
	showDropdown: boolean;
	setShowDropdown: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function InputButton({
	setTransactions,
	onTransactionAdded,
	showDropdown,
	setShowDropdown,
}: InputButtonProps) {
	const [showTransactionForm, setShowTransactionForm] = useState(false);
	const [transactionType, setTransactionType] = useState<
		"income" | "expense"
	>("income");
	const optionsRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	const handleAddIncome = () => {
		setShowDropdown(false);
		setTransactionType("income");
		setShowTransactionForm(true);
	};

	const handleAddExpense = () => {
		setShowDropdown(false);
		setTransactionType("expense");
		setShowTransactionForm(true);
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				optionsRef.current &&
				!optionsRef.current.contains(event.target as Node) &&
				!buttonRef.current?.contains(event.target as Node)
			) {
				setShowDropdown(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, [setShowDropdown]);

	return (
		<div className={styles.container}>
			<button
				className={styles.addButton}
				onClick={() => setShowDropdown(!showDropdown)}
				ref={buttonRef}
			>
				Add Transaction
			</button>

			{showDropdown && (
				<div className={styles.optionsMenu} ref={optionsRef}>
					<button onClick={handleAddIncome}>Add Income</button>
					<button onClick={handleAddExpense}>Add Expense</button>
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
