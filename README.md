# Steward Expense Tracking Web App

## Overview
Steward is a user-friendly expense tracking web application designed to help individuals manage their finances effectively. With intuitive visualizations, real-time data syncing, and secure authentication, users can seamlessly track their income and expenses while gaining valuable financial insights.

## Features
- **User Authentication**: Secure login and registration using Firebase Authentication (Google Sign-In supported).
- **Expense & Income Tracking**: Add, edit, and delete transactions with category selection.
- **Data Visualization**: Interactive charts and graphs (powered by Recharts) for better financial insights.
- **Dashboard Overview**: Personalized financial summary with income vs. expense breakdown.
- **Session Persistence**: Seamless user experience with Firebase session management.
- **Responsive UI**: Clean and minimal design for desktop and mobile users.

## Tech Stack
- **Frontend**: React, TypeScript, TSX, HTML, CSS
- **Backend**: Firebase Realtime Database (transitioning to Firestore in the future)
- **Authentication**: Firebase Authentication (Google Sign-In integration)
- **Data Visualization**: Recharts for interactive financial graphs
- **State Management**: React Context API
- **Hosting**: Vercel / Firebase Hosting

## Installation & Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/steward-expense-tracker.git
   cd steward-expense-tracker
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Authentication (Google Sign-In) and Realtime Database.
   - Add your Firebase configuration to a `.env` file:
     ```sh
     REACT_APP_FIREBASE_API_KEY=your_api_key
     REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
     REACT_APP_FIREBASE_PROJECT_ID=your_project_id
     REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     REACT_APP_FIREBASE_APP_ID=your_app_id
     ```
4. Start the development server:
   ```sh
   npm run dev
   ```


## Contributing
Contributions are welcome! If you’d like to improve Steward, feel free to fork the repo, create a branch, and submit a pull request.


## Contact
For questions or feedback, reach out at [chrislinflhs@gmail.com] or open an issue on GitHub.

---

_Keep track of your expenses and take control of your financial future with Steward!_

