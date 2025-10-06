import axios from 'axios';

const API_URL = 'http://localhost:3000/api/doctors';

// Doctor registration with file upload
export const registerDoctor = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Doctor registration failed' };
  }
};

// Verify doctor OTP
export const verifyDoctorOTP = async (email, otp) => {
  try {
    const response = await axios.post(`${API_URL}/verify-otp`, {
      email,
      otp
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to verify OTP' };
  }
};

// Doctor login
export const loginDoctor = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

// Get all verified doctors
export const getAllVerifiedDoctors = async () => {
  try {
    const response = await axios.get(`${API_URL}/all`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch doctors' };
  }
};

// Get doctor by ID
export const getDoctorById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch doctor' };
  }
};