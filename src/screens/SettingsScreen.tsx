import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tw, combine } from '../utils/tailwind';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={combine(
          tw.flexRow,
          tw.itemsCenter,
          tw.justifyBetween,
          tw.px(20),
          tw.py(5)
        )}>
          <TouchableOpacity 
            style={tw.p(8)} 
            onPress={onBack}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <Text style={combine(
            tw.textBlack,
            tw.fontBold,
            tw.textXl
          )}>Settings</Text>
          
          <View style={tw.p(8)}>
            {/* Empty space for alignment */}
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="information-circle-outline" size={24} color="#666" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>App Name</Text>
              <Text style={styles.settingValue}>School Bus Payment Tracker</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="code-outline" size={24} color="#666" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="build-outline" size={24} color="#666" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Build</Text>
              <Text style={styles.settingValue}>Production</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="calendar-outline" size={24} color="#666" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Last Updated</Text>
              <Text style={styles.settingValue}>October 2025</Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="bus-outline" size={24} color="#666" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Purpose</Text>
              <Text style={styles.settingValue}>Track monthly bus payment records for students</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="people-outline" size={24} color="#666" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Target Users</Text>
              <Text style={styles.settingValue}>Students, Parents, Administrators</Text>
            </View>
          </View>
        </View>

        {/* Technical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Details</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="phone-portrait-outline" size={24} color="#666" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Platform</Text>
              <Text style={styles.settingValue}>React Native Expo</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="server-outline" size={24} color="#666" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Backend</Text>
              <Text style={styles.settingValue}>Node.js with MongoDB</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#666" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Security</Text>
              <Text style={styles.settingValue}>JWT Authentication</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="help-circle-outline" size={24} color="#666" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Help & Support</Text>
              <Text style={styles.settingValue}>Get help with using the app</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="document-text-outline" size={24} color="#666" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Text style={styles.settingValue}>View our privacy policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 School Bus Payment Tracker
          </Text>
          <Text style={styles.footerSubtext}>
            Made with ❤️ for educational institutions
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingBottom: 10,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Extra space for bottom navigation
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SettingsScreen;