import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { tw } from '../utils/tailwind';
import { authAPI, SignupData } from '../services/api';
import { ThemeColors, radius, spacing } from '../utils/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { AnimatedPressable, FadeInView } from '../components/ui/Animated';

const { height } = Dimensions.get('window');

interface SignUpScreenProps {
  onNavigateToLogin: () => void;
  onSignUpSuccess: (user: any) => void;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigateToLogin, onSignUpSuccess }) => {
  const { colors, isDark } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
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

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

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
      setName('');
      setLastName('');
      setEmail('');
      setMobileNumber('');
      setPassword('');
      setConfirmPassword('');

      onSignUpSuccess(response.user);
    } catch (error) {
      setLoading(false);
      console.error('Signup error:', error);

      let errorTitle = 'Registration Failed';
      let errorMessage = 'Registration failed. Please try again.';

      if (error instanceof Error) {
        errorMessage = error.message;

        if (error.message.toLowerCase().includes('user with this email already exists')) {
          errorTitle = 'Email Already Registered';
          errorMessage = 'An account with this email address already exists. Please use a different email or try logging in.';
        } else if (error.message.toLowerCase().includes('user with this mobile number already exists')) {
          errorTitle = 'Mobile Number Already Registered';
          errorMessage = 'An account with this mobile number already exists. Please use a different number or try logging in.';
        } else if (error.message.toLowerCase().includes('not linked to any student')) {
          errorTitle = 'Number Not Found';
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

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Fixed Navigation Header at Top */}
      <View style={styles.fixedHeader}>
        <View style={styles.headerRow}>
          <AnimatedPressable style={styles.iconButton} onPress={onNavigateToLogin}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </AnimatedPressable>
          <Text style={styles.headerTitle}>Parent Sign Up</Text>
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
          <FadeInView style={styles.formContainer}>
            <View style={tw.wFull}>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={18} color={colors.textSecondary} />
                <Text style={styles.infoText}>
                  Sign up with the mobile number your bus owner has saved for your child. Bus owners are set up by the admin.
                </Text>
              </View>

              <View style={tw.mb(16)}>
                <Text style={styles.label}>First name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Prathamesh"
                  placeholderTextColor={colors.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={tw.mb(16)}>
                <Text style={styles.label}>Last name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Kale"
                  placeholderTextColor={colors.textTertiary}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>

              <View style={tw.mb(16)}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="prath0mkale@gmail.com"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={tw.mb(16)}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+91 9403171172"
                  placeholderTextColor={colors.textTertiary}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={tw.mb(16)}>
                <Text style={styles.label}>Password</Text>
                <View style={tw.relative}>
                  <TextInput
                    style={[styles.input, { paddingRight: 55 }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <AnimatedPressable
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </AnimatedPressable>
                </View>
              </View>

              <View style={tw.mb(16)}>
                <Text style={styles.label}>Confirm password</Text>
                <View style={tw.relative}>
                  <TextInput
                    style={[styles.input, { paddingRight: 55 }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textTertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <AnimatedPressable
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </AnimatedPressable>
                </View>
              </View>

              <AnimatedPressable
                style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text style={styles.signUpButtonText}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Text>
              </AnimatedPressable>
            </View>
          </FadeInView>
        </ScrollView>

        {/* Bottom Login Link */}
        <View style={styles.bottomContainer}>
          <Text style={styles.bottomText}>Already have any account? </Text>
          <AnimatedPressable onPress={onNavigateToLogin}>
            <Text style={styles.bottomLink}>Sign In</Text>
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  fixedHeader: {
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(3),
  },
  iconButton: {
    padding: spacing(2),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing(9),
    paddingTop: spacing(9),
  },
  infoBox: {
    flexDirection: 'row',
    gap: spacing(2),
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing(3),
    marginBottom: spacing(5),
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing(2),
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing(4.5),
    paddingVertical: spacing(4),
    fontSize: 16,
    color: colors.textPrimary,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    bottom: 15,
    justifyContent: 'center',
  },
  signUpButton: {
    borderRadius: radius.sm,
    paddingVertical: spacing(4),
    alignItems: 'center',
    marginTop: spacing(5),
    backgroundColor: colors.primary,
  },
  signUpButtonDisabled: {
    opacity: 0.5,
  },
  signUpButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(5),
    flexDirection: 'row',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bottomLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default SignUpScreen;
