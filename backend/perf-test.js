require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const { performance } = require('perf_hooks');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tennetdb';
const DB_NAME = (process.env.MONGO_DB || '').trim() || undefined; // optional db name override

async function connect() {
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = DB_NAME ? client.db(DB_NAME) : client.db();
  return { client, db };
}

function randPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDateWithin(days) {
  const now = Date.now();
  const delta = randInt(0, days) * 24 * 60 * 60 * 1000 + randInt(0, 86400000);
  return new Date(now - delta);
}

async function seedUsers(db, count = 1000) {
  const col = db.collection('users');
  const roles = ['tenant', 'manager', 'associate', 'director', 'admin'];
  const statuses = ['active', 'pending', 'rejected'];
  const bulk = [];
  for (let i = 0; i < count; i++) {
    const role = randPick(roles);
    const status = randPick(statuses);
    bulk.push({
      username: `user${i}`,
      email: `user${i}@example.com`,
      role,
      status,
      firstName: `Name${i}`,
      lastName: `Last${i}`,
      building: role === 'tenant' ? new ObjectId() : null, // synthetic building ref
      createdAt: randDateWithin(120)
    });
  }
  await col.deleteMany({ username: { $regex: '^user' } });
  await col.insertMany(bulk, { ordered: false });
  return await col.countDocuments();
}

async function seedIssues(db, count = 1000) {
  const col = db.collection('issues');
  const urgencies = ['urgent', 'not urgent'];
  const statuses = ['reported', 'forwarded', 'assigned', 'in progress', 'resolved', 'rejected'];
  const bulk = [];
  for (let i = 0; i < count; i++) {
    const building = new ObjectId();
    bulk.push({
      tenant: new ObjectId(),
      title: `Issue ${i}`,
      description: `Desc ${i}`,
      urgency: randPick(urgencies),
      status: randPick(statuses),
      building, // denormalized building for aggregation test
      createdAt: randDateWithin(90)
    });
  }
  await col.deleteMany({ title: { $regex: '^Issue ' } });
  await col.insertMany(bulk, { ordered: false });
  return await col.countDocuments();
}

async function seedNotices(db, count = 1000) {
  const col = db.collection('notices');
  const buildings = Array.from({ length: 10 }, () => new ObjectId());
  const bulk = [];
  for (let i = 0; i < count; i++) {
    bulk.push({
      building: randPick(buildings),
      content: `Notice ${i}`,
      createdAt: randDateWithin(60)
    });
  }
  await col.deleteMany({ content: { $regex: '^Notice ' } });
  await col.insertMany(bulk, { ordered: false });
  return await col.countDocuments();
}

async function measureMany(label, iterations, queryFn) {
  let total = 0;
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const docs = await queryFn();
    const end = performance.now();
    const ms = Math.round(end - start);
    total += ms;
    console.log(`Query [${label}] over ${Array.isArray(docs) ? docs.length : (docs || 0)} documents took ${ms} ms`);
  }
  return +(total / iterations).toFixed(2);
}

async function run() {
  const { client, db } = await connect();
  try {
    console.log('Seeding test data...');
    const usersCount = await seedUsers(db, 1000);
    const issuesCount = await seedIssues(db, 1000);
    const noticesCount = await seedNotices(db, 1000);
    console.log(`Users: ${usersCount}, Issues: ${issuesCount}, Notices: ${noticesCount}`);

    const issuesCol = db.collection('issues');
    const usersCol = db.collection('users');
    const noticesCol = db.collection('notices');

    const iterations = 50;
    console.log(`\nRunning ${iterations} iterations per query...`);

    const avgUrgent = await measureMany('issues.find({ urgency: "urgent" })', iterations, async () => {
      return await issuesCol.find({ urgency: 'urgent' }).toArray();
    });

    const avgForwarded = await measureMany('issues.find({ status: "forwarded" })', iterations, async () => {
      return await issuesCol.find({ status: 'forwarded' }).toArray();
    });

    const avgActiveAssoc = await measureMany('users.find({ role: "associate", status: "active" })', iterations, async () => {
      return await usersCol.find({ role: 'associate', status: 'active' }).toArray();
    });

    const avgAgg = await measureMany('issues.aggregate(match + group by building)', iterations, async () => {
      return await issuesCol.aggregate([
        { $match: { building: { $exists: true } } },
        { $group: { _id: '$building', count: { $sum: 1 } } }
      ]).toArray();
    });

    // Choose one building id from issues to use for notices query; fallback to first notice's building or null
    let buildingFilter = null;
    try {
      const oneIssue = await issuesCol.find({}).project({ building: 1 }).limit(1).toArray();
      buildingFilter = oneIssue && oneIssue[0] ? oneIssue[0].building : null;
      if (!buildingFilter) {
        const oneNotice = await noticesCol.find({}).project({ building: 1 }).limit(1).toArray();
        buildingFilter = oneNotice && oneNotice[0] ? oneNotice[0].building : null;
      }
    } catch(_) {}

    const avgNoticesSorted = await measureMany('notices.find({ building }).sort({ createdAt: -1 })', iterations, async () => {
      const filter = buildingFilter ? { building: buildingFilter } : {};
      return await noticesCol.find(filter).sort({ createdAt: -1 }).toArray();
    });

    console.log('\nResults (averages in ms):');
    const rows = [
      { documents: issuesCount, query: 'issues.find({ urgency: "urgent" })', avgMs: avgUrgent },
      { documents: issuesCount, query: 'issues.find({ status: "forwarded" })', avgMs: avgForwarded },
      { documents: usersCount, query: 'users.find({ role: "associate", status: "active" })', avgMs: avgActiveAssoc },
      { documents: issuesCount, query: 'issues.aggregate(match + group by building)', avgMs: avgAgg },
      { documents: noticesCount, query: 'notices.find({ building }).sort({ createdAt: -1 })', avgMs: avgNoticesSorted }
    ];
    console.table(rows);
  } catch (err) {
    console.error('Performance test script error:', err);
  } finally {
    try { await client.close(); } catch(_) {}
  }
}

run();
