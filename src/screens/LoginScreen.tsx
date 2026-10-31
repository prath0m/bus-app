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
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { tw, combine } from '../utils/tailwind';
import { authAPI, LoginData } from '../services/api';
import { ThemeColors, radius, spacing, shadow } from '../utils/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { AnimatedPressable, FadeInView } from '../components/ui/Animated';

const { height } = Dimensions.get('window');

interface LoginScreenProps {
  onNavigateToSignUp: () => void;
  onLoginSuccess: (user: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToSignUp, onLoginSuccess }) => {
  const { colors, isDark } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle Android back button - prevent going back from login screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

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
      setEmail('');
      setPassword('');
      onLoginSuccess(response.user);
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);

      let errorTitle = 'Login Failed';
      let errorMessage = 'Login failed. Please try again.';

      if (error instanceof Error) {
        errorMessage = error.message;

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

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
            <FadeInView style={tw.itemsCenter}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>P</Text>
              </View>
            </FadeInView>
          </View>

          <FadeInView style={styles.formContainer} delay={80}>
            <Text style={styles.title}>Login</Text>

            <View style={tw.wFull}>
              <View style={tw.mb(20)}>
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

              <View style={tw.mb(20)}>
                <Text style={styles.label}>Password</Text>
                <View style={tw.relative}>
                  <TextInput
                    style={[styles.input, { paddingRight: 50 }]}
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

              <AnimatedPressable
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Logging in...' : 'Login'}
                </Text>
              </AnimatedPressable>
            </View>
          </FadeInView>
        </ScrollView>

        {/* Bottom Sign Up Link */}
        <View style={styles.bottomContainer}>
          <Text style={styles.bottomText}>Parent without an account? </Text>
          <AnimatedPressable onPress={onNavigateToSignUp}>
            <Text style={styles.bottomLink}>Sign Up</Text>
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
    height: height * 0.32,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    ...shadow.soft,
  },
  logoText: {
    color: colors.onPrimary,
    fontSize: 30,
    fontWeight: '800',
  },
  formContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing(9),
    paddingTop: spacing(9),
    paddingBottom: spacing(5),
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing(8),
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
  loginButton: {
    borderRadius: radius.sm,
    paddingVertical: spacing(4),
    alignItems: 'center',
    marginTop: spacing(6),
    backgroundColor: colors.primary,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
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

export default LoginScreen;
