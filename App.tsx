import React, { useState, useEffect, useRef } from 'react';
import { View, AppState, AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import CreateScreen from './src/screens/CreateScreen';
import RoutesScreen from './src/screens/RoutesScreen';
import StudentDetailScreen from './src/screens/StudentDetailScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import LockScreen from './src/screens/LockScreen';
import { authAPI, User, Student } from './src/services/api';
import { requestNotificationPermission } from './src/utils/notifications';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { isAppLockEnabled } from './src/utils/appLock';

type ScreenType = 'Login' | 'SignUp' | 'Home' | 'Profile' | 'Settings' | 'Payment' | 'Create' | 'Routes' | 'StudentDetail' | 'History';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { colors, isDark } = useAppTheme();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('Login');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<{ student: Student; schoolName: string } | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const appState = useRef(AppState.currentState);

  // Check if user is already logged in
  useEffect(() => {
    checkAuthStatus();
    requestNotificationPermission();
  }, []);

  // Re-lock whenever the app leaves the foreground (if app lock is on), so
  // it's already showing the PIN/biometric screen the instant it's reopened
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appState.current === 'active' && nextState !== 'active') {
        const enabled = await isAppLockEnabled();
        if (enabled && user) setIsLocked(true);
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      const userData = await authAPI.verifyToken();
      setUser(userData);
      setCurrentScreen('Home');
      const enabled = await isAppLockEnabled();
      if (enabled) setIsLocked(true);
    } catch (error) {
      // User not logged in or token expired
      setCurrentScreen('Login');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSignUp = () => {
    setCurrentScreen('SignUp');
  };

  const navigateToLogin = () => {
    setCurrentScreen('Login');
  };

  const navigateToHome = (userData: User) => {
    setUser(userData);
    setCurrentScreen('Home');
  };

  const navigateToProfile = () => {
    setCurrentScreen('Profile');
  };

  const navigateToSettings = () => {
    setCurrentScreen('Settings');
  };

  const navigateToPayment = () => {
    setCurrentScreen('Payment');
  };

  const navigateToCreate = () => {
    setCurrentScreen('Create');
  };

  const navigateToRoutes = () => {
    setCurrentScreen('Routes');
  };

  const navigateToHistory = () => {
    setCurrentScreen('History');
  };

  const navigateToStudentDetail = (student: Student, schoolName: string) => {
    setSelectedStudent({ student, schoolName });
    setCurrentScreen('StudentDetail');
  };

  const navigateBackToHome = () => {
    setCurrentScreen('Home');
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    setUser(null);
    setIsLocked(false);
    setCurrentScreen('Login');
  };

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        {/* You can add a loading spinner here */}
      </View>
    );
  }

  if (isLocked && user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <LockScreen onUnlock={() => setIsLocked(false)} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {currentScreen === 'Login' ? (
        <LoginScreen 
          onNavigateToSignUp={navigateToSignUp} 
          onLoginSuccess={navigateToHome}
        />
      ) : currentScreen === 'SignUp' ? (
        <SignUpScreen 
          onNavigateToLogin={navigateToLogin}
          onSignUpSuccess={navigateToHome}
        />
      ) : currentScreen === 'Profile' ? (
        <ProfileScreen 
          user={user!}
          onBack={navigateBackToHome}
          onUserUpdate={handleUserUpdate}
          onLogout={handleLogout}
          onNavigateToHome={navigateBackToHome}
          onNavigateToPayment={navigateToPayment}
          onNavigateToCreate={navigateToCreate}
          onNavigateToRoutes={navigateToRoutes}
        />
      ) : currentScreen === 'Settings' ? (
        <SettingsScreen 
          onBack={navigateBackToHome}
        />
      ) : currentScreen === 'Payment' ? (
        <PaymentScreen
          user={user!}
          onBack={navigateBackToHome}
          onNavigateToHome={navigateBackToHome}
          onNavigateToCreate={navigateToCreate}
          onNavigateToRoutes={navigateToRoutes}
          onNavigateToProfile={navigateToProfile}
          onNavigateToHistory={navigateToHistory}
        />
      ) : currentScreen === 'History' ? (
        <HistoryScreen
          user={user!}
          onBack={navigateToPayment}
          onNavigateToHome={navigateBackToHome}
          onNavigateToPayment={navigateToPayment}
          onNavigateToCreate={navigateToCreate}
          onNavigateToRoutes={navigateToRoutes}
          onNavigateToProfile={navigateToProfile}
        />
      ) : currentScreen === 'Create' ? (
        <CreateScreen 
          user={user!}
          onBack={navigateBackToHome}
          onNavigateToHome={navigateBackToHome}
          onNavigateToPayment={navigateToPayment}
          onNavigateToRoutes={navigateToRoutes}
          onNavigateToProfile={navigateToProfile}
          onNavigateToStudentDetail={navigateToStudentDetail}
        />
      ) : currentScreen === 'StudentDetail' && selectedStudent ? (
        <StudentDetailScreen
          student={selectedStudent.student}
          schoolName={selectedStudent.schoolName}
          user={user ?? undefined}
          onBack={() => setCurrentScreen('Routes')}
          onNavigateToHome={navigateBackToHome}
          onNavigateToPayment={navigateToPayment}
          onNavigateToCreate={() => setCurrentScreen('Create')}
          onNavigateToRoutes={navigateToRoutes}
          onNavigateToProfile={navigateToProfile}
        />
      ) : currentScreen === 'Routes' ? (
        <RoutesScreen 
          user={user!}
          onBack={navigateBackToHome}
          onNavigateToHome={navigateBackToHome}
          onNavigateToPayment={navigateToPayment}
          onNavigateToCreate={navigateToCreate}
          onNavigateToProfile={navigateToProfile}
          onNavigateToStudentDetail={navigateToStudentDetail}
        />
      ) : (
        <HomeScreen 
          user={user!} 
          onLogout={handleLogout}
          onNavigateToProfile={navigateToProfile}
          onNavigateToSettings={navigateToSettings}
          onNavigateToPayment={navigateToPayment}
          onNavigateToCreate={navigateToCreate}
          onNavigateToRoutes={navigateToRoutes}
          onNavigateToHistory={navigateToHistory}
        />
      )}
    </View>
  );
}