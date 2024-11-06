import React, { useEffect, useState } from "react";
import nav from "../Dashboard/Navbar.module.css";
import Navbar from "../Dashboard/Navbar";
import styles from "../Transactions/Transaction.module.css";
import { Transaction as TransactionType } from "../../types";
import { FirestoreService } from "../../../Backend/config/firestoreService";
import { auth } from "../../../Backend/config/firebaseConfig";

const Sidebar: React.FC = () => {
    const[userData, setUserData] = useState<any>(null);
    const[transactions, setTransactions] = useState<TransactionType[]>([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    const firestoreService = new FirestoreService();
                    const userDoc = await FirestoreService.getUserData(currentUser.uid);
                    if (userDoc) {
                        setUserData(userDoc);
                    }
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, []);

	return (<aside className={nav.sidebar}>
        <div className={nav.logo}>
            <img src='src/assets/steward_logo.png' alt='Steward Logo' className={nav.stewardlogo} />
        </div>
        <nav className={nav.navigation}>
            <Navbar />
           
        </nav>
        <div className={nav.userInfo}>
            <img src='src/components/Dashboard/Avatars/Avatar1.png' alt='User Avatar' className={nav.stewardlogo} />
            {userData ? (
                <>
                    <h5>Welcome, {userData.firstName}!</h5>
                    <p>{userData.email}</p>
                </>
            ) : (
                <>
                    <div className={styles.skeleton}></div>
                    <div className={styles.skeleton}></div>
                </>
            )}
        </div>
    </aside>);
};

export default Sidebar;
