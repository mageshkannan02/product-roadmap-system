import jwt from 'jsonwebtoken';

async function test() {
  const token = jwt.sign({ id: 1, email: 'admin@example.com', role: 'Admin' }, 'super-secret-key-for-dev', { expiresIn: '1h' });
  
  console.log('--- UPDATING TASK 1 ---');
  const updateRes = await fetch('http://localhost:5000/api/tasks/1', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'Done', description: 'Testing the description feature!' })
  });
  
  if (updateRes.ok) {
    console.log('Task Updated');
    
    console.log('--- FETCHING LOGS ---');
    const logsRes = await fetch(`http://localhost:5000/api/logs/Task/1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const logs = await logsRes.json();
    console.log(`Latest log:`, JSON.stringify(logs[0], null, 2));
  } else {
    console.error('Update Failed', await updateRes.text());
  }
}
test();
