import { initDb, ActivityLog, User } from './models/index.ts';

async function test() {
  await initDb();
  try {
    const admin = await User.findOne();
    if (!admin) {
      console.log('No user found');
      return;
    }
    const log = await ActivityLog.create({
      entity_type: 'Task',
      entity_id: 9999,
      user_id: admin.id,
      action: 'created',
      new_status: 'Todo'
    });
    console.log('SUCCESS: created log:', log.toJSON());
    await log.destroy(); // cleanup
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit();
}
test();
