const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTeamMembers() {
  try {
    console.log('🔍 Checking team members and their linked users...');
    
    const result = await pool.query(`
      SELECT tm.id, tm.name, tm.user_id, tm.social_email, u.username, u.email, u.id as user_table_id
      FROM team_members tm
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE tm.is_active = true
      ORDER BY tm.is_founder DESC, tm.display_order ASC
    `);
    
    console.log('\n📊 Team Members Status:');
    result.rows.forEach(member => {
      console.log(`${member.name} (ID: ${member.id}):`);
      console.log(`  - Team Member user_id: ${member.user_id || 'NULL'}`);
      console.log(`  - Social Email: ${member.social_email || 'NULL'}`);
      console.log(`  - Linked User ID: ${member.user_table_id || 'NULL'}`);
      console.log(`  - Username: ${member.username || 'NULL'}`);
      console.log(`  - User Email: ${member.email || 'NULL'}`);
      console.log('');
    });
    
    // Check for users with sam in username
    const samResult = await pool.query(`
      SELECT * FROM users WHERE username ILIKE '%sam%'
    `);
    
    console.log('\n🔍 Users with sam in username:');
    samResult.rows.forEach(user => {
      console.log(`- ${user.username} (ID: ${user.id}, Email: ${user.email})`);
    });
    
    // Check for users with samthibault28@gmail.com
    const emailResult = await pool.query(`
      SELECT * FROM users WHERE email = 'samthibault28@gmail.com'
    `);
    
    console.log('\n🔍 Users with samthibault28@gmail.com:');
    emailResult.rows.forEach(user => {
      console.log(`- ${user.username} (ID: ${user.id}, Email: ${user.email})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkTeamMembers();
