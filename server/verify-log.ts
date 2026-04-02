import jwt from 'jsonwebtoken';

async function verify() {
  const token = jwt.sign({ id: 1, email: 'admin@example.com', role: 'Admin' }, 'super-secret-key-for-dev', { expiresIn: '1h' });
  
  console.log('--- SYNCING STATUS ---');
  // 1. Update status
  const updateRes = await fetch('http://localhost:5000/api/features/1', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'Blocked' })
  });
  
  if (updateRes.ok) {
    console.log('Update Successful');
  } else {
    console.error('Update Failed', await updateRes.text());
  }

  // 2. Fetch logs
  const logsRes = await fetch('http://localhost:5000/api/logs/Feature/1', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const logs = await logsRes.json();
  console.log('--- VERIFYING LOGS ---');
  console.log(`Log Count for Feature #1: ${logs.length}`);
  if (logs.length > 0) {
    console.log('LATEST LOG:', JSON.stringify(logs[0], null, 2));
  }
}

verify();
