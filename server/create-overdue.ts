import { Task, initDb } from './models/index';

async function createOverdue() {
  await initDb();
  const task = await Task.create({
    title: 'FIX THIS OVERDUE TASK',
    status: 'To Do',
    deadline: new Date('2026-03-31'),
    feature_id: 1,
    assigned_user_id: 1 // Assuming Admin/User1
  });
  console.log('Created overdue task with ID: ' + task.id);
}

createOverdue();
