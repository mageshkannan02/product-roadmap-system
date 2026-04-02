import { Task, initDb } from './models/index';

async function listAll() {
  await initDb();
  const tasks = await Task.findAll();
  console.log(JSON.stringify(tasks.map(t => ({ 
    id: t.id, 
    title: t.title, 
    deadline: t.deadline, 
    status: t.status,
    assigned_user_id: t.assigned_user_id 
  })), null, 2));
}

listAll();
