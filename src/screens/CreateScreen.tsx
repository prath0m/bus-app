import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Modal, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import BottomNavigation, { TabName } from '../components/BottomNavigation';
import { schoolAPI, studentAPI, School, Student } from '../services/api';

interface CreateScreenProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    role: string;
  };
  onBack: () => void;
  onNavigateToHome?: () => void;
  onNavigateToPayment?: () => void;
  onNavigateToRoutes?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToStudentDetail?: (student: Student, schoolName: string) => void;
}

// Time options for the time picker with comprehensive AM/PM coverage
const timeOptions = [
  // Morning Hours (AM)
  '5:00 AM', '5:30 AM', '6:00 AM', '6:15 AM', '6:30 AM', '6:45 AM',
  '7:00 AM', '7:15 AM', '7:30 AM', '7:45 AM', '8:00 AM', '8:15 AM', 
  '8:30 AM', '8:45 AM', '9:00 AM', '9:15 AM', '9:30 AM', '9:45 AM',
  '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM', '11:00 AM', '11:15 AM', 
  '11:30 AM', '11:45 AM',
  // Afternoon/Evening Hours (PM)
  '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM', '1:00 PM', '1:15 PM',
  '1:30 PM', '1:45 PM', '2:00 PM', '2:15 PM', '2:30 PM', '2:45 PM',
  '3:00 PM', '3:15 PM', '3:30 PM', '3:45 PM', '4:00 PM', '4:15 PM',
  '4:30 PM', '4:45 PM', '5:00 PM', '5:15 PM', '5:30 PM', '5:45 PM',
  '6:00 PM', '6:15 PM', '6:30 PM', '6:45 PM', '7:00 PM', '7:15 PM',
  '7:30 PM', '7:45 PM', '8:00 PM', '8:15 PM', '8:30 PM', '8:45 PM',
  '9:00 PM', '9:30 PM', '10:00 PM'
];

// Helper function to group times by AM/PM
const getGroupedTimes = () => {
  const amTimes = timeOptions.filter(time => time.includes('AM'));
  const pmTimes = timeOptions.filter(time => time.includes('PM'));
  return { amTimes, pmTimes };
};

// Payment options for student form
const paymentModeOptions = ['Cash', 'Online'];
const paymentPeriodOptions = ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'Custom'];

const CreateScreen: React.FC<CreateScreenProps> = ({
  user,
  onBack,
  onNavigateToHome,
  onNavigateToPayment,
  onNavigateToRoutes,
  onNavigateToProfile,
  onNavigateToStudentDetail
}) => {
  const activeTab: TabName = 'create';
  const [hasSchool, setHasSchool] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // School form state
  const [schoolForm, setSchoolForm] = useState({
    schoolName: '',
    schoolAddress: '',
    timing: '',
    shift: ''
  });

  // Time picker states
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('14:00');
  
  // Shift dropdown state
  const [showShiftModal, setShowShiftModal] = useState(false);
  
  // Shift options
  const shiftOptions = [
    'Morning',
    'Afternoon', 
    'Evening'
  ];

  // Student form states
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [availableSchools, setAvailableSchools] = useState<School[]>([]);
  const [userSchools, setUserSchools] = useState<School[]>([]);
  const [schoolStudents, setSchoolStudents] = useState<{ [key: string]: Student[] }>({});
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
  const [showListView, setShowListView] = useState(false);
  const [studentForm, setStudentForm] = useState({
    name: '',
    dateOfJoining: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    schoolId: '',
    contactNumber: '',
    paymentMode: '',
    paymentPeriod: '',
    totalYearlyPayment: ''
  });

  // Student form dropdown states
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showPaymentModeDropdown, setShowPaymentModeDropdown] = useState(false);
  const [showPaymentPeriodDropdown, setShowPaymentPeriodDropdown] = useState(false);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  
  // Check if user has created any schools
  useEffect(() => {
    checkUserSchools();
  }, []);

  // Load schools and students when hasSchool changes
  useEffect(() => {
    if (hasSchool && !showSchoolForm) {
      loadSchoolsAndStudents();
    }
  }, [hasSchool]);

  // Log when showListView changes
  useEffect(() => {
    console.log('showListView changed to:', showListView);
  }, [showListView]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const checkUserSchools = async () => {
    try {
      console.log('Checking schools for user:', user.id);
      
      // Make API call to check if user has schools
      const schoolCheck = await schoolAPI.checkUserSchools(user.id);
      
      console.log('School check result:', schoolCheck);
      console.log('Type of schoolCheck:', typeof schoolCheck);
      console.log('Keys in schoolCheck:', schoolCheck ? Object.keys(schoolCheck) : 'null/undefined');
      
      if (schoolCheck && typeof schoolCheck.hasSchools !== 'undefined') {
        console.log('Setting hasSchool to:', schoolCheck.hasSchools);
        setHasSchool(schoolCheck.hasSchools);
        
        // If user has schools, load them and show the list view
        if (schoolCheck.hasSchools) {
          console.log('User has schools, loading list view...');
          await loadSchoolsAndStudents();
          setShowListView(true);
        }
      } else {
        console.log('Invalid school check response, defaulting to false');
        setHasSchool(false);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking user schools:', error);
      // On error, assume no schools and let user try to create
      setHasSchool(false);
      setIsLoading(false);
    }
  };  const handleCreateSchool = () => {
    setShowSchoolForm(true);
  };

  const handleFormSubmit = async () => {
    // Validate form
    if (!schoolForm.schoolName.trim() || !schoolForm.schoolAddress.trim() || 
        !schoolForm.timing.trim() || !schoolForm.shift.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create school data object
      const schoolData = {
        schoolName: schoolForm.schoolName.trim(),
        schoolAddress: schoolForm.schoolAddress.trim(),
        timing: schoolForm.timing.trim(),
        shift: schoolForm.shift.trim(),
        userId: user.id
      };

      console.log('Creating school with data:', schoolData);
      
      // Make API call to create school
      const createdSchool = await schoolAPI.createSchool(schoolData);
      
      console.log('School created successfully:', createdSchool);
      
      // Update UI state
      setHasSchool(true);
      setShowSchoolForm(false);
      setShowListView(true);
      setSchoolForm({ schoolName: '', schoolAddress: '', timing: '', shift: '' });
      setStartTime('');
      setEndTime('');
      
      // Load schools and students
      await loadSchoolsAndStudents();
      
      // Show success message after UI updates
      setTimeout(() => {
        Alert.alert(
          'Success', 
          `School "${createdSchool.schoolName}" created successfully!`,
          [{ text: 'OK', onPress: () => console.log('School creation confirmed') }]
        );
      }, 500);
    } catch (error) {
      console.error('Error creating school:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create school. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setShowSchoolForm(false);
    setSchoolForm({ schoolName: '', schoolAddress: '', timing: '', shift: '' });
    setStartTime('08:00');
    setEndTime('14:00');
  };

  const handleTimeConfirm = () => {
    const timingString = `${startTime} - ${endTime}`;
    setSchoolForm(prev => ({ ...prev, timing: timingString }));
    setShowTimeModal(false);
  };

  const handleShiftSelect = (shift: string) => {
    setSchoolForm(prev => ({ ...prev, shift }));
    setShowShiftModal(false);
  };

  // Load schools and their students
  const loadSchoolsAndStudents = async () => {
    try {
      console.log('Loading schools for user:', user.id);
      const schools = await schoolAPI.getUserSchools(user.id);
      console.log('Loaded schools:', schools);
      setUserSchools(schools);
      
      // Fetch students for each school
      const studentsMap: { [key: string]: Student[] } = {};
      for (const school of schools) {
        try {
          console.log('Fetching students for school:', school.id);
          const response = await studentAPI.getSchoolStudents(school.id);
          console.log(`Students for school ${school.id}:`, response);
          studentsMap[school.id] = response;
        } catch (error) {
          console.error(`Error fetching students for school ${school.id}:`, error);
          studentsMap[school.id] = [];
        }
      }
      console.log('Final studentsMap:', studentsMap);
      setSchoolStudents(studentsMap);
    } catch (error) {
      console.error('Error loading schools and students:', error);
      Alert.alert('Error', 'Failed to load schools and students');
    }
  };

  // Student form functions
  const handleCreateStudent = async () => {
    console.log('handleCreateStudent called');
    console.log('hasSchool:', hasSchool);
    console.log('user.id:', user.id);
    
    try {
      // First, check if user has schools
      if (!hasSchool) {
        console.log('No school found, showing alert');
        Alert.alert('No Schools Found', 'Please create a school first before adding students.');
        return;
      }

      console.log('Fetching schools for user...');
      // Fetch available schools for this user
      const schools = await schoolAPI.getUserSchools(user.id);
      console.log('Fetched schools:', schools);
      
      if (schools.length === 0) {
        console.log('No schools returned from API');
        Alert.alert('No Schools Found', 'Please create a school first before adding students.');
        return;
      }

      console.log('Setting available schools and showing form');
      setAvailableSchools(schools);
      setShowStudentForm(true);
    } catch (error) {
      console.error('Error fetching schools:', error);
      Alert.alert('Error', 'Failed to load schools. Please try again.');
    }
  };

  const handleStudentFormSubmit = async () => {
    // Validate form
    if (!studentForm.name.trim() || !studentForm.schoolId || !studentForm.contactNumber.trim() || 
        !studentForm.paymentMode || !studentForm.paymentPeriod || !studentForm.totalYearlyPayment.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // Validate yearly payment is a number
    const yearlyPayment = parseFloat(studentForm.totalYearlyPayment);
    if (isNaN(yearlyPayment) || yearlyPayment <= 0) {
      Alert.alert('Error', 'Please enter a valid yearly payment amount.');
      return;
    }

    setIsSubmittingStudent(true);
    try {
      const studentData = {
        name: studentForm.name.trim(),
        dateOfJoining: studentForm.dateOfJoining,
        schoolId: studentForm.schoolId,
        contactNumber: studentForm.contactNumber.trim(),
        paymentMode: studentForm.paymentMode,
        paymentPeriod: studentForm.paymentPeriod,
        totalYearlyPayment: yearlyPayment,
        userId: user.id
      };

      console.log('Creating student with data:', studentData);
      
      const createdStudent = await studentAPI.createStudent(studentData);
      
      console.log('Student created successfully:', createdStudent);
      
      // Reset form and close modal
      setShowStudentForm(false);
      setStudentForm({
        name: '',
        dateOfJoining: new Date().toISOString().split('T')[0],
        schoolId: '',
        contactNumber: '',
        paymentMode: '',
        paymentPeriod: '',
        totalYearlyPayment: ''
      });
      
      // Reload schools and students
      if (showListView) {
        await loadSchoolsAndStudents();
      }
      
      Alert.alert(
        'Success', 
        `Student "${createdStudent.name}" created successfully!`,
        [{ text: 'OK', onPress: () => console.log('Student creation confirmed') }]
      );
    } catch (error) {
      console.error('Error creating student:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create student. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  const handleCancelStudentForm = () => {
    setShowStudentForm(false);
    setStudentForm({
      name: '',
      dateOfJoining: new Date().toISOString().split('T')[0],
      schoolId: '',
      contactNumber: '',
      paymentMode: '',
      paymentPeriod: '',
      totalYearlyPayment: ''
    });
  };

  const handleSchoolSelect = (school: School) => {
    setStudentForm(prev => ({ ...prev, schoolId: school.id }));
    setShowSchoolDropdown(false);
  };

  const handlePaymentModeSelect = (mode: string) => {
    setStudentForm(prev => ({ ...prev, paymentMode: mode }));
    setShowPaymentModeDropdown(false);
  };

  const handlePaymentPeriodSelect = (period: string) => {
    setStudentForm(prev => ({ ...prev, paymentPeriod: period }));
    setShowPaymentPeriodDropdown(false);
  };

  const handleImportContact = async () => {
    try {
      // Request permission to access contacts
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        // Open contacts and get selected contact
        const contact = await Contacts.presentContactPickerAsync();
        
        if (contact) {
          // Extract name and phone number from contact
          const contactName = contact.name || '';
          const phoneNumber = contact.phoneNumbers?.[0]?.number || '';
          
          // Update form with contact data
          setStudentForm(prev => ({
            ...prev,
            name: contactName,
            contactNumber: phoneNumber.replace(/\s+/g, '').replace(/[^0-9+]/g, '')
          }));
        }
      } else {
        Alert.alert('Permission Denied', 'Please allow access to contacts to import contact information.');
      }
    } catch (error) {
      console.error('Error importing contact:', error);
      Alert.alert('Error', 'Failed to import contact. Please try again.');
    }
  };

  const getSelectedSchoolName = () => {
    const selectedSchool = availableSchools.find(school => school.id === studentForm.schoolId);
    return selectedSchool ? selectedSchool.schoolName : '';
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();



  const handleTabPress = (tab: TabName) => {
    switch (tab) {
      case 'home':
        onNavigateToHome?.();
        break;
      case 'payment':
        onNavigateToPayment?.();
        break;
      case 'create':
        console.log('Already on Create');
        break;
      case 'routes':
        onNavigateToRoutes?.();
        break;
      case 'profile':
        onNavigateToProfile?.();
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {showSchoolForm ? (
          // School Creation Form
          <>
            <Text style={styles.title}>Create School</Text>
            <Text style={styles.subtitle}>Enter your school information</Text>
            
            <View style={styles.formContainer}>
              {/* School Name Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>School Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter school name"
                  value={schoolForm.schoolName}
                  onChangeText={(text) => setSchoolForm(prev => ({ ...prev, schoolName: text }))}
                  editable={!isSubmitting}
                />
              </View>

              {/* School Address Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>School Address *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Enter complete school address"
                  value={schoolForm.schoolAddress}
                  onChangeText={(text) => setSchoolForm(prev => ({ ...prev, schoolAddress: text }))}
                  multiline={true}
                  numberOfLines={3}
                  editable={!isSubmitting}
                />
              </View>

              {/* Timing Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>School Timing *</Text>
                <TouchableOpacity
                  style={[styles.textInput, styles.selectorInput]}
                  onPress={() => setShowTimeModal(true)}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.selectorText, !schoolForm.timing && styles.placeholderText]}>
                    {schoolForm.timing || 'Select school timing'}
                  </Text>
                  <Ionicons name="time-outline" size={20} color="#7f8c8d" />
                </TouchableOpacity>
              </View>

              {/* Shift Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Shift *</Text>
                <TouchableOpacity
                  style={[styles.textInput, styles.selectorInput]}
                  onPress={() => setShowShiftModal(true)}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.selectorText, !schoolForm.shift && styles.placeholderText]}>
                    {schoolForm.shift || 'Select shift'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#7f8c8d" />
                </TouchableOpacity>
              </View>

              {/* Form Actions */}
              <View style={styles.formActions}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleCancelForm}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.submitButton, isSubmitting && styles.disabledButton]} 
                  onPress={handleFormSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Text style={styles.submitButtonText}>Creating...</Text>
                  ) : (
                    <Text style={styles.submitButtonText}>Create School</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : showStudentForm ? (
          // Student Creation Form
          <>
            <Text style={styles.title}>Create Student</Text>
            <Text style={styles.subtitle}>Enter student information</Text>
            
            <View style={styles.formContainer}>
              {/* Student Name Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Student Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter student name"
                  value={studentForm.name}
                  onChangeText={(text) => setStudentForm(prev => ({ ...prev, name: text }))}
                  editable={!isSubmittingStudent}
                />
              </View>

              {/* Date of Joining Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date of Joining *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  value={studentForm.dateOfJoining}
                  onChangeText={(text) => setStudentForm(prev => ({ ...prev, dateOfJoining: text }))}
                  editable={!isSubmittingStudent}
                />
              </View>

              {/* School Selection Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>School *</Text>
                <TouchableOpacity
                  style={styles.selectorInput}
                  onPress={() => setShowSchoolDropdown(true)}
                  disabled={isSubmittingStudent}
                >
                  <Text style={[
                    getSelectedSchoolName() ? styles.selectorText : styles.placeholderText
                  ]}>
                    {getSelectedSchoolName() || 'Select School'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#95A5A6" />
                </TouchableOpacity>
              </View>

              {/* Contact Number Field with Import Option */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Number *</Text>
                <View style={styles.inputWithButtonContainer}>
                  <TextInput
                    style={[styles.textInput, styles.inputWithButton]}
                    placeholder="Enter contact number"
                    value={studentForm.contactNumber}
                    onChangeText={(text) => setStudentForm(prev => ({ ...prev, contactNumber: text }))}
                    keyboardType="phone-pad"
                    editable={!isSubmittingStudent}
                  />
                  <TouchableOpacity
                    style={styles.importButton}
                    onPress={handleImportContact}
                    disabled={isSubmittingStudent}
                  >
                    <Ionicons name="person-add" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Payment Mode Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Mode *</Text>
                <TouchableOpacity
                  style={styles.selectorInput}
                  onPress={() => setShowPaymentModeDropdown(true)}
                  disabled={isSubmittingStudent}
                >
                  <Text style={[
                    studentForm.paymentMode ? styles.selectorText : styles.placeholderText
                  ]}>
                    {studentForm.paymentMode || 'Select Payment Mode'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#95A5A6" />
                </TouchableOpacity>
              </View>

              {/* Payment Period Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Period *</Text>
                <TouchableOpacity
                  style={styles.selectorInput}
                  onPress={() => setShowPaymentPeriodDropdown(true)}
                  disabled={isSubmittingStudent}
                >
                  <Text style={[
                    studentForm.paymentPeriod ? styles.selectorText : styles.placeholderText
                  ]}>
                    {studentForm.paymentPeriod || 'Select Payment Period'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#95A5A6" />
                </TouchableOpacity>
              </View>

              {/* Total Yearly Payment Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Total Yearly Payment *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter total yearly payment amount"
                  value={studentForm.totalYearlyPayment}
                  onChangeText={(text) => setStudentForm(prev => ({ ...prev, totalYearlyPayment: text }))}
                  keyboardType="numeric"
                  editable={!isSubmittingStudent}
                />
              </View>

              {/* Form Actions */}
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelStudentForm}
                  disabled={isSubmittingStudent}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.submitButton, isSubmittingStudent && styles.disabledButton]} 
                  onPress={handleStudentFormSubmit}
                  disabled={isSubmittingStudent}
                >
                  {isSubmittingStudent ? (
                    <Text style={styles.submitButtonText}>Creating...</Text>
                  ) : (
                    <Text style={styles.submitButtonText}>Create Student</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          // Main Create Options AND Schools List View
          <>
            {/* Create New Options Section */}
            <Text style={styles.title}>Create New</Text>
            <Text style={styles.subtitle}>Choose what you want to create</Text>
        
            {/* School Creation Card */}
            <TouchableOpacity style={styles.optionCard} onPress={handleCreateSchool}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#f0f0f0' }]}>
                  <Ionicons name="school" size={32} color="#000" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Create School</Text>
                  <Text style={styles.cardDescription}>
                    Set up your school information and bus routes
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#BDC3C7" />
              </View>
            </TouchableOpacity>

            {/* Student Creation Card */}
            <TouchableOpacity 
              style={[
                styles.optionCard,
                !hasSchool && styles.disabledCard
              ]} 
              onPress={handleCreateStudent}
              disabled={!hasSchool}
            >
              <View style={styles.cardHeader}>
                <View style={[
                  styles.iconContainer, 
                  { backgroundColor: hasSchool ? '#f0f0f0' : '#F5F5F5' }
                ]}>
                  <Ionicons 
                    name="person-add" 
                    size={32} 
                    color={hasSchool ? '#000' : '#BDC3C7'} 
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[
                    styles.cardTitle,
                    !hasSchool && styles.disabledText
                  ]}>
                    Create Student
                  </Text>
                  <Text style={[
                    styles.cardDescription,
                    !hasSchool && styles.disabledText
                  ]}>
                    {hasSchool 
                      ? 'Register a new student for bus services'
                      : 'Create a school first to add students'
                    }
                  </Text>
                </View>
                {!hasSchool && (
                  <View style={styles.lockContainer}>
                    <Ionicons name="lock-closed" size={20} color="#E74C3C" />
                  </View>
                )}
                {hasSchool && (
                  <Ionicons name="chevron-forward" size={24} color="#BDC3C7" />
                )}
              </View>
              {!hasSchool && (
                <View style={styles.warningBanner}>
                  <Ionicons name="warning" size={16} color="#E74C3C" />
                  <Text style={styles.warningText}>
                    School creation required
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* School Status */}
            <View style={styles.statusContainer}>
              <View style={styles.statusHeader}>
                <Ionicons 
                  name={hasSchool ? "checkmark-circle" : "information-circle"} 
                  size={20} 
                  color={hasSchool ? "#000" : "#F39C12"} 
                />
                <Text style={styles.statusTitle}>
                  {hasSchool ? "School Created" : "Getting Started"}
                </Text>
              </View>
              <Text style={styles.statusDescription}>
                {hasSchool 
                  ? "You can now create students and manage your school's bus services."
                  : "Start by creating your school to unlock student registration and other features."
                }
              </Text>
            </View>

            {isLoading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Checking your schools...</Text>
              </View>
            )}

            {/* Schools and Students List View - Shows Below Main Options */}
            {userSchools.length > 0 && (
              <>
                <View style={{ marginTop: 32, marginBottom: 16 }}>
                  <Text style={styles.title}>Schools & Students</Text>
                  <Text style={styles.subtitle}>Manage your schools and students</Text>
                </View>

                {/* Schools List */}
                {userSchools.map((school) => (
                  <View key={school.id} style={styles.schoolCard}>
                    {/* School Header */}
                    <TouchableOpacity 
                      onPress={() => setExpandedSchool(expandedSchool === school.id ? null : school.id)}
                      style={styles.schoolCardHeader}
                    >
                      <View style={styles.schoolInfo}>
                        <Text style={styles.schoolName}>{school.schoolName}</Text>
                        <Text style={styles.schoolShift}>{school.shift}</Text>
                      </View>
                      <View style={styles.schoolStats}>
                        <Text style={styles.studentCount}>
                          {schoolStudents[school.id]?.length || 0} students
                        </Text>
                        <Ionicons 
                          name={expandedSchool === school.id ? "chevron-up" : "chevron-down"} 
                          size={24} 
                          color="#000" 
                        />
                      </View>
                    </TouchableOpacity>

                    {/* School Details */}
                    {expandedSchool === school.id && (
                      <View style={styles.schoolDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Address:</Text>
                          <Text style={styles.detailValue}>{school.schoolAddress}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Timing:</Text>
                          <Text style={styles.detailValue}>{school.timing}</Text>
                        </View>

                        {/* Students List */}
                        <View style={styles.studentsSection}>
                          <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Students</Text>
                            <TouchableOpacity 
                              onPress={handleCreateStudent}
                              style={styles.addStudentBtn}
                            >
                              <Ionicons name="add" size={20} color="#000" />
                            </TouchableOpacity>
                          </View>

                          {schoolStudents[school.id] && schoolStudents[school.id].length > 0 ? (
                            <View>
                              {schoolStudents[school.id].map((student) => (
                                <TouchableOpacity 
                                  key={student.id}
                                  onPress={() => onNavigateToStudentDetail?.(student, school.schoolName)}
                                  style={styles.studentItem}
                                >
                                  <View style={styles.studentAvatar}>
                                    <Text style={styles.studentAvatarText}>
                                      {student.name.charAt(0).toUpperCase()}
                                    </Text>
                                  </View>
                                  <View style={styles.studentDetails}>
                                    <Text style={styles.studentName}>{student.name}</Text>
                                    <Text style={styles.studentPhone}>{student.contactNumber}</Text>
                                  </View>
                                  <View style={styles.studentPayment}>
                                    <Text style={styles.paymentMode}>{student.paymentMode}</Text>
                                  </View>
                                  <Ionicons name="chevron-forward" size={20} color="#999" />
                                </TouchableOpacity>
                              ))}
                            </View>
                          ) : (
                            <View style={styles.emptyState}>
                              <Ionicons name="person-outline" size={32} color="#BDC3C7" />
                              <Text style={styles.emptyStateText}>No students yet</Text>
                              <TouchableOpacity 
                                style={styles.emptyStateButton}
                                onPress={handleCreateStudent}
                              >
                                <Text style={styles.emptyStateButtonText}>Add First Student</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select School Timing</Text>
            
            <View style={styles.timePickerContainer}>
              <View style={styles.timeSection}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {/* Morning Times (AM) */}
                  <View style={styles.timeSectionHeader}>
                    <Text style={styles.timeSectionHeaderText}>Morning (AM)</Text>
                  </View>
                  {getGroupedTimes().amTimes.map((time) => (
                    <TouchableOpacity
                      key={`start-${time}`}
                      style={[styles.timeOption, startTime === time && styles.selectedTimeOption]}
                      onPress={() => setStartTime(time)}
                    >
                      <Text style={[styles.timeOptionText, startTime === time && styles.selectedTimeOptionText]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Afternoon/Evening Times (PM) */}
                  <View style={styles.timeSectionHeader}>
                    <Text style={styles.timeSectionHeaderText}>Afternoon/Evening (PM)</Text>
                  </View>
                  {getGroupedTimes().pmTimes.map((time) => (
                    <TouchableOpacity
                      key={`start-${time}`}
                      style={[styles.timeOption, startTime === time && styles.selectedTimeOption]}
                      onPress={() => setStartTime(time)}
                    >
                      <Text style={[styles.timeOptionText, startTime === time && styles.selectedTimeOptionText]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.timeSection}>
                <Text style={styles.timeLabel}>End Time</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {/* Morning Times (AM) */}
                  <View style={styles.timeSectionHeader}>
                    <Text style={styles.timeSectionHeaderText}>Morning (AM)</Text>
                  </View>
                  {getGroupedTimes().amTimes.map((time) => (
                    <TouchableOpacity
                      key={`end-${time}`}
                      style={[styles.timeOption, endTime === time && styles.selectedTimeOption]}
                      onPress={() => setEndTime(time)}
                    >
                      <Text style={[styles.timeOptionText, endTime === time && styles.selectedTimeOptionText]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Afternoon/Evening Times (PM) */}
                  <View style={styles.timeSectionHeader}>
                    <Text style={styles.timeSectionHeaderText}>Afternoon/Evening (PM)</Text>
                  </View>
                  {getGroupedTimes().pmTimes.map((time) => (
                    <TouchableOpacity
                      key={`end-${time}`}
                      style={[styles.timeOption, endTime === time && styles.selectedTimeOption]}
                      onPress={() => setEndTime(time)}
                    >
                      <Text style={[styles.timeOptionText, endTime === time && styles.selectedTimeOptionText]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowTimeModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleTimeConfirm}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Shift Dropdown Modal */}
      <Modal
        visible={showShiftModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShiftModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownContent}>
            <Text style={styles.modalTitle}>Select Shift</Text>
            {shiftOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.dropdownOption, schoolForm.shift === option && styles.selectedDropdownOption]}
                onPress={() => handleShiftSelect(option)}
              >
                <Text style={[styles.dropdownOptionText, schoolForm.shift === option && styles.selectedDropdownOptionText]}>
                  {option}
                </Text>
                {schoolForm.shift === option && (
                  <Ionicons name="checkmark" size={20} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* School Dropdown Modal */}
      <Modal
        visible={showSchoolDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSchoolDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownContent}>
            <Text style={styles.modalTitle}>Select School</Text>
            {availableSchools.map((school) => (
              <TouchableOpacity
                key={school.id}
                style={[styles.dropdownOption, studentForm.schoolId === school.id && styles.selectedDropdownOption]}
                onPress={() => handleSchoolSelect(school)}
              >
                <View style={styles.dropdownOptionContent}>
                  <Text style={[styles.dropdownOptionText, studentForm.schoolId === school.id && styles.selectedDropdownOptionText]}>
                    {school.schoolName}
                  </Text>
                  <Text style={[styles.dropdownOptionSubText, studentForm.schoolId === school.id && styles.selectedDropdownOptionText]}>
                    {school.shift}
                  </Text>
                </View>
                {studentForm.schoolId === school.id && (
                  <Ionicons name="checkmark" size={20} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Payment Mode Dropdown Modal */}
      <Modal
        visible={showPaymentModeDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaymentModeDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownContent}>
            <Text style={styles.modalTitle}>Select Payment Mode</Text>
            {paymentModeOptions.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.dropdownOption, studentForm.paymentMode === mode && styles.selectedDropdownOption]}
                onPress={() => handlePaymentModeSelect(mode)}
              >
                <Text style={[styles.dropdownOptionText, studentForm.paymentMode === mode && styles.selectedDropdownOptionText]}>
                  {mode}
                </Text>
                {studentForm.paymentMode === mode && (
                  <Ionicons name="checkmark" size={20} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Payment Period Dropdown Modal */}
      <Modal
        visible={showPaymentPeriodDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaymentPeriodDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownContent}>
            <Text style={styles.modalTitle}>Select Payment Period</Text>
            {paymentPeriodOptions.map((period) => (
              <TouchableOpacity
                key={period}
                style={[styles.dropdownOption, studentForm.paymentPeriod === period && styles.selectedDropdownOption]}
                onPress={() => handlePaymentPeriodSelect(period)}
              >
                <Text style={[styles.dropdownOptionText, studentForm.paymentPeriod === period && styles.selectedDropdownOptionText]}>
                  {period}
                </Text>
                {studentForm.paymentPeriod === period && (
                  <Ionicons name="checkmark" size={20} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledCard: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  disabledText: {
    color: '#bdc3c7',
  },
  lockContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#E74C3C',
    marginLeft: 6,
    fontWeight: '500',
  },
  statusContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  // Form Styles
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2c3e50',
    backgroundColor: '#fff',
  },
  inputWithButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWithButton: {
    flex: 1,
  },
  importButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#BDC3C7',
  },
  // Selector Styles
  selectorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 16,
  },
  selectorText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    color: '#95A5A6',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Time Picker Styles
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  timeSection: {
    flex: 1,
    marginHorizontal: 8,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 12,
  },
  timeScroll: {
    maxHeight: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 8,
  },
  timeOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  selectedTimeOption: {
    backgroundColor: '#3498DB',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedTimeOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Time Section Headers
  timeSectionHeader: {
    backgroundColor: '#E8F4FD',
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498DB',
  },
  timeSectionHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2980B9',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#95A5A6',
    padding: 14,
    borderRadius: 12,
    marginRight: 8,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#3498DB',
    padding: 14,
    borderRadius: 12,
    marginLeft: 8,
  },
  modalCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Dropdown Styles
  dropdownContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  selectedDropdownOption: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#000',
  },
  dropdownOptionContent: {
    flex: 1,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  dropdownOptionSubText: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 4,
  },
  selectedDropdownOptionText: {
    color: '#000',
    fontWeight: '600',
  },
  // List View Styles
  listViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton2: {
    padding: 8,
  },
  addNewButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  addNewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  schoolCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  schoolCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  schoolShift: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  schoolStats: {
    alignItems: 'flex-end',
    gap: 8,
  },
  studentCount: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  schoolDetails: {
    padding: 16,
    backgroundColor: '#fff',
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: '#7F8C8D',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  studentsSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
  },
  addStudentBtn: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    borderRadius: 8,
    marginBottom: 4,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  studentPhone: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  studentPayment: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentMode: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyListText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyListButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyListButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CreateScreen;