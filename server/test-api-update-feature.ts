import jwt from 'jsonwebtoken';

async function test() {
  const token = jwt.sign({ id: 1, email: 'admin@example.com', role: 'Admin' }, 'super-secret-key-for-dev', { expiresIn: '1h' });
  
  console.log('--- UPDATING FEATURE 1 ---');
  // Assuming feature 1 exists
  const updateRes = await fetch('http://localhost:5000/api/features/1', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'Blocked', description: 'Testing the feature description update!' })
  });
  
  if (updateRes.ok) {
    console.log('Feature Updated');
    
    console.log('--- FETCHING LOGS ---');
    const logsRes = await fetch(`http://localhost:5000/api/logs/Feature/1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const logs = await logsRes.json();
    if (logs.length > 0) {
      console.log(`Latest log:`, JSON.stringify(logs[0], null, 2));
    } else {
      console.log('No logs found for Feature 1');
    }
  } else {
    console.error('Update Failed', await updateRes.text());
  }
}
test();
