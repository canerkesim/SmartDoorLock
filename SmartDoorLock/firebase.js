import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
	apiKey: "AIzaSyA3XPgio-e9jXO8xG7Pef5BBs9CSULI5io",
	authDomain: "servo-feea4.firebaseapp.com",
	databaseURL:
		"https://servo-feea4-default-rtdb.europe-west1.firebasedatabase.app",
	projectId: "servo-feea4",
	storageBucket: "servo-feea4.appspot.com",
	messagingSenderId: "1050597292265",
	appId: "1:1050597292265:web:788226471df7aed42a1878",
};
const app = initializeApp(firebaseConfig);
export default auth = getAuth(app);
