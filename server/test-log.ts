import { initDb, ActivityLog, User } from './models/index.ts';

async function test() {
  await initDb();
  
  try {
    const admin = await User.findOne({ where: { role: 'Admin' } });
    if (!admin) {
      console.log('No admin found');
      return;
    }

    console.log('Attempting to create log for admin', admin.id);
    const log = await ActivityLog.create({
      entity_type: 'Feature',
      entity_id: 1,
      user_id: admin.id,
      old_status: 'Planned',
      new_status: 'In Progress'
    });
    console.log('Successfully created log:', log.toJSON());

    const fetchLogs = await ActivityLog.findAll();
    console.log('Total logs in DB:', fetchLogs.length);
  } catch (err) {
    console.error('Failed to create log:', err);
  }
}

test();
