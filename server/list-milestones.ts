import { Milestone, initDb } from './models/index';

async function listMilestones() {
  await initDb();
  const ms = await Milestone.findAll();
  console.log(JSON.stringify(ms, null, 2));
}

listMilestones();
