import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import styles from "./MeatballMenu.module.css";

interface MeatballMenuProps {
	options: {
		label: string;
		onClick: () => void;
		icon?: React.ReactNode;
		variant?: "default" | "danger" | "edit";
	}[];
}

const MeatballMenu: React.FC<MeatballMenuProps> = ({ options }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	const handleClose = () => {
		setIsClosing(true);
		setConfirmingDelete(false);
		setTimeout(() => {
			setIsOpen(false);
			setIsClosing(false);
		}, 200);
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				handleClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleOptionClick = (
		e: React.MouseEvent,
		option: {
			label: string;
			onClick: () => void;
			variant?: string;
		}
	) => {
		e.stopPropagation(); // Prevent event propagation

		if (option.variant === "danger") {
			if (!confirmingDelete) {
				setConfirmingDelete(true);
				setTimeout(() => {
					setConfirmingDelete(false);
				}, 3000);
			} else {
				option.onClick();
				setConfirmingDelete(false);
				handleClose();
			}
		} else {
			option.onClick();
			handleClose();
		}
	};

	return (
		<div
			className={`${styles.meatballMenu} ${
				isClosing ? styles.closing : ""
			}`}
			ref={menuRef}
		>
			<button
				className={styles.meatballButton}
				onClick={(e) => {
					e.stopPropagation();
					setIsOpen(!isOpen);
				}}
				aria-label='More options'
			>
				<MoreHorizontal size={20} />
			</button>

			{isOpen && (
				<div
					className={`${styles.menuDropdown} ${
						isClosing ? styles.closing : ""
					}`}
				>
					{options
						.sort((a, b) => (a.variant === "danger" ? -1 : 1)) // Sort options to have delete button on the left
						.map((option, index) => (
							<button
								key={index}
								onClick={(e) => handleOptionClick(e, option)}
								className={`
                  ${styles.menuItem}
                  ${option.variant === "danger" ? styles.danger : ""}
                  ${option.variant === "edit" ? styles.edit : ""}
                  ${
						confirmingDelete && option.variant !== "danger"
							? styles.disabled
							: ""
					}
                  ${
						confirmingDelete && option.variant === "danger"
							? styles.confirming
							: ""
					}
                `}
								disabled={
									confirmingDelete &&
									option.variant !== "danger"
								}
							>
								{option.icon && (
									<span className={styles.menuItemIcon}>
										{option.icon}
									</span>
								)}
								<span className={styles.menuItemLabel}>
									{option.variant === "danger" &&
									confirmingDelete
										? "Confirm Delete"
										: option.label}
								</span>
							</button>
						))}
				</div>
			)}
		</div>
	);
};

export default MeatballMenu;
