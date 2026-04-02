import jwt from 'jsonwebtoken';

async function testUpdate() {
  const token = jwt.sign({ id: 1, email: 'admin@example.com', role: 'Admin' }, 'super-secret-key-for-dev', { expiresIn: '1h' });
  
  try {
    const res = await fetch('http://localhost:5000/api/features/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Completed' })
    });
    
    const data = await res.json();
    console.log('Update Response:', JSON.stringify(data, null, 2));

    const logRes = await fetch('http://localhost:5000/api/logs/Feature/1', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const logs = await logRes.json();
    console.log('Logs Response:', JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testUpdate();
