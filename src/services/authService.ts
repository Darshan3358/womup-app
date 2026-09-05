import { UserProfile, Address } from '../types';

export const generateRandomIndianMobile = (): string => {
  const prefixes = ['98', '97', '99', '96', '95', '91', '89', '88', '70'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const rest = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${prefix}${rest}`.slice(0, 10);
};

const defaultRandomPhone = generateRandomIndianMobile();

export const INITIAL_ADDRESS: Address = {
  id: 'addr_1',
  type: 'Home',
  fullName: 'Rahul Sharma',
  phoneNumber: `+91 ${defaultRandomPhone.slice(0, 5)} ${defaultRandomPhone.slice(5)}`,
  houseFlat: 'B-402, Shivalik Heights',
  areaLandmark: 'Opp. ISKCON Temple, SG Highway',
  city: 'Ahmedabad, Gujarat',
  pincode: '380015',
  isDefault: true,
};

export const INITIAL_USER: UserProfile = {
  fullName: 'Rahul Sharma',
  phoneNumber: defaultRandomPhone,
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
