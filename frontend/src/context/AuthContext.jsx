import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);

  // Load User Profile from Java Backend
  const fetchUserProfile = async (firebaseUser) => {
    try {
      const response = await api.get('/users/me');
      setUserProfile(response.data);
      setProfileExists(true);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setUserProfile(null);
        setProfileExists(false);
      } else {
        console.error("Error loading user profile", error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
        setProfileExists(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    if (!email.toLowerCase().endsWith('@saveetha.com')) {
      throw new Error('Only @saveetha.com email domains are permitted.');
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email, password) => {
    if (!email.toLowerCase().endsWith('@saveetha.com')) {
      throw new Error('Only @saveetha.com email domains are permitted.');
    }
    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    // Send email verification like the mobile app
    if (credentials.user) {
      await sendEmailVerification(credentials.user);
    }
    return credentials;
  };

  const logout = async () => {
    return firebaseSignOut(auth);
  };

  const reloadProfile = async () => {
    if (auth.currentUser) {
      await fetchUserProfile(auth.currentUser);
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    profileExists,
    login,
    signup,
    logout,
    reloadProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
