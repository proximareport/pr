import { db } from '../db';
import { users } from '../../shared/schema';
import { eq, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';

async function linkTeamMembers() {
  try {
    console.log('🔗 Linking team members to user accounts...');
    
    // Get all team members without user_id
    const teamMembersResult = await db.execute(sql`
      SELECT * FROM team_members 
      WHERE user_id IS NULL AND is_active = true
      ORDER BY is_founder DESC, display_order ASC
    `);
    
    console.log(`Found ${teamMembersResult.rows.length} team members without linked accounts`);
    
    for (const member of teamMembersResult.rows) {
      // Create username from name (lowercase, replace spaces with dots)
      const username = member.name.toLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '');
      
      // Create email from social_email or generate one
      const email = member.social_email || `${username}@proximareport.com`;
      
      // Generate a random password (team members can reset it later)
      const password = Math.random().toString(36).slice(-12);
      const hashedPassword = await bcrypt.hash(password, 10);
      
      try {
        // Create user account
        const [newUser] = await db.insert(users).values({
          username,
          email,
          password: hashedPassword,
          role: member.is_founder ? 'admin' : 'author', // Founders get admin role, others get author role
          membershipTier: 'tier3', // Give them premium membership
          bio: member.bio,
          profilePicture: member.profile_image_url
        }).returning();
        
        // Link team member to user account
        await db.execute(sql`
          UPDATE team_members 
          SET user_id = ${newUser.id}, updated_at = NOW()
          WHERE id = ${member.id}
        `);
        
        console.log(`✅ Linked "${member.name}" to user account "${username}" (ID: ${newUser.id})`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password} (please change this)`);
        console.log('');
        
      } catch (error: any) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⚠️  User account for "${member.name}" already exists, skipping...`);
        } else {
          console.error(`❌ Error creating user for "${member.name}":`, error.message);
        }
      }
    }
    
    console.log('🎉 Team member linking complete!');
    
    // Show final status
    const finalResult = await db.execute(sql`
      SELECT tm.name, tm.role, u.username, u.email
      FROM team_members tm
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE tm.is_active = true
      ORDER BY tm.is_founder DESC, tm.display_order ASC
    `);
    
    console.log('\n📊 Final Status:');
    finalResult.rows.forEach((member: any) => {
      if (member.username) {
        console.log(`✅ ${member.name} (${member.role}) → @${member.username}`);
      } else {
        console.log(`❌ ${member.name} (${member.role}) → No linked account`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error linking team members:', error);
  }
}

// Run the script
linkTeamMembers().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
