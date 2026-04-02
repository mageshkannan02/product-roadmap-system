import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testAI() {
  try {
    // Note: I don't have a real token here easily, but I can test the route exists
    const response = await axios.post(`${API_BASE}/ai/chat`, { message: 'hi' });
    console.log('Response:', response.data);
  } catch (error: any) {
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
  }
}

testAI();
