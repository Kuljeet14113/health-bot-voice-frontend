const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const symptomsAPI = {
  // Get all symptoms
  getAllSymptoms: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/symptoms`);
      if (!response.ok) {
        throw new Error('Failed to fetch symptoms');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching symptoms:', error);
      throw error;
    }
  },

  // Search symptoms by keyword with spell checking
  searchSymptoms: async (query) => {
    try {
      const response = await fetch(`${API_BASE_URL}/symptoms/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search symptoms');
      }
      const result = await response.json();
      
      // For backward compatibility, if the response has the new structure, return matches
      // Otherwise return the response as is
      if (result.matches !== undefined) {
        return {
          matches: result.matches,
          spellSuggestions: result.spellSuggestions,
          hasSpellingSuggestions: result.hasSpellingSuggestions,
          originalQuery: result.originalQuery
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error searching symptoms:', error);
      throw error;
    }
  },

  // Get advice for a specific symptom
  getSymptomAdvice: async (symptom) => {
    try {
      const response = await fetch(`${API_BASE_URL}/symptoms/advice/${encodeURIComponent(symptom)}`);
      if (!response.ok) {
        throw new Error('Failed to get symptom advice');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting symptom advice:', error);
      throw error;
    }
  },

  // Get spell suggestions for a symptom query
  getSpellSuggestions: async (query) => {
    try {
      const response = await fetch(`${API_BASE_URL}/symptoms/suggestions?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to get spell suggestions');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting spell suggestions:', error);
      throw error;
    }
  }
};

export const generateProfessionalAdvice = async (symptomQuery) => {
  try {
    const response = await fetch(`${API_BASE_URL}/symptoms/gemini/advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptomQuery })
    });
    if (!response.ok) {
      throw new Error('Failed to generate advice');
    }
    return await response.json();
  } catch (error) {
    console.error('Error generating professional advice:', error);
    throw error;
  }
};




