import { sequelize, ActivityLog } from './models/index.ts';

async function verify() {
  try {
    const logs = await ActivityLog.findAll({ where: { action: 'created' } });
    console.log(`Found ${logs.length} created logs in DB.`);
    
    // Check enum definition
    const [results] = await sequelize.query("SHOW COLUMNS FROM ActivityLogs LIKE 'action'");
    console.log('Column definition:', results);
  } catch (err) {
    console.error(err);
  }
  process.exit();
}
verify();
