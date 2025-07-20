const bcrypt = require('bcryptjs');

async function testLogin() {
  try {
    console.log('Testing login functionality...');
    
    // Test if we can connect to the server
    const response = await fetch('http://localhost:5000/api/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Server connection test:', response.status);
    
    // Test login with the problematic credentials
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'Samthibault28@gmail.com',
        password: 'sam345113'
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    const loginData = await loginResponse.text();
    console.log('Login response:', loginData);
    
    // Also try with username if available
    const usernameLoginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'sam',
        password: 'sam345113'
      })
    });
    
    console.log('Username login response status:', usernameLoginResponse.status);
    const usernameLoginData = await usernameLoginResponse.text();
    console.log('Username login response:', usernameLoginData);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLogin(); 