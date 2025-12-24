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
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { tw, combine } from '../utils/tailwind';
import { authAPI, SignupData } from '../services/api';

const { height } = Dimensions.get('window');

interface SignUpScreenProps {
  onNavigateToLogin: () => void;
  onSignUpSuccess: (user: any) => void;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigateToLogin, onSignUpSuccess }) => {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // Handle Android back button - prevent going back from signup screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent back navigation on signup screen
    });

    return () => backHandler.remove();
  }, []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async () => {
    if (!name || !lastName || !email || !mobileNumber || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate mobile number format
    const mobileRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!mobileRegex.test(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return;
    }

    setLoading(true);
    
    try {
      const signupData: SignupData = {
        firstName: name.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: mobileNumber.trim(),
        password,
        confirmPassword,
      };

      const response = await authAPI.signup(signupData);
      
      setLoading(false);
      
      // Clear form
      setName('');
      setLastName('');
      setEmail('');
      setMobileNumber('');
      setPassword('');
      setConfirmPassword('');
      
      // Navigate to home screen
      onSignUpSuccess(response.user);
    } catch (error) {
      setLoading(false);
      console.error('Signup error:', error);
      
      let errorTitle = 'Registration Failed';
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific error messages
        if (error.message.toLowerCase().includes('user with this email already exists')) {
          errorTitle = 'Email Already Registered';
          errorMessage = 'An account with this email address already exists. Please use a different email or try logging in.';
        } else if (error.message.toLowerCase().includes('user with this mobile number already exists')) {
          errorTitle = 'Mobile Number Already Registered';
          errorMessage = 'An account with this mobile number already exists. Please use a different number or try logging in.';
        } else if (error.message.toLowerCase().includes('network')) {
          errorTitle = 'Connection Error';
          errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
        } else if (error.message.toLowerCase().includes('validation failed')) {
          errorTitle = 'Invalid Information';
          errorMessage = 'Please check your information and make sure all fields are filled correctly.';
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

  const navigateToLogin = () => {
    onNavigateToLogin();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Fixed Navigation Header at Top */}
      <View style={styles.fixedHeader}>
        <View style={combine(
          tw.flexRow,
          tw.itemsCenter,
          tw.justifyBetween,
          tw.px(20),
          tw.py(15)
        )}>
          <TouchableOpacity 
            style={tw.p(8)} 
            onPress={() => onNavigateToLogin()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={combine(
            tw.textWhite,
            tw.fontSemibold,
            tw.textXl
          )}>Sign Up</Text>
          <View style={tw.w(40)} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <View style={tw.wFull}>
              <View style={tw.mb(16)}>
                <Text style={combine(
                  tw.textGray700,
                  tw.fontMedium,
                  tw.textBase,
                  tw.mb(8)
                )}>First name</Text>
                <TextInput
                  style={combine(
                    tw.bgGray100,
                    tw.rounded,
                    tw.px(18),
                    tw.py(15),
                    tw.textBase,
                    tw.textBlack
                  )}
                  placeholder="Prathamesh"
                  placeholderTextColor="#bbb"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={tw.mb(16)}>
                <Text style={combine(
                  tw.textGray700,
                  tw.fontMedium,
                  tw.textBase,
                  tw.mb(8)
                )}>Last name</Text>
                <TextInput
                  style={combine(
                    tw.bgGray100,
                    tw.rounded,
                    tw.px(18),
                    tw.py(15),
                    tw.textBase,
                    tw.textBlack
                  )}
                  placeholder="Kale"
                  placeholderTextColor="#bbb"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>

              <View style={tw.mb(16)}>
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

              <View style={tw.mb(16)}>
                <Text style={combine(
                  tw.textGray700,
                  tw.fontMedium,
                  tw.textBase,
                  tw.mb(8)
                )}>Mobile Number</Text>
                <TextInput
                  style={combine(
                    tw.bgGray100,
                    tw.rounded,
                    tw.px(18),
                    tw.py(15),
                    tw.textBase,
                    tw.textBlack
                  )}
                  placeholder="+91 9403171172"
                  placeholderTextColor="#bbb"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={tw.mb(16)}>
                <Text style={combine(
                  tw.textGray700,
                  tw.fontMedium,
                  tw.textBase,
                  tw.mb(8)
                )}>Password</Text>
                <View style={{
                  position: 'relative',
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  <TextInput
                    style={combine(
                      tw.bgGray100,
                      tw.rounded,
                      tw.px(18),
                      tw.py(15),
                      tw.textBase,
                      tw.textBlack,
                      { 
                        flex: 1,
                        paddingRight: 55 
                      }
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

              <View style={tw.mb(16)}>
                <Text style={combine(
                  tw.textGray700,
                  tw.fontMedium,
                  tw.textBase,
                  tw.mb(8)
                )}>Confirm password</Text>
                <View style={{
                  position: 'relative',
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  <TextInput
                    style={combine(
                      tw.bgGray100,
                      tw.rounded,
                      tw.px(18),
                      tw.py(15),
                      tw.textBase,
                      tw.textBlack,
                      { 
                        flex: 1,
                        paddingRight: 55 
                      }
                    )}
                    placeholder="••••••••"
                    placeholderTextColor="#bbb"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={combine(
                      tw.absolute,
                      { right: 15, top: 15, bottom: 15, justifyContent: 'center' }
                    )}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
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
                  tw.mt(20)
                )}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text style={combine(
                  tw.textWhite,
                  tw.textBase,
                  tw.fontSemibold
                )}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Login Link */}
        <View style={combine(
          tw.bgWhite,
          tw.px(20),
          tw.py(20),
          tw.flexRow,
          tw.justifyCenter,
          styles.bottomContainer
        )}>
          <Text style={combine(tw.textSm, tw.textGray600)}>Already have any account? </Text>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={combine(tw.textSm, tw.textBlack, tw.fontSemibold)}>Sign In</Text>
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
  },
  fixedHeader: {
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    zIndex: 10,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flex: 0.2,
    backgroundColor: '#000',
    overflow: 'hidden',
    paddingTop: 50,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 35,
    paddingTop: 35,
  },
  bottomContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default SignUpScreen;