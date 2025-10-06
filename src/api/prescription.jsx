const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const prescriptionAPI = {
  // Generate prescription
  generatePrescription: async (prescriptionData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/prescription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(prescriptionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate prescription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating prescription:', error);
      throw error;
    }
  }
};
