import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import CreateScreen from './src/screens/CreateScreen';
import RoutesScreen from './src/screens/RoutesScreen';
import StudentDetailScreen from './src/screens/StudentDetailScreen';
import { authAPI, User, Student } from './src/services/api';

type ScreenType = 'Login' | 'SignUp' | 'Home' | 'Profile' | 'Settings' | 'Payment' | 'Create' | 'Routes' | 'StudentDetail';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('Login');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<{ student: Student; schoolName: string } | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await authAPI.verifyToken();
      setUser(userData);
      setCurrentScreen('Home');
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
    setCurrentScreen('Login');
  };

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* You can add a loading spinner here */}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
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
        />
      )}
    </View>
  );
}