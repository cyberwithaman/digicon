import Constants from 'expo-constants';

// Default fallback URLs
let API_URL = 'http://46.202.164.133:8090/api';
let UPLOAD_URL = 'http://46.202.164.133:8090/api/media';

try {
  // Get the configuration from Expo
  const expoExtra = Constants?.expoConfig?.extra || {};
  
  // Override with values from app.json if available
  if (expoExtra.API_URL) {
    API_URL = expoExtra.API_URL;
  }
  
  if (expoExtra.UPLOAD_URL) {
    UPLOAD_URL = expoExtra.UPLOAD_URL;
  }
  
  console.log('Using API URL:', API_URL);
  console.log('Using UPLOAD URL:', UPLOAD_URL);
} catch (error) {
  console.error('Error setting API constants:', error);
}

// Export the variables
export { API_URL, UPLOAD_URL };
