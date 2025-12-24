import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { tw, combine } from '../utils/tailwind';
import { authAPI, LoginData } from '../services/api';

const { height } = Dimensions.get('window');

interface LoginScreenProps {
  onNavigateToSignUp: () => void;
  onLoginSuccess: (user: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToSignUp, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle Android back button - prevent going back from login screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent back navigation on login screen
    });

    return () => backHandler.remove();
  }, []);

  // Handle Android back button - prevent going back from login screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent back navigation on login screen
    });

    return () => backHandler.remove();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      const loginData: LoginData = {
        email: email.trim().toLowerCase(),
        password,
      };

      const response = await authAPI.login(loginData);
      
      setLoading(false);
      
      // Clear form
      setEmail('');
      setPassword('');
      
      // Navigate to home screen
      onLoginSuccess(response.user);
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      
      let errorTitle = 'Login Failed';
      let errorMessage = 'Login failed. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific error messages
        if (error.message.toLowerCase().includes('invalid email or password')) {
          errorTitle = 'Incorrect Credentials';
          errorMessage = 'The email or password you entered is incorrect. Please check your credentials and try again.';
        } else if (error.message.toLowerCase().includes('network')) {
          errorTitle = 'Connection Error';
          errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
        } else if (error.message.toLowerCase().includes('account has been deactivated')) {
          errorTitle = 'Account Deactivated';
          errorMessage = 'Your account has been deactivated. Please contact support for assistance.';
        }
      }
      
      Alert.alert(errorTitle, errorMessage, [
        {
          text: 'OK',
          style: 'default',
        },
      ]);
    }
  };

  const navigateToSignUp = () => {
    onNavigateToSignUp();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={combine(tw.relative, styles.header)}>
            <View style={combine(tw.itemsCenter, { zIndex: 2 })}>
              <View style={combine(
                tw.bgWhite,
                tw.shadowLg,
                styles.logo
              )}>
                <Text style={combine(
                  tw.textBlack,
                  tw.fontBold,
                  tw.text3xl
                )}>P</Text>
              </View>
            </View>
          </View>

          <View style={combine(
            tw.bgWhite,
            styles.formContainer
          )}>
            <Text style={combine(
              tw.textBlack,
              tw.fontBold,
              tw.text3xl,
              tw.mb(30)
            )}>Login</Text>
            
            <View style={tw.wFull}>
              <View style={tw.mb(20)}>
                <Text style={combine(
                  tw.textGray700,
                  tw.fontMedium,
                  tw.textBase,
                  tw.mb(8)
                )}>Email</Text>
                <TextInput
                  style={combine(
                    tw.bgGray100,
                    tw.rounded,
                    tw.px(18),
                    tw.py(15),
                    tw.textBase,
                    tw.textBlack
                  )}
                  placeholder="prath0mkale@gmail.com"
                  placeholderTextColor="#bbb"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={tw.mb(20)}>
                <Text style={combine(
                  tw.textGray700,
                  tw.fontMedium,
                  tw.textBase,
                  tw.mb(8)
                )}>Password</Text>
                <View style={combine(tw.relative)}>
                  <TextInput
                    style={combine(
                      tw.bgGray100,
                      tw.rounded,
                      tw.px(18),
                      tw.py(15),
                      tw.textBase,
                      tw.textBlack,
                      { paddingRight: 50 }
                    )}
                    placeholder="••••••••"
                    placeholderTextColor="#bbb"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={combine(
                      tw.absolute,
                      { right: 15, top: 15, bottom: 15, justifyContent: 'center' }
                    )}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={combine(
                  loading ? tw.bgGray(200) : tw.bgBlack,
                  tw.rounded,
                  tw.py(16),
                  tw.itemsCenter,
                  tw.mt(25)
                )}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={combine(
                  tw.textWhite,
                  tw.textBase,
                  tw.fontSemibold
                )}>
                  {loading ? 'Logging in...' : 'Login'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        
        {/* Bottom Sign Up Link */}
        <View style={combine(
          tw.bgWhite,
          tw.px(20),
          tw.py(20),
          tw.flexRow,
          tw.justifyCenter,
          styles.bottomContainer
        )}>
          <Text style={combine(tw.textSm, tw.textGray600)}>Don't have any account? </Text>
          <TouchableOpacity onPress={onNavigateToSignUp}>
            <Text style={combine(tw.textSm, tw.textBlack, tw.fontSemibold)}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height - (Platform.OS === 'ios' ? 90 : 65),
  },
  header: {
    height: height * 0.4,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 35,
    paddingTop: 35,
    paddingBottom: 20,
  },
  bottomContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});

export default LoginScreen;