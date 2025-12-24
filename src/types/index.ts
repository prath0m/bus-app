export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'driver' | 'admin';
}

export interface owner {
  id: string;
  name: string;
  grade: string;
  busRoute: string;
  monthlyFee: number;
  parentContact: string;
}