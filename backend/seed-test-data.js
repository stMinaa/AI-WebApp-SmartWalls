/**
 * Test Data Seed Script
 * Creates 2-3 examples for each issue state (assigned, in-progress, resolved)
 * Run with: node seed-test-data.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Building = require('./models/Building');
const Apartment = require('./models/Apartment');
const Issue = require('./models/Issue');
const Notice = require('./models/Notice');
const Poll = require('./models/Poll');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/housing-management';

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing test data (optional - comment out to keep existing data)
    // await User.deleteMany({});
    // await Building.deleteMany({});
    // await Apartment.deleteMany({});
    // await Issue.deleteMany({});
    // await Notice.deleteMany({});
    // await Poll.deleteMany({});
    // console.log('Cleared existing data');

    // 1. Create Director
    const director = await User.create({
      username: 'director_test',
      email: 'director@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'director',
      firstName: 'John',
      lastName: 'Director',
      approved: true
    });
    console.log('✓ Created director');

    // 2. Create Manager
    const manager = await User.create({
      username: 'manager_test',
      email: 'manager@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'manager',
      firstName: 'Sarah',
      lastName: 'Manager',
      company: 'Test Management Co',
      approved: true
    });
    console.log('✓ Created manager');

    // 3. Create 2 Associates
    const associate1 = await User.create({
      username: 'associate1_test',
      email: 'associate1@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'associate',
      firstName: 'Mike',
      lastName: 'Plumber',
      company: 'Mike\'s Plumbing',
      approved: true
    });

    const associate2 = await User.create({
      username: 'associate2_test',
      email: 'associate2@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'associate',
      firstName: 'Lisa',
      lastName: 'Electrician',
      company: 'Lisa\'s Electric',
      approved: true
    });
    console.log('✓ Created 2 associates');

    // 4. Create 2 Tenants
    const tenant1 = await User.create({
      username: 'tenant1_test',
      email: 'tenant1@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'tenant',
      firstName: 'Emma',
      lastName: 'Johnson',
      approved: true
    });

    const tenant2 = await User.create({
      username: 'tenant2_test',
      email: 'tenant2@test.com',
      password: await bcrypt.hash('password123', 10),
      role: 'tenant',
      firstName: 'David',
      lastName: 'Smith',
      approved: true
    });
    console.log('✓ Created 2 tenants');

    // 5. Create Building
    const building = await Building.create({
      name: 'Sunset Apartments',
      address: '123 Main Street, Suite 100',
      manager: manager._id
    });
    console.log('✓ Created building');

    // 6. Create 2 Apartments
    const apt1 = await Apartment.create({
      building: building._id,
      unitNumber: '101',
      address: '123 Main Street, Apt 101',
      numPeople: 2,
      tenant: tenant1._id
    });

    const apt2 = await Apartment.create({
      building: building._id,
      unitNumber: '202',
      address: '123 Main Street, Apt 202',
      numPeople: 3,
      tenant: tenant2._id
    });
    console.log('✓ Created 2 apartments');

    // 7. Create Issues - 2-3 for each state (assigned, in-progress, resolved)
    
    // ASSIGNED issues (newly assigned, not started)
    const assignedIssues = await Issue.create([
      {
        apartment: apt1._id,
        building: building._id,
        createdBy: tenant1._id,
        title: 'Leaking kitchen faucet',
        description: 'The kitchen faucet has been dripping constantly for 2 days. Wasting a lot of water.',
        priority: 'high',
        status: 'assigned',
        assignedTo: associate1._id
      },
      {
        apartment: apt2._id,
        building: building._id,
        createdBy: tenant2._id,
        title: 'Broken window lock',
        description: 'Window lock in bedroom won\'t close properly. Security concern.',
        priority: 'medium',
        status: 'assigned',
        assignedTo: associate2._id
      },
      {
        apartment: apt1._id,
        building: building._id,
        createdBy: tenant1._id,
        title: 'Bathroom light fixture flickering',
        description: 'Light fixture in main bathroom flickers intermittently.',
        priority: 'low',
        status: 'assigned',
        assignedTo: associate2._id
      }
    ]);
    console.log('✓ Created 3 assigned issues');

    // IN-PROGRESS issues (associate accepted and working on)
    const inProgressIssues = await Issue.create([
      {
        apartment: apt2._id,
        building: building._id,
        createdBy: tenant2._id,
        title: 'Clogged bathroom drain',
        description: 'Shower drain is completely blocked. Water pools during showers.',
        priority: 'high',
        status: 'in-progress',
        assignedTo: associate1._id,
        cost: 150
      },
      {
        apartment: apt1._id,
        building: building._id,
        createdBy: tenant1._id,
        title: 'Squeaky door hinges',
        description: 'Front door hinges make loud squeaking noise. Very annoying.',
        priority: 'low',
        status: 'in-progress',
        assignedTo: associate1._id,
        cost: 50
      }
    ]);
    console.log('✓ Created 2 in-progress issues');

    // RESOLVED issues (completed work)
    const resolvedIssues = await Issue.create([
      {
        apartment: apt1._id,
        building: building._id,
        createdBy: tenant1._id,
        title: 'Replace air filter',
        description: 'HVAC air filter needs replacement. Been 6 months.',
        priority: 'medium',
        status: 'resolved',
        assignedTo: associate1._id,
        cost: 30,
        completionNotes: 'Replaced air filter with high-efficiency model. System running smoothly.',
        completionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        apartment: apt2._id,
        building: building._id,
        createdBy: tenant2._id,
        title: 'Fix loose cabinet door',
        description: 'Kitchen cabinet door is loose and falling off hinges.',
        priority: 'low',
        status: 'resolved',
        assignedTo: associate2._id,
        cost: 40,
        completionNotes: 'Tightened hinges and replaced one broken screw. Door secure now.',
        completionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        apartment: apt1._id,
        building: building._id,
        createdBy: tenant1._id,
        title: 'Thermostat not working',
        description: 'Thermostat display is blank. Can\'t control temperature.',
        priority: 'high',
        status: 'resolved',
        assignedTo: associate2._id,
        cost: 200,
        completionNotes: 'Replaced faulty thermostat with programmable smart thermostat. Tested heating and cooling.',
        completionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      }
    ]);
    console.log('✓ Created 3 resolved issues');

    // 8. Create sample notices
    await Notice.create([
      {
        building: building._id,
        content: 'Building maintenance scheduled for next Saturday 9am-12pm. Water will be shut off briefly.',
        author: manager._id,
        authorRole: 'manager',
        authorName: manager.username
      },
      {
        building: building._id,
        content: 'Reminder: Trash pickup is every Tuesday and Friday morning. Please have bins out by 7am.',
        author: manager._id,
        authorRole: 'manager',
        authorName: manager.username
      }
    ]);
    console.log('✓ Created 2 notices');

    // 9. Create sample poll
    const poll = await Poll.create({
      building: building._id,
      question: 'What amenity should we add to the building?',
      options: ['Gym', 'Pool', 'Rooftop Garden', 'Pet Washing Station'],
      votes: [
        { tenant: tenant1._id, option: 'Gym' },
        { tenant: tenant2._id, option: 'Rooftop Garden' }
      ],
      createdBy: manager._id
    });
    console.log('✓ Created 1 poll with 2 votes');

    console.log('\n=== TEST DATA SUMMARY ===');
    console.log('Director: director_test / password123');
    console.log('Manager: manager_test / password123');
    console.log('Associate 1: associate1_test / password123 (Mike\'s Plumbing)');
    console.log('Associate 2: associate2_test / password123 (Lisa\'s Electric)');
    console.log('Tenant 1: tenant1_test / password123 (Apt 101)');
    console.log('Tenant 2: tenant2_test / password123 (Apt 202)');
    console.log('\nBuilding: Sunset Apartments');
    console.log('Issues: 3 assigned, 2 in-progress, 3 resolved');
    console.log('Notices: 2');
    console.log('Polls: 1 active with 2 votes');
    console.log('\n✓ All test data created successfully!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding data:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedData();
