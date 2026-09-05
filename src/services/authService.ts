import { UserProfile, Address } from '../types';

export const INITIAL_ADDRESS: Address = {
  id: 'addr_1',
  type: 'Home',
  fullName: 'Rahul Sharma',
  phoneNumber: '+91 98765 43210',
  houseFlat: 'B-402, Shivalik Heights',
  areaLandmark: 'Opp. ISKCON Temple, SG Highway',
  city: 'Ahmedabad, Gujarat',
  pincode: '380015',
  isDefault: true,
};

export const INITIAL_USER: UserProfile = {
  fullName: 'Rahul Sharma',
  phoneNumber: '9876543210',
  email: 'rahul.sharma@example.com',
  referralCode: 'WORM500',
  shoppingCoins: 2000,
  savedAddresses: [INITIAL_ADDRESS],
};

export const AuthService = {
  simulateSendOtp(mobile: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('1234'); // standard test OTP
      }, 500);
    });
  },

  simulateVerifyOtp(otp: string): boolean {
    return otp === '1234' || otp.length === 4;
  },
};
