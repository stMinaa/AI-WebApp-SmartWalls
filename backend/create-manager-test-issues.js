const mongoose = require('mongoose');
const User = require('./models/User');
const Issue = require('./models/Issue');
const Building = require('./models/Building');
const Apartment = require('./models/Apartment');

async function createManagerTestIssues() {
  try {
    await mongoose.connect("mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0");
    console.log('✅ Connected to MongoDB');

    // Find the "upravnik" user and their buildings
    const manager = await User.findOne({ username: 'upravnik' });
    if (!manager) {
      console.log('❌ User "upravnik" not found');
      return;
    }

    console.log(`📋 Manager found: ${manager.firstName} ${manager.lastName} (${manager.username})`);

    // Find buildings managed by this user
    const buildings = await Building.find({ manager: manager._id });
    console.log(`🏢 Buildings managed: ${buildings.length}`);
    
    if (buildings.length === 0) {
      console.log('❌ No buildings found for this manager');
      return;
    }

    // For each building, find some apartments and create test issues
    for (const building of buildings) {
      console.log(`\n🏢 Processing building: ${building.name || building.address}`);
      
      // Find apartments in this building
      const apartments = await Apartment.find({ building: building._id }).limit(3);
      console.log(`   🏠 Found ${apartments.length} apartments`);

      if (apartments.length === 0) continue;

      // Create 2-3 test issues for this building
      const testIssues = [
        {
          title: 'Pokvarena rasveta u hodniku',
          description: 'Sijalice u hodniku 2. sprata ne rade. Potrebna zamena.',
          priority: 'medium',
          status: 'reported',
          building: building._id,
          apartment: apartments[0]._id,
          tenant: null, // We'll set this later if we find tenants
          createdBy: manager._id, // Add required field
          reportedAt: new Date()
        },
        {
          title: 'Kvar na liftu',
          description: 'Lift se zaustavlja između spratova. Hitno potreban servis.',
          priority: 'high',
          status: 'reported', 
          building: building._id,
          apartment: apartments[1] ? apartments[1]._id : apartments[0]._id,
          tenant: null,
          createdBy: manager._id, // Add required field
          reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          title: 'Curenje vode u podrumu',
          description: 'U podrumu zgrade curi voda iz cevi. Potrebno hitno popraviti.',
          priority: 'high',
          status: 'reported',
          building: building._id, 
          apartment: apartments[2] ? apartments[2]._id : apartments[0]._id,
          tenant: null,
          createdBy: manager._id, // Add required field
          reportedAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        }
      ];

      // Find tenants for these apartments
      for (let i = 0; i < testIssues.length && i < apartments.length; i++) {
        const tenant = await User.findOne({ 
          role: 'tenant', 
          apartment: apartments[i]._id 
        });
        if (tenant) {
          testIssues[i].tenant = tenant._id;
          testIssues[i].createdBy = tenant._id; // Use tenant as creator if available
          console.log(`   👤 Found tenant for apartment ${apartments[i].unitNumber}: ${tenant.firstName} ${tenant.lastName}`);
        }
      }

      // Create the issues
      for (const issueData of testIssues) {
        const existingIssue = await Issue.findOne({
          title: issueData.title,
          building: issueData.building
        });

        if (!existingIssue) {
          const issue = new Issue(issueData);
          await issue.save();
          console.log(`   ✅ Created issue: "${issue.title}"`);
        } else {
          console.log(`   ⚠️  Issue already exists: "${issueData.title}"`);
        }
      }
    }

    console.log('\n🎉 Test issues creation completed!');
    console.log('\n📝 Summary:');
    console.log('- Manager can now see these test issues in "Kvarovi" tab');
    console.log('- Each issue has status "reported" and needs manager triage');
    console.log('- Manager can: reject, forward to director, or assign to associate');

  } catch (error) {
    console.error('❌ Error creating test issues:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

// Run the script
createManagerTestIssues();