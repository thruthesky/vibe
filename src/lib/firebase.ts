import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
	apiKey: 'AIzaSyDxc1SSSwzgIPCikQpsgPKHkO0s8Qn1y7M',
	authDomain: 'withcenter-test-5.firebaseapp.com',
	databaseURL: 'https://withcenter-test-5-default-rtdb.asia-southeast1.firebasedatabase.app',
	projectId: 'withcenter-test-5',
	storageBucket: 'withcenter-test-5.appspot.com',
	messagingSenderId: '1064417466216',
	appId: '1:1064417466216:web:a82ff0ee7524d2e3db28dd'
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
