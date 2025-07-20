import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('Testing login functionality...');
    
    // Test with the credentials from the error logs
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
    
    const loginData = await loginResponse.text();
    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', loginData);
    
    // Also try creating a new user
    console.log('\n--- Testing user registration ---');
    const registerResponse = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser123',
        email: 'test123@example.com',
        password: 'test123456'
      })
    });
    
    const registerData = await registerResponse.text();
    console.log('Register response status:', registerResponse.status);
    console.log('Register response:', registerData);
    
    // Test login with new user
    if (registerResponse.status === 201) {
      console.log('\n--- Testing login with new user ---');
      const newLoginResponse = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test123@example.com',
          password: 'test123456'
        })
      });
      
      const newLoginData = await newLoginResponse.text();
      console.log('New user login status:', newLoginResponse.status);
      console.log('New user login response:', newLoginData);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLogin(); 