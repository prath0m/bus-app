// API Configuration
// No hosted backend yet — the app talks to the Express server running on
// your Mac (see backend/), so the phone must be on the same Wi-Fi network
// and backend/server.js must be running. Update this IP if your Mac's LAN
// address changes (check with `ipconfig getifaddr en0`).
const API_BASE_URL = 'http://192.168.1.2:3001/api';

// API Response Interface
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// User Interfaces
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  busRoute?: string;
  role: 'owner' | 'parent' | 'admin';
  lastLogin?: string;
  createdAt: string;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  busRoute?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// School Interfaces
export interface School {
  id: string;
  schoolName: string;
  schoolAddress: string;
  timing: string;
  shift: 'Morning' | 'Afternoon' | 'Evening' | 'Full Day';
  formattedTiming?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchoolData {
  schoolName: string;
  schoolAddress: string;
  timing: string;
  shift: string;
  userId: string;
}

export interface SchoolResponse {
  school: School;
}

export interface SchoolsResponse {
  count: number;
  schools: School[];
}

export interface CheckSchoolsResponse {
  hasSchools: boolean;
  schoolCount: number;
}

// Student Interfaces
export interface Student {
  id: string;
  name: string;
  dateOfJoining: string;
  formattedJoiningDate?: string;
  school: School;
  contactNumber: string;
  paymentMode: 'Cash' | 'Online';
  paymentPeriod: 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Yearly' | 'Custom';
  totalYearlyPayment: number;
  paymentAmount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentData {
  name: string;
  dateOfJoining?: string;
  schoolId: string;
  contactNumber: string;
  paymentMode: string;
  paymentPeriod: string;
  totalYearlyPayment: number;
  userId: string;
}

export interface StudentResponse {
  student: Student;
}

export interface StudentsResponse {
  count: number;
  students: Student[];
}

export interface CheckStudentsResponse {
  hasStudents: boolean;
  studentCount: number;
}

// Payment Interfaces
export type PaymentStatus = 'Paid' | 'Due' | 'Overdue';

export interface Payment {
  id: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
    contactNumber: string;
    school?: { id: string; schoolName: string };
  };
  year: number;
  month: number;
  monthName: string;
  amountDue: number;
  amountPaid: number;
  status: PaymentStatus;
  dueDate: string;
  paidDate?: string;
  paymentMode?: 'Cash' | 'Online';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDashboard {
  year: number;
  month: number;
  monthName: string;
  totalStudents: number;
  paidCount: number;
  dueCount: number;
  overdueCount: number;
  totalCollected: number;
  totalPending: number;
  students: Payment[];
}

export interface MarkPaidData {
  amountPaid?: number;
  paymentMode?: 'Cash' | 'Online';
  paidDate?: string;
}

// Storage helpers for token management
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// HTTP helper function
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const token = await getAuthToken();
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    
    console.log('apiRequest: Making request to:', fullUrl);
    console.log('apiRequest: Token exists:', !!token);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(fullUrl, config);
    console.log('apiRequest: Response status:', response.status);
    console.log('apiRequest: Response ok:', response.ok);
    
    const data = await response.json();
    console.log('apiRequest: Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      // Extract detailed error message
      const errorMessage = data.message || data.error || 'Something went wrong';
      const errorDetails = data.details || data.errors || [];
      const fullErrorMessage = errorDetails.length > 0 
        ? `${errorMessage}: ${errorDetails.join(', ')}`
        : errorMessage;
      throw new Error(fullErrorMessage);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  // Sign up new user
  signup: async (userData: SignupData): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        mobileNumber: userData.mobileNumber,
        password: userData.password,
        busRoute: userData.busRoute,
      }),
    });

    if (response.success && response.data) {
      // Store token automatically
      await setAuthToken(response.data.token);
      return response.data;
    }

    throw new Error(response.message || 'Signup failed');
  },

  // Login user
  login: async (credentials: LoginData): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      // Store token automatically
      await setAuthToken(response.data.token);
      return response.data;
    }

    throw new Error(response.message || 'Login failed');
  },

  // Verify token
  verifyToken: async (): Promise<User> => {
    const response = await apiRequest<{ user: User }>('/auth/verify', {
      method: 'POST',
    });

    if (response.success && response.data) {
      return response.data.user;
    }

    throw new Error(response.message || 'Token verification failed');
  },

  // Logout user
  logout: async (): Promise<void> => {
    await removeAuthToken();
  },
};

// User API functions
export const userAPI = {
  // Get user profile
  getProfile: async (): Promise<User> => {
    const response = await apiRequest<{ user: User }>('/users/profile');

    if (response.success && response.data) {
      return response.data.user;
    }

    throw new Error(response.message || 'Failed to get profile');
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiRequest<{ user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      return response.data.user;
    }

    throw new Error(response.message || 'Failed to update profile');
  },
};

// School API functions
export const schoolAPI = {
  // Create a new school
  createSchool: async (schoolData: CreateSchoolData): Promise<School> => {
    const response = await apiRequest<{school: School}>('/schools/create', {
      method: 'POST',
      body: JSON.stringify(schoolData),
    });

    if (response.success && response.data) {
      return response.data.school;
    }

    throw new Error(response.message || 'Failed to create school');
  },

  // Get all schools for a user
  getUserSchools: async (userId: string): Promise<School[]> => {
    const response = await apiRequest<{count: number, schools: School[]}>(`/schools/user/${userId}`);

    if (response.success && response.data) {
      return response.data.schools;
    }

    throw new Error(response.message || 'Failed to fetch schools');
  },

  // Get a specific school by ID
  getSchool: async (schoolId: string): Promise<School> => {
    const response = await apiRequest<{school: School}>(`/schools/${schoolId}`);

    if (response.success && response.data) {
      return response.data.school;
    }

    throw new Error(response.message || 'Failed to fetch school');
  },

  // Update a school
  updateSchool: async (schoolId: string, schoolData: Partial<CreateSchoolData>): Promise<School> => {
    const response = await apiRequest<{school: School}>(`/schools/${schoolId}`, {
      method: 'PUT',
      body: JSON.stringify(schoolData),
    });

    if (response.success && response.data) {
      return response.data.school;
    }

    throw new Error(response.message || 'Failed to update school');
  },

  // Delete a school
  deleteSchool: async (schoolId: string): Promise<void> => {
    const response = await apiRequest(`/schools/${schoolId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete school');
    }
  },

  // Check if user has any schools
  checkUserSchools: async (userId: string): Promise<CheckSchoolsResponse> => {
    try {
      console.log('API: Calling checkUserSchools for userId:', userId);
      console.log('API: Full URL will be:', `${API_BASE_URL}/schools/check/${userId}`);
      
      const response = await apiRequest<any>(`/schools/check/${userId}`);
      
      console.log('API: Raw response from checkUserSchools:', JSON.stringify(response, null, 2));
      console.log('API: response.success:', response.success);
      console.log('API: response.data:', response.data);
      console.log('API: Type of response.data:', typeof response.data);

      // Check if response has the expected structure
      if (response && response.success) {
        if (response.data && typeof response.data.hasSchools !== 'undefined') {
          console.log('API: Found data.hasSchools, returning:', response.data);
          return response.data;
        } else if (typeof (response as any).hasSchools !== 'undefined') {
          // In case the backend returns data directly without nesting
          console.log('API: Found direct hasSchools, returning:', {
            hasSchools: (response as any).hasSchools,
            schoolCount: (response as any).schoolCount || 0
          });
          return {
            hasSchools: (response as any).hasSchools,
            schoolCount: (response as any).schoolCount || 0
          };
        }
      }

      throw new Error(response?.message || 'Invalid response structure');
    } catch (error) {
      console.error('API: Error in checkUserSchools:', error);
      throw error;
    }
  },
};

// Student API functions
export const studentAPI = {
  // Create a new student
  createStudent: async (studentData: CreateStudentData): Promise<Student> => {
    const response = await apiRequest<{student: Student}>('/students/create', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });

    if (response.success && response.data) {
      return response.data.student;
    }

    throw new Error(response.message || 'Failed to create student');
  },

  // Get all students for a user
  getUserStudents: async (userId: string): Promise<Student[]> => {
    const response = await apiRequest<{count: number, students: Student[]}>(`/students/user/${userId}`);

    if (response.success && response.data) {
      return response.data.students;
    }

    throw new Error(response.message || 'Failed to fetch students');
  },

  // Get students by school
  getSchoolStudents: async (schoolId: string): Promise<Student[]> => {
    const response = await apiRequest<{count: number, students: Student[]}>(`/students/school/${schoolId}`);

    if (response.success && response.data) {
      return response.data.students;
    }

    throw new Error(response.message || 'Failed to fetch school students');
  },

  // Get a specific student by ID
  getStudent: async (studentId: string): Promise<Student> => {
    const response = await apiRequest<{student: Student}>(`/students/${studentId}`);

    if (response.success && response.data) {
      return response.data.student;
    }

    throw new Error(response.message || 'Failed to fetch student');
  },

  // Update a student
  updateStudent: async (studentId: string, studentData: Partial<CreateStudentData>): Promise<Student> => {
    const response = await apiRequest<{student: Student}>(`/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });

    if (response.success && response.data) {
      return response.data.student;
    }

    throw new Error(response.message || 'Failed to update student');
  },

  // Delete a student (soft delete)
  deleteStudent: async (studentId: string): Promise<void> => {
    const response = await apiRequest(`/students/${studentId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete student');
    }
  },

  // Check if user has any students
  checkUserStudents: async (userId: string): Promise<CheckStudentsResponse> => {
    const response = await apiRequest<CheckStudentsResponse>(`/students/check/${userId}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to check user students');
  },
};

// Payment API functions
export const paymentAPI = {
  // Get the payment dashboard summary for a given month (defaults to current month)
  getDashboard: async (userId: string, year?: number, month?: number): Promise<PaymentDashboard> => {
    const query = year && month ? `?year=${year}&month=${month}` : '';
    const response = await apiRequest<PaymentDashboard>(`/payments/dashboard/${userId}${query}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to fetch payment dashboard');
  },

  // Get the most recently paid payments across all students (recent activity feed)
  getRecent: async (userId: string, limit = 5): Promise<Payment[]> => {
    const response = await apiRequest<{ payments: Payment[] }>(`/payments/recent/${userId}?limit=${limit}`);

    if (response.success && response.data) {
      return response.data.payments;
    }

    throw new Error(response.message || 'Failed to fetch recent payments');
  },

  // Get the full monthly payment ledger for a student
  getStudentHistory: async (studentId: string): Promise<Payment[]> => {
    const response = await apiRequest<{ count: number; payments: Payment[] }>(`/payments/student/${studentId}`);

    if (response.success && response.data) {
      return response.data.payments;
    }

    throw new Error(response.message || 'Failed to fetch payment history');
  },

  // Mark a single month's payment as paid
  markPaid: async (paymentId: string, data: MarkPaidData = {}): Promise<Payment> => {
    const response = await apiRequest<{ payment: Payment }>(`/payments/${paymentId}/mark-paid`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      return response.data.payment;
    }

    throw new Error(response.message || 'Failed to mark payment as paid');
  },

  // Mark several months as paid at once (advance / lump-sum payments)
  bulkMarkPaid: async (paymentIds: string[], data: MarkPaidData = {}): Promise<number> => {
    const response = await apiRequest<{ updatedCount: number }>('/payments/bulk-mark-paid', {
      method: 'POST',
      body: JSON.stringify({ paymentIds, ...data }),
    });

    if (response.success && response.data) {
      return response.data.updatedCount;
    }

    throw new Error(response.message || 'Failed to mark payments as paid');
  },

  // Create (or update) a run of monthly payment rows for a student, splitting
  // one total amount evenly across them — for a custom enrollment period
  // (e.g. joining mid-year for just a few months).
  createTerm: async (data: {
    studentId: string;
    startYear: number;
    startMonth: number;
    durationMonths: number;
    totalAmount: number;
  }): Promise<number> => {
    const response = await apiRequest<{ count: number }>('/payments/create-term', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      return response.data.count;
    }

    throw new Error(response.message || 'Failed to create payment term');
  },
};

export default {
  authAPI,
  userAPI,
  schoolAPI,
  studentAPI,
  paymentAPI,
};