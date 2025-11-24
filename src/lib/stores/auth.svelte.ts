import { auth } from '$lib/firebase';
import {
	signInWithPopup,
	GoogleAuthProvider,
	OAuthProvider,
	signOut as firebaseSignOut,
	onAuthStateChanged,
	type User
} from 'firebase/auth';

// Svelte 5 runes-based auth store
let currentUser = $state<User | null>(null);
let loading = $state(true);

// Initialize auth state listener
if (typeof window !== 'undefined') {
	onAuthStateChanged(auth, (user) => {
		currentUser = user;
		loading = false;
	});
}

export const authStore = {
	get user() {
		return currentUser;
	},
	get loading() {
		return loading;
	},
	get isAuthenticated() {
		return currentUser !== null;
	},

	async signInWithGoogle() {
		const provider = new GoogleAuthProvider();
		try {
			const result = await signInWithPopup(auth, provider);
			return result.user;
		} catch (error) {
			console.error('Google sign-in error:', error);
			throw error;
		}
	},

	async signInWithApple() {
		const provider = new OAuthProvider('apple.com');
		try {
			const result = await signInWithPopup(auth, provider);
			return result.user;
		} catch (error) {
			console.error('Apple sign-in error:', error);
			throw error;
		}
	},

	async signOut() {
		try {
			await firebaseSignOut(auth);
		} catch (error) {
			console.error('Sign-out error:', error);
			throw error;
		}
	}
};
