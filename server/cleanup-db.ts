import { sequelize } from './models/index.ts';

async function cleanup() {
  try {
    console.log('Fetching indexes for Users table...');
    const [results] = await sequelize.query('SHOW INDEX FROM Users');
    console.log(`Found ${results.length} indexes.`);

    // Find custom unique indexes on 'email' (usually email, email_2, email_3, etc.)
    const emailIndexes = results.filter((idx: any) => idx.Column_name === 'email' && idx.Key_name !== 'PRIMARY');
    console.log(`Found ${emailIndexes.length} non-primary indexes on 'email' column.`);

    if (emailIndexes.length > 1) {
      console.log('Dropping redundant indexes...');
      // Keep only one unique index, drop the rest
      // Note: MySQL requires 'ALTER TABLE Users DROP INDEX index_name'
      for (let i = 1; i < emailIndexes.length; i++) {
        const indexName = emailIndexes[i].Key_name;
        console.log(`Dropping index: ${indexName}`);
        await sequelize.query(`ALTER TABLE Users DROP INDEX \`${indexName}\``);
      }
      console.log('Redundant indexes removed successfully!');
    } else {
      console.log('No redundant indexes found.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
}

cleanup();
