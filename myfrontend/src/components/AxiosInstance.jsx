import axios from 'axios';

const AxiosInstance = axios.create({
      baseURL: 'http://localhost:8000', // Your API base URL
      timeout: 120000, // Request timeout in milliseconds
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true
});


export default AxiosInstance;