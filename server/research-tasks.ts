import { Task, initDb } from './models/index';
import { Op } from 'sequelize';

async function research() {
  await initDb();
  const now = new Date();
  
  const overdueTasks = await Task.findAll({
    where: {
      deadline: { [Op.lt]: now },
      status: { [Op.ne]: 'Done' }
    }
  });

  console.log('--- Overdue Tasks ---');
  console.log(overdueTasks.map(t => ({ 
    id: t.id, 
    title: t.title, 
    deadline: t.deadline, 
    status: t.status,
    assigned_user_id: t.assigned_user_id 
  })));
  
  const allTasks = await Task.findAll();
  console.log('--- All Tasks (Count: ' + allTasks.length + ') ---');
}

research();
