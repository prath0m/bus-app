import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tw, combine } from '../utils/tailwind';
import { authAPI } from '../services/api';
import BottomNavigation, { TabName } from '../components/BottomNavigation';

const { height } = Dimensions.get('window');

interface HomeScreenProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    role: string;
  };
  onLogout: () => void;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
  onNavigateToPayment?: () => void;
  onNavigateToCreate?: () => void;
  onNavigateToRoutes?: () => void;
}

const HomeScreen = ({ 
  user, 
  onNavigateToProfile, 
  onLogout, 
  onNavigateToSettings,
  onNavigateToPayment,
  onNavigateToCreate,
  onNavigateToRoutes
}: HomeScreenProps) => {
  // Since this is HomeScreen, home should always be active
  const activeTab: TabName = 'home';
  
  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onLogout();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Current date state
  const today = new Date();
  const currentDate = today.getDate();
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11 (Oct = 9)
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  
  // Ref for ScrollView
  const scrollViewRef = useRef<ScrollView>(null);

  // Helper functions for month navigation
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    // Reset selected date when changing months
    setSelectedDate(1);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    // Reset selected date when changing months
    setSelectedDate(1);
  };

  // Auto-scroll to selected date when month changes or component mounts
  useEffect(() => {
    if (scrollViewRef.current) {
      const dateToScrollTo = (currentMonth === today.getMonth() && currentYear === today.getFullYear()) 
        ? currentDate 
        : selectedDate;
      
      // Calculate scroll position (each date item is 60px wide + 12px margin = 72px total)
      const itemWidth = 72;
      const scrollPosition = Math.max(0, (dateToScrollTo - 3) * itemWidth); // Show 2-3 dates before target
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: scrollPosition, animated: true });
      }, 300);
    }
  }, [currentMonth, currentYear, selectedDate]);



  const handleLogout = async () => {
    try {
      await authAPI.logout();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      onLogout();
    }
  };

  const handleTabPress = (tab: TabName) => {
    switch (tab) {
      case 'home':
        break;
      case 'payment':
        onNavigateToPayment?.();
        break;
      case 'create':
        onNavigateToCreate?.();
        break;
      case 'routes':
        onNavigateToRoutes?.();
        break;
      case 'profile':
        onNavigateToProfile();
        break;
      default:
        break;
    }
  };
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
          {/* Profile Circle */}
          <TouchableOpacity 
            style={styles.profileCircle}
            onPress={onNavigateToProfile}
          >
            <Text style={styles.profileInitials}>
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </Text>
          </TouchableOpacity>
          
          {/* Settings Icon */}
          <TouchableOpacity 
            style={tw.p(8)} 
            onPress={onNavigateToSettings}
          >
            <Ionicons name="settings-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Hello {user.firstName}!</Text>
        </View>

        {/* Date Selector with Horizontal Scroll */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPreviousMonth}>
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.calendarMonth}>
              {monthNames[currentMonth]} {currentYear}
            </Text>
            <TouchableOpacity onPress={goToNextMonth}>
              <Ionicons name="chevron-forward" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScrollContainer}
          >
            {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }, (_, i) => {
              const date = i + 1;
              const isToday = date === currentDate && 
                            currentMonth === today.getMonth() && 
                            currentYear === today.getFullYear();
              
              // Define holidays for different months (example)
              const getHolidays = (month: number) => {
                const holidays: { [key: number]: number[] } = {
                  0: [1, 26], // January: New Year, Republic Day
                  2: [8], // March: Holi (example date)
                  3: [14], // April: Baisakhi (example)
                  7: [15], // August: Independence Day
                  9: [2, 10, 25, 31], // October: Gandhi Jayanti, Dussehra, Diwali, Halloween
                  11: [25] // December: Christmas
                };
                return holidays[month] || [];
              };
              
              const isHoliday = getHolidays(currentMonth).includes(date);
              const isSelected = date === selectedDate;
              
              // Check if the date is a Sunday (0 = Sunday in JavaScript)
              const isSunday = new Date(currentYear, currentMonth, date).getDay() === 0;
              
              return (
                <TouchableOpacity 
                  key={date} 
                  style={styles.scrollDateItem}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={styles.dayOfWeek}>
                    {new Date(currentYear, currentMonth, date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <View 
                    style={[
                      styles.dateCircle,
                      isSelected && styles.selectedDate,
                      isToday && !isSelected && styles.todayDate,
                      isHoliday && !isSelected && !isToday && styles.holidayDate,
                      isSunday && !isSelected && !isToday && !isHoliday && styles.sundayDate
                    ]}
                  >
                    <Text 
                      style={[
                        styles.dateText,
                        isSelected && styles.selectedDateText,
                        isToday && !isSelected && styles.todayDateText,
                        isHoliday && !isSelected && !isToday && styles.holidayDateText,
                        isSunday && !isSelected && !isToday && !isHoliday && styles.sundayDateText
                      ]}
                    >
                      {date}
                    </Text>
                  </View>
                  {isToday && (
                    <Text style={styles.todayLabel}>Today</Text>
                  )}
                  {isHoliday && !isToday && (
                    <Text style={styles.holidayLabel}>Holiday</Text>
                  )}
                  {isSunday && !isToday && !isHoliday && (
                    <Text style={styles.sundayLabel}>Sunday</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
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
  },
  welcomeCard: {
    marginBottom: 24,
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  greetingSection: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  trackTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  dateItem: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeDateItem: {
    backgroundColor: '#2c3e50',
    borderColor: '#2c3e50',
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  activeDateNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  dateDay: {
    fontSize: 12,
    color: '#666',
  },
  activeDateDay: {
    fontSize: 12,
    color: '#fff',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  dayHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    width: 32,
  },
  calendarDays: {
    flex: 1,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayItem: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  activeDayItem: {
    backgroundColor: '#000',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  activeDayText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inactiveDayText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  dateScrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  scrollDateItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 60,
  },
  dayOfWeek: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  selectedDate: {
    backgroundColor: '#000',
  },
  todayDate: {
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  holidayDate: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedDateText: {
    color: '#fff',
  },
  todayDateText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  holidayDateText: {
    color: '#F44336',
  },
  holidayLabel: {
    fontSize: 10,
    color: '#F44336',
    textAlign: 'center',
  },
  todayLabel: {
    fontSize: 10,
    color: '#000',
    textAlign: 'center',
    fontWeight: '600',
  },
  sundayDate: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  sundayDateText: {
    color: '#FF6F00',
    fontWeight: '600',
  },
  sundayLabel: {
    fontSize: 10,
    color: '#FF6F00',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default HomeScreen;