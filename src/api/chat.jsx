const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const chatAPI = {
  // Send message to chat endpoint
  sendMessage: async (message, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get chat history
  getChatHistory: async (userId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/history/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  }
};

// Speech-to-Text utility using Web Speech API
export const speechToText = {
  isSupported: () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  },

  startListening: (onResult, onError, onEnd) => {
    if (!speechToText.isSupported()) {
      onError('Speech recognition is not supported in this browser');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event) => {
      onError(event.error);
    };

    recognition.onend = () => {
      onEnd();
    };

    recognition.start();
    return recognition;
  },

  stopListening: (recognition) => {
    if (recognition) {
      recognition.stop();
    }
  }
};

// Text-to-Speech utility
export const textToSpeech = {
  isSupported: () => {
    return 'speechSynthesis' in window;
  },

  speak: (text, onStart, onEnd, onError) => {
    if (!textToSpeech.isSupported()) {
      onError('Speech synthesis is not supported in this browser');
      return null;
    }

    // Stop any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => onStart();
    utterance.onend = () => onEnd();
    utterance.onerror = (event) => onError(event.error);

    speechSynthesis.speak(utterance);
    return utterance;
  },

  stop: () => {
    if (textToSpeech.isSupported()) {
      speechSynthesis.cancel();
    }
  }
};
