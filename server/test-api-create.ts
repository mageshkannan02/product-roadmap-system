import jwt from 'jsonwebtoken';

async function test() {
  const token = jwt.sign({ id: 1, email: 'admin@example.com', role: 'Admin' }, 'super-secret-key-for-dev', { expiresIn: '1h' });
  
  console.log('--- CREATING TASK ---');
  const createRes = await fetch('http://localhost:5000/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title: 'New Test Task', feature_id: 1 })
  });
  
  if (createRes.ok) {
    const task = await createRes.json();
    console.log('Task Created:', task.id);
    
    console.log('--- FETCHING LOGS ---');
    const logsRes = await fetch(`http://localhost:5000/api/logs/Task/${task.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const logs = await logsRes.json();
    console.log(`Logs for new Task:`, JSON.stringify(logs, null, 2));
  } else {
    console.error('Create Failed', await createRes.text());
  }
}
test();
