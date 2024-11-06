import React, { useState } from "react";
import { auth } from "../../../Backend/config/firebaseConfig";
import { FirestoreService } from "../../../Backend/config/firestoreService";
import styles from "./TransactionCard.module.css";

type TransactionCardProps = {
    isVisible: boolean;
    onClose: () => void;
    setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
    type: 'income' | 'expense';
}

export default function TransactionCard({ isVisible, onClose, setTransactions, type }: TransactionCardProps) {
    const [formData, setFormData] = useState({
        amount: '',
        category: '',
        description: '',
        tags: '',
        paymentMethod: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const categoryOptions = type === 'income' 
        ? ['Salary', 'Freelance', 'Investments', 'Other']
        : ['Housing', 'Transportation', 'Food', 'Utilities', 'Entertainment', 'Healthcare', 'Other'];

    const paymentMethodOptions = type === 'income'
        ? ['Bank Transfer', 'Cash', 'Check', 'Other']
        : ['Credit Card', 'Debit Card', 'Cash', 'Bank Transfer', 'Other'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if(!auth.currentUser){
            alert("Please log in to add transactions"); //possibly reroute to login page.
            return;
        }

        setIsSubmitting(true);
        try {
            await FirestoreService.addTransaction(auth.currentUser.uid, {
                type: type,
                amount: parseFloat(formData.amount),
                category: formData.category,
                description: formData.description,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
                paymentMethod: formData.paymentMethod,
                date: new Date(formData.date),
                currency: 'USD',
                status: 'completed' as 'completed' | 'pending',
                metadata: {
                    tags: []
                }
            });
            //Here we create a new transaction object, that is added to the transactions state, which will immediately update the UI.
            const newTransaction = {
                type: type,
                amount: parseFloat(formData.amount),
                category: formData.category,
                description: formData.description,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
                paymentMethod: formData.paymentMethod,
                date: new Date(formData.date),
                currency: 'USD',
                status: 'completed' as 'completed' | 'pending',
                metadata: {
                    tags: []
                }
            };
            //Here we update the transactions state with the updated transaction. This will immediately update the UI.
            setTransactions((prevTransactions: any) => [...prevTransactions, newTransaction]);
            //Reset the form and close the modal.
            setFormData({
				amount: '',
				category: '',
				description: '',
				tags: '',
				paymentMethod: '',
				date: new Date().toISOString().split('T')[0]
			});
			onClose();
        } catch (error) {
            console.error("Error adding transaction:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <>
            <div className={`${styles.overlay} ${isVisible ? styles.visible : styles.hidden}`} />
            {isVisible && (
                <div className={styles.cardform}>
                    <form onSubmit={handleSubmit}>
                        <h2>{type === 'expense' ? 'Add Expense' : 'Add Income'}</h2>
                        
                        <div className={styles.formGroup}>
                            <label htmlFor="amount">Amount</label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="category">Category</label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                {categoryOptions.map(option => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="description">Description</label>
                            <input
                                type="text"
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="tags">Tags</label>
                            <input
                                placeholder='example: coffee, groceries, etc.'
                                type="text"
                                id="tags"
                                name="tags"
                                onChange={handleChange} //onChange is a React event handler that is called whenever the input value changes.
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="paymentMethod">Payment Method</label>
                            <select
                                id="paymentMethod"
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleChange}
                                required
                            >
                                {paymentMethodOptions.map(option =>(
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="date">Date</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formActions}>
                            <button 
                                type="button" 
                                onClick={onClose}
                                className={styles.cancelBtn}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className={styles.submitBtn}
                            >
                                {isSubmitting ? 'Adding...' : 'Add Transaction'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
} 