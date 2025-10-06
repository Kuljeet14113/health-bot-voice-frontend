import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';

export const signupUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Signup failed' };
  }
};

export const verifyOTP = async (email, otp, password, role = 'patient') => {
  try {
    const response = await axios.post(`${API_URL}/verify-otp`, {
      email,
      otp,
      password,
      role
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to verify OTP' };
  }
};

// Login user
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

// Resend OTP
export const resendOTP = async (email, role = 'patient') => {
  try {
    const response = await axios.post(`${API_URL}/resend-otp`, { email, role });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to resend OTP' };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    const response = await axios.post(`${API_URL}/logout`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Logout failed' };
  }
};