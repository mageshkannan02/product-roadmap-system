import { Task, initDb } from './models/index';
import * as fs from 'fs';

async function dump() {
  try {
    await initDb();
    const tasks = await Task.findAll();
    fs.writeFileSync('tasks_analysis.json', JSON.stringify(tasks, null, 2));
    console.log('Dumped ' + tasks.length + ' tasks to tasks_analysis.json');
  } catch (err) {
    console.error(err);
  }
}

dump();
