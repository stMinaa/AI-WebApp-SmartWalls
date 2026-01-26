require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Early imports and setup (must precede any route using authenticateToken)
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

const User = require('./models/User');
const Issue = require('./models/Issue');
const Notice = require('./models/Notice');
const Building = require('./models/Building');
const Apartment = require('./models/Apartment');
const Poll = require('./models/Poll');
const NoticeRead = require('./models/NoticeRead');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tennetdb';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Separate MongoDB Driver client for raw performance tests (no Mongoose)
let mongoClient;
let mongoDb;
async function initMongoDriver() {
  if (mongoDb) return mongoDb;
  try {
    mongoClient = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    await mongoClient.connect();
    mongoDb = mongoClient.db();
    console.log('MongoDB driver connected for performance tests');
    return mongoDb;
  } catch (err) {
    console.error('MongoDB driver connection error:', err);
    throw err;
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.use(cors());
app.use(express.json());

// Alias: GET /api/buildings/managed (for manager dashboard)
app.get('/api/buildings/managed', authenticateToken, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  try {
    const user = await User.findOne({ username: req.user.username }).populate('managedBuildings');
    if (!user || user.status !== 'active') return res.status(403).json({ message: 'Manager not active' });
    res.json(user.managedBuildings || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/buildings/:id/apartments (list apartments for a building)
app.get('/api/buildings/:id/apartments', authenticateToken, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  try {
    const mgr = await User.findOne({ username: req.user.username });
    if (!mgr || mgr.status !== 'active') return res.status(403).json({ message: 'Manager not active' });
    const apartments = await Apartment.find({ building: req.params.id }).populate('tenant', 'firstName lastName username email');
    res.json(apartments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Generic building info for any authenticated user
app.get('/api/buildings/:id/info', authenticateToken, async (req, res) => {
  try {
    const building = await Building.findById(req.params.id).select('name address');
    if (!building) return res.status(404).json({ message: 'Building not found' });
    res.json(building);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Generic apartment info for any authenticated user
app.get('/api/apartments/:id', authenticateToken, async (req, res) => {
  try {
    const apt = await Apartment.findById(req.params.id).select('unitNumber building tenant numPeople');
    if (!apt) return res.status(404).json({ message: 'Apartment not found' });
    res.json(apt);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/buildings/:id/pending-tenants (list pending tenants claiming this building)
app.get('/api/buildings/:id/pending-tenants', authenticateToken, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  try {
    const mgr = await User.findOne({ username: req.user.username });
    if (!mgr || mgr.status !== 'active') return res.status(403).json({ message: 'Manager not active' });
    const tenants = await User.find({ role: 'tenant', status: 'pending', requestedBuilding: req.params.id })
      .populate('requestedApartment', 'unitNumber');
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tenants/:tenantId/assign (assign tenant to apartment)
app.post('/api/tenants/:tenantId/assign', authenticateToken, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  const { apartmentId, buildingId } = req.body;
  try {
    const manager = await User.findOne({ username: req.user.username }).select('managedBuildings');
    if (!manager || !manager.managedBuildings || !manager.managedBuildings.map(String).includes(String(buildingId))) {
      return res.status(403).json({ message: 'You can only assign tenants to your managed buildings.' });
    }
    const tenant = await User.findById(req.params.tenantId);
    if (!tenant || tenant.role !== 'tenant') return res.status(404).json({ message: 'Tenant not found' });
    if (tenant.status !== 'pending' || tenant.building || tenant.apartment) {
      return res.status(400).json({ message: 'Tenant already assigned.' });
    }
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) return res.status(404).json({ message: 'Apartment not found' });
    if (String(apartment.building) !== String(buildingId)) {
      return res.status(400).json({ message: 'Apartment does not belong to the specified building.' });
    }
    if (apartment.tenant) {
      return res.status(400).json({ message: 'Apartment is already occupied.' });
    }
    tenant.building = buildingId;
    tenant.apartment = apartmentId;
    tenant.status = 'active';
    await tenant.save();
    apartment.tenant = tenant._id;
    await apartment.save();
    res.json({ message: 'Tenant assigned.', tenant });
  } catch (err) {
    console.error('Error assigning tenant:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/tenants/:tenantId/approve (approve pending tenant)
app.post('/api/tenants/:tenantId/approve', authenticateToken, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  try {
    const tenant = await User.findById(req.params.tenantId);
    if (!tenant || tenant.role !== 'tenant') return res.status(404).json({ message: 'Tenant not found' });
    if (tenant.status !== 'pending') return res.status(400).json({ message: 'Tenant already active.' });
    if (!tenant.requestedBuilding || !tenant.requestedApartment) {
      return res.status(400).json({ message: 'Tenant has no claimed building/apartment.' });
    }
    // Ensure manager manages this building
    const manager = await User.findOne({ username: req.user.username }).select('managedBuildings');
    if (!manager || !manager.managedBuildings.map(String).includes(String(tenant.requestedBuilding))) {
      return res.status(403).json({ message: 'You do not manage the claimed building.' });
    }
    const apartment = await Apartment.findById(tenant.requestedApartment);
    if (!apartment) return res.status(404).json({ message: 'Apartment not found' });
    if (String(apartment.building) !== String(tenant.requestedBuilding)) {
      return res.status(400).json({ message: 'Apartment does not belong to claimed building.' });
    }
    if (apartment.tenant) return res.status(400).json({ message: 'Apartment already occupied.' });
    tenant.building = tenant.requestedBuilding;
    tenant.apartment = tenant.requestedApartment;
    tenant.status = 'active';
    await tenant.save();
    apartment.tenant = tenant._id;
    await apartment.save();
    res.json({ message: 'Tenant approved and assigned.', tenant });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE tenant (manager) - removes tenant and frees apartment
app.delete('/api/tenants/:tenantId', authenticateToken, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  try {
    const tenant = await User.findById(req.params.tenantId);
    if (!tenant || tenant.role !== 'tenant') return res.status(404).json({ message: 'Tenant not found' });
    const manager = await User.findOne({ username: req.user.username }).select('managedBuildings');
    const managedIds = manager.managedBuildings.map(String);
    // Manager can delete pending tenant if claimed building managed OR active tenant if building managed
    const relevantBuilding = tenant.building || tenant.requestedBuilding;
    if (!relevantBuilding || !managedIds.includes(String(relevantBuilding))) {
      return res.status(403).json({ message: 'You do not manage this tenant\'s building.' });
    }
    // Free apartment if active
    if (tenant.apartment) {
      await Apartment.updateOne({ _id: tenant.apartment }, { $unset: { tenant: '' } });
    }
    await User.deleteOne({ _id: tenant._id });
    res.json({ message: 'Tenant deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
// Tenant: Report a building issue
app.post('/api/issues', authenticateToken, async (req, res) => {
  if (req.user.role !== 'tenant') return res.status(403).json({ message: 'Only tenants can report issues.' });
  const { title, description, urgency } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Title is required.' });
  }
  if (!description || !description.trim()) {
    return res.status(400).json({ message: 'Description is required.' });
  }
  if (urgency && !['urgent', 'not urgent'].includes(urgency)) {
    return res.status(400).json({ message: 'Invalid urgency value.' });
  }
  try {
    // Find tenant user
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const issue = new Issue({ tenant: user._id, title: title.trim(), description, urgency: urgency || 'not urgent', status: 'reported' });
    await issue.save();
    res.status(201).json({ message: 'Issue reported successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Tenant: Get my reported issues
app.get('/api/issues/my', authenticateToken, async (req, res) => {
  if (req.user.role !== 'tenant') return res.status(403).json({ message: 'Only tenants can view their issues.' });
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const issues = await Issue.find({ tenant: user._id }).sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manager/Admin/Director: Get all issues (for triage)
app.get('/api/issues', authenticateToken, async (req, res) => {
  if (!['manager', 'admin', 'director'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const issues = await Issue.find()
      .populate({
        path: 'tenant',
        select: 'username firstName lastName email building apartment',
        populate: [
          { path: 'building', select: 'name address' },
          { path: 'apartment', select: 'unitNumber' }
        ]
      })
      .sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manager: assign an issue (quick assign to repairman/company)
app.post('/api/issues/:id/assign', authenticateToken, async (req, res) => {
  if (!['manager', 'admin', 'director'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const { assignee } = req.body;
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    issue.assignee = assignee || 'unassigned';
    issue.status = 'assigned';
    issue.history.push({ by: req.user.username, action: 'assign', note: `Assigned to ${assignee || 'unassigned'}` });
    await issue.save();
    res.json({ message: 'Assigned' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// (Removed earlier duplicate status route; unified logic is below)
app.patch('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { firstName, lastName, mobile, householdMembers, company } = req.body;
    // Managers: allow updating name & mobile
    if (user.role === 'manager') {
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (mobile) {
        if (!/^\d{7,15}$/.test(mobile)) return res.status(400).json({ message: 'Invalid mobile' });
        user.mobile = mobile;
      }
    }
    // Tenants: name, mobile, and household members via apartment
    if (user.role === 'tenant') {
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (mobile && !/^\d{7,15}$/.test(mobile)) return res.status(400).json({ message: 'Invalid mobile' });
      if (mobile) user.mobile = mobile;
      // Allow tenant to update number of household members on their apartment
      if (householdMembers !== undefined) {
        const n = Number(householdMembers);
        if (!Number.isInteger(n) || n < 1) return res.status(400).json({ message: 'Invalid household members' });
        if (user.apartment) {
          const apt = await Apartment.findById(user.apartment);
          if (apt) {
            apt.numPeople = n;
            await apt.save();
          }
        } else {
          return res.status(400).json({ message: 'No apartment assigned to set household members.' });
        }
      }
    }
    // Directors: allow updating name and mobile
    if (user.role === 'director') {
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (mobile) {
        if (!/^\d{7,15}$/.test(mobile)) return res.status(400).json({ message: 'Invalid mobile' });
        user.mobile = mobile;
      }
    }
    // Associates: allow updating name, mobile, and company
    if (user.role === 'associate') {
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (mobile) {
        if (!/^\d{7,15}$/.test(mobile)) return res.status(400).json({ message: 'Invalid mobile' });
        user.mobile = mobile;
      }
      if (typeof company === 'string') user.company = company;
      if (Array.isArray(req.body.specialties)) user.specialties = req.body.specialties.map(s=>String(s)).filter(Boolean);
      if (typeof req.body.description === 'string') user.description = req.body.description;
      if (typeof req.body.website === 'string') user.website = req.body.website;
      if (Array.isArray(req.body.serviceAreas)) user.serviceAreas = req.body.serviceAreas.map(s=>String(s)).filter(Boolean);
      if (req.body.yearsExperience !== undefined) {
        const y = Number(req.body.yearsExperience);
        if (!Number.isInteger(y) || y < 0) return res.status(400).json({ message: 'Invalid yearsExperience' });
        user.yearsExperience = y;
      }
    }
    // Optionally allow more for other roles
    await user.save();
    const { password: _, ...userInfo } = user.toObject();
    res.json({ message: 'Profile updated', user: userInfo });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user's profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password: _, ...userInfo } = user.toObject();
    res.json(userInfo);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Unified status update endpoint (manager forward; director assign; associate accept with cost / resolve; generic reject)
app.post('/api/issues/:id/status', authenticateToken, async (req, res) => {
  const { status, note, cost, assignee } = req.body;
  if (!status) return res.status(400).json({ message: 'Status required' });
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    const role = req.user.role;
    const actor = await User.findOne({ username: req.user.username });
    if (!actor) return res.status(404).json({ message: 'User not found' });
    if (['manager','associate'].includes(role) && actor.status !== 'active') {
      return res.status(403).json({ message: 'Inactive user cannot perform this action' });
    }
    const allowed = {
      associate: ['in progress', 'resolved', 'rejected'],
      manager: ['forwarded', 'assigned', 'in progress', 'resolved', 'rejected'],
      director: ['assigned', 'in progress', 'resolved', 'rejected'],
      admin: ['forwarded', 'assigned', 'in progress', 'resolved', 'rejected']
    };
    if (!allowed[role] || !allowed[role].includes(status)) {
      return res.status(403).json({ message: 'Forbidden status change' });
    }
    // Associate accept with cost -> in progress
    if (role === 'associate' && status === 'in progress') {
      if (issue.status === 'in progress') return res.status(400).json({ message: 'Issue already in progress.' });
      if (cost == null || cost === '') return res.status(400).json({ message: 'Cost is required when accepting.' });
      const numericCost = Number(cost);
      if (isNaN(numericCost) || numericCost < 0) return res.status(400).json({ message: 'Invalid cost value.' });
      issue.cost = numericCost;
      issue.status = 'in progress';
      try {
        const tenantUser = await User.findById(issue.tenant);
        if (tenantUser) {
          tenantUser.debt = (Number(tenantUser.debt) || 0) + numericCost;
          await tenantUser.save();
        }
      } catch (_) {}
      issue.history.push({ by: req.user.username, action: 'accept', note: `Accepted (cost ${numericCost})` });
      await issue.save();
      return res.json({ message: 'Issue accepted', issue });
    }
    // Associate finishes work -> resolved
    if (role === 'associate' && status === 'resolved') {
      if (issue.status !== 'in progress') return res.status(400).json({ message: 'Issue must be in progress to resolve.' });
      issue.status = 'resolved';
      issue.history.push({ by: req.user.username, action: 'resolve', note: 'Finished work' });
      await issue.save();
      return res.json({ message: 'Issue resolved', issue });
    }
    // Manager forwards
    if (role === 'manager' && status === 'forwarded') {
      issue.status = 'forwarded';
      issue.history.push({ by: req.user.username, action: 'forward', note: 'Forwarded to director' });
      await issue.save();
      return res.json({ message: 'Forwarded', issue });
    }
    // Director assigning: validate assignee is an active associate
    if ((role === 'director' || role === 'manager' || role === 'admin') && status === 'assigned') {
      if (!assignee || typeof assignee !== 'string' || !assignee.trim()) {
        return res.status(400).json({ message: 'Assignee username is required to assign.' });
      }
      const target = await User.findOne({ username: assignee.trim() });
      if (!target || target.role !== 'associate') {
        return res.status(400).json({ message: 'Assignee must be an associate user.' });
      }
      if (target.status !== 'active') {
        return res.status(400).json({ message: 'Assignee associate is not active.' });
      }
      // Perform direct update to avoid validation failures on legacy documents
      await Issue.updateOne(
        { _id: issue._id },
        {
          $set: { assignee: assignee.trim(), status: 'assigned' },
          $push: { history: { by: req.user.username, action: 'assign', note: `Assigned to ${assignee.trim()}`, at: new Date() } }
        }
      );
      const updated = await Issue.findById(issue._id);
      return res.json({ message: 'Assigned', issue: updated });
    }
    // Generic flow (reject, other statuses)
    // Generic flow (reject, other statuses) — update directly to bypass schema required fields
    const setFields = { status };
    if (assignee) setFields.assignee = assignee;
    await Issue.updateOne(
      { _id: issue._id },
      {
        $set: setFields,
        $push: { history: { by: req.user.username, action: 'status', note: note || status, at: new Date() } }
      }
    );
    const updatedGeneric = await Issue.findById(issue._id);
    res.json({ message: 'Status updated', issue: updatedGeneric });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List all associates (for managers to assign issues)
app.get('/api/associates', authenticateToken, async (req, res) => {
  if (!['manager','admin','director'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const associates = await User.find({ role: 'associate' }).select('username firstName lastName email mobile company specialties description website serviceAreas yearsExperience');
    res.json(associates);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Issues assigned to current associate
app.get('/api/issues/assigned-to-me', authenticateToken, async (req, res) => {
  if (req.user.role !== 'associate') return res.status(403).json({ message: 'Forbidden' });
  try {
    const assoc = await User.findOne({ username: req.user.username });
    if (!assoc || assoc.status !== 'active') return res.status(403).json({ message: 'Associate not active' });
    const issues = await Issue.find({ assignee: req.user.username })
      .populate({
        path: 'tenant',
        select: 'firstName lastName building apartment',
        populate: [
          { path: 'building', select: 'address name' },
          { path: 'apartment', select: 'unitNumber' }
        ]
      })
      .sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ...already configured above



// Register endpoint (MongoDB)
app.post('/api/auth/register', async (req, res) => {
  const { username, password, role, firstName, lastName, email, mobile, address, numPeople, company, buildingId, apartmentId } = req.body;
  // Required fields
  if (!username || !password || !role || !firstName || !lastName || !email) {
    return res.status(400).json({ message: 'All fields except mobile, address, and numPeople are required.' });
  }
  // Role validation
  if (!['tenant', 'manager', 'admin', 'director', 'associate'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }
  // Email format
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }
  // Password length
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }
  // Mobile format (optional)
  if (mobile && !/^\d{7,15}$/.test(mobile)) {
    return res.status(400).json({ message: 'Mobile number must be 7-15 digits.' });
  }
  // numPeople (optional, only for tenants)
  if (role === 'tenant' && numPeople && (isNaN(numPeople) || numPeople < 1)) {
    return res.status(400).json({ message: 'Number of people must be a positive integer.' });
  }
  try {
    const existingUser = await User.findOne({ $or: [ { username }, { email } ] });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this username or email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role, firstName, lastName, email, mobile });
    if (role === 'tenant') {
      user.status = 'pending';
      if (buildingId && apartmentId) {
        const building = await Building.findById(buildingId);
        const apartment = await Apartment.findById(apartmentId);
        if (!building) return res.status(400).json({ message: 'Invalid building selection.' });
        if (!apartment) return res.status(400).json({ message: 'Invalid apartment selection.' });
        if (String(apartment.building) !== String(building._id)) return res.status(400).json({ message: 'Apartment not in selected building.' });
        if (apartment.tenant) return res.status(400).json({ message: 'Apartment already occupied.' });
        user.requestedBuilding = building._id;
        user.requestedApartment = apartment._id;
      }
    }
    if (role === 'associate') {
      user.status = 'pending';
      if (typeof company === 'string' && company.trim()) {
        user.company = company.trim();
      }
    }
    if (role === 'manager') {
      user.status = 'pending';
    }
    await user.save();
    // Auto-login after signup
    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ message: 'User registered successfully.', token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});



// Login endpoint (MongoDB, username or email)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Allow login with either username or email
    const user = await User.findOne({ $or: [ { username }, { email: username } ] });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
  const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  // Return user info (excluding password)
  const { password: _, ...userInfo } = user.toObject();
  res.json({ token, role: user.role, user: userInfo });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Example protected route
app.get('/api/protected', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    res.json({ message: `Hello, ${user.username}!`, role: user.role });
  });
});

// Get all notices for a building
// GET /api/buildings/:buildingId/notices
app.get('/api/buildings/:buildingId/notices', authenticateToken, async (req, res) => {
  try {
    // Pin service/elevator/delivery first (by priority), exclude expired
    const now = new Date();
    const notices = await Notice.find({ building: req.params.buildingId, $or: [ { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } } ] })
      .sort({ priority: -1, createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Post a new notice to a building
// POST /api/buildings/:buildingId/notices
app.post('/api/buildings/:buildingId/notices', authenticateToken, async (req, res) => {
  const { content, type, expiresAt, priority } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Content is required.' });
  }
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const notice = new Notice({
      building: req.params.buildingId,
      author: user._id,
      authorName: `${user.firstName} ${user.lastName}`,
      content,
      type: type || 'general',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      priority: typeof priority === 'number' ? priority : 0
    });
    await notice.save();
    res.status(201).json({ message: 'Notice posted.', notice });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a notice (author or manager can delete)
app.delete('/api/notices/:id', authenticateToken, async (req, res) => {
  try {
    const me = await User.findOne({ username: req.user.username });
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    // Allow deletion if user is author or has manager role
    if (String(notice.author) !== String(me._id) && me.role !== 'manager') {
      return res.status(403).json({ message: 'You are not permitted to delete this notice.' });
    }
    await Notice.deleteOne({ _id: notice._id });
    await NoticeRead.deleteMany({ notice: notice._id });
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a notice as read for current user
app.post('/api/notices/:id/read', authenticateToken, async (req, res) => {
  try {
    const me = await User.findOne({ username: req.user.username });
    await NoticeRead.updateOne({ notice: req.params.id, user: me._id }, { $set: { readAt: new Date() } }, { upsert: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Check unread count for current user in a building
app.get('/api/buildings/:buildingId/notices/unread-count', authenticateToken, async (req, res) => {
  try {
    const me = await User.findOne({ username: req.user.username });
    const allNotices = await Notice.find({ building: req.params.buildingId });
    const reads = await NoticeRead.find({ user: me._id, notice: { $in: allNotices.map(n => n._id) } }).select('notice');
    const readSet = new Set(reads.map(r => String(r.notice)));
    const unread = allNotices.filter(n => !readSet.has(String(n._id))).length;
    res.json({ unread });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Set ETA for an issue (manager) and add history note
app.post('/api/issues/:id/eta', authenticateToken, async (req, res) => {
  if (!['manager','admin','director','associate'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const { eta } = req.body;
  if (!eta) return res.status(400).json({ message: 'ETA required' });
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    issue.eta = new Date(eta);
    issue.history.push({ by: req.user.username, action: 'eta', note: `ETA set to ${new Date(eta).toISOString()}` });
    await issue.save();
    res.json({ message: 'ETA set', issue });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Tenant acknowledges ETA ("I'll be home")
app.post('/api/issues/:id/eta-ack', authenticateToken, async (req, res) => {
  if (req.user.role !== 'tenant') return res.status(403).json({ message: 'Forbidden' });
  try {
    const me = await User.findOne({ username: req.user.username });
    const issue = await Issue.findById(req.params.id);
    if (!issue || String(issue.tenant) !== String(me._id)) return res.status(404).json({ message: 'Issue not found' });
    issue.etaAckByTenant = true;
    issue.history.push({ by: req.user.username, action: 'ack', note: `Tenant will be home for ETA ${issue.eta ? issue.eta.toISOString() : ''}` });
    await issue.save();
    res.json({ message: 'Acknowledged', issue });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Building stats (basic aggregates)
app.get('/api/buildings/:buildingId/stats', authenticateToken, async (req, res) => {
  try {
    const buildingId = req.params.buildingId;
    const tenants = await User.find({ building: buildingId, role: 'tenant' }).select('_id');
    const tenantIds = tenants.map(t => t._id);
    const issues = await Issue.find({ tenant: { $in: tenantIds } }).sort({ createdAt: -1 });
    const resolved = issues.filter(i => i.status === 'resolved');
    const avgResolveMs = resolved.length ? (resolved.reduce((sum, i) => sum + (new Date(i.updatedAt) - new Date(i.createdAt)), 0) / resolved.length) : 0;
    // simplistic streak: days since last 'service outage' notice
    const lastOutage = await Notice.findOne({ building: buildingId, type: 'service' }).sort({ createdAt: -1 });
    const daysSinceOutage = lastOutage ? Math.floor((Date.now() - new Date(lastOutage.createdAt).getTime()) / (1000*60*60*24)) : null;
    res.json({ totalIssues: issues.length, resolved: resolved.length, avgResolveMs, daysSinceOutage });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Changes since timestamp for micro-feed
app.get('/api/buildings/:buildingId/changes-since', authenticateToken, async (req, res) => {
  try {
    const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 24*60*60*1000);
    const buildingId = req.params.buildingId;
    const notices = await Notice.find({ building: buildingId, createdAt: { $gt: since } }).countDocuments();
    const polls = await Poll.find({ building: buildingId, createdAt: { $gt: since } }).countDocuments();
    // issues by tenants in building
    const tenants = await User.find({ building: buildingId, role: 'tenant' }).select('_id');
    const tenantIds = tenants.map(t => t._id);
    const issueUpdates = await Issue.find({ tenant: { $in: tenantIds }, updatedAt: { $gt: since } }).countDocuments();
    res.json({ notices, polls, issueUpdates, since });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Manager contact details for quick dial
app.get('/api/buildings/:buildingId/manager-contact', authenticateToken, async (req, res) => {
  try {
    const b = await Building.findById(req.params.buildingId).populate('manager', 'firstName lastName email mobile');
    if (!b || !b.manager) return res.status(404).json({ message: 'Manager not found' });
    res.json({ name: `${b.manager.firstName || ''} ${b.manager.lastName || ''}`.trim(), email: b.manager.email, mobile: b.manager.mobile || '' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ DIRECTOR ENDPOINTS ============

// Create a new building
app.post('/api/buildings', authenticateToken, async (req, res) => {
  if (req.user.role !== 'director') return res.status(403).json({ message: 'Only directors can create buildings.' });
  const { name, address, imageUrl } = req.body;
  if (!address || !address.trim()) return res.status(400).json({ message: 'Address is required.' });
  try {
    const user = await User.findOne({ username: req.user.username });
    const payload = { address: address.trim(), director: user._id };
    if (name && name.trim()) payload.name = name.trim();
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) payload.imageUrl = imageUrl.trim();
    const building = new Building(payload);
    await building.save();
    res.status(201).json({ message: 'Building created.', building });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all buildings (for directors)
app.get('/api/buildings', authenticateToken, async (req, res) => {
  if (req.user.role !== 'director') return res.status(403).json({ message: 'Forbidden' });
  try {
    const list = await Building.find()
      .populate('manager', 'firstName lastName username email')
      .populate('director', 'firstName lastName');
    const withCounts = await Promise.all(list.map(async b => {
      const count = await Apartment.countDocuments({ building: b._id });
      const obj = b.toObject();
      obj.apartmentCount = count;
      return obj;
    }));
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign manager to building
app.patch('/api/buildings/:id/assign-manager', authenticateToken, async (req, res) => {
  if (req.user.role !== 'director') return res.status(403).json({ message: 'Only directors can assign managers.' });
  const { managerId } = req.body;
  try {
    const building = await Building.findById(req.params.id);
    if (!building) return res.status(404).json({ message: 'Building not found' });
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') return res.status(400).json({ message: 'Invalid manager' });
    building.manager = managerId;
    await building.save();
    // Add to manager's managedBuildings
    if (!manager.managedBuildings.includes(building._id)) {
      manager.managedBuildings.push(building._id);
      await manager.save();
    }
    res.json({ message: 'Manager assigned.', building });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all managers (for director to assign)
app.get('/api/managers', authenticateToken, async (req, res) => {
  if (req.user.role !== 'director') return res.status(403).json({ message: 'Forbidden' });
  try {
    const managers = await User.find({ role: 'manager' })
      .select('firstName lastName username email managedBuildings')
      .populate('managedBuildings', 'name address');
    res.json(managers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Pending managers & associates listing
app.get('/api/pending/staff', authenticateToken, async (req, res) => {
  if (req.user.role !== 'director') return res.status(403).json({ message: 'Forbidden' });
  const role = req.query.role; // optional filter
  try {
    const query = { status: 'pending', role: { $in: ['manager','associate'] } };
    if (role && ['manager','associate'].includes(role)) query.role = role;
    const pending = await User.find(query).select('firstName lastName username email role company');
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve pending manager/associate
app.post('/api/users/:id/approve', authenticateToken, async (req, res) => {
  if (req.user.role !== 'director') return res.status(403).json({ message: 'Forbidden' });
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: 'User not found' });
    if (!['manager','associate'].includes(u.role)) return res.status(400).json({ message: 'Not approvable role' });
    if (u.status !== 'pending') return res.status(400).json({ message: 'User not pending' });
    u.status = 'active';
    await u.save();
    res.json({ message: 'User approved', userId: u._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject pending manager/associate (set status rejected)
app.post('/api/users/:id/reject', authenticateToken, async (req, res) => {
  if (req.user.role !== 'director') return res.status(403).json({ message: 'Forbidden' });
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: 'User not found' });
    if (!['manager','associate'].includes(u.role)) return res.status(400).json({ message: 'Not rejectable role' });
    if (u.status !== 'pending') return res.status(400).json({ message: 'User not pending' });
    u.status = 'rejected';
    await u.save();
    res.json({ message: 'User rejected', userId: u._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete manager or associate (director only)
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'director') return res.status(403).json({ message: 'Forbidden' });
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: 'User not found' });
    if (!['manager','associate'].includes(u.role)) return res.status(400).json({ message: 'Only managers or associates can be deleted by director' });
    // If manager: remove manager reference from buildings
    if (u.role === 'manager') {
      await Building.updateMany({ manager: u._id }, { $unset: { manager: '' } });
    }
    await User.deleteOne({ _id: u._id });
    res.json({ message: 'User deleted', userId: u._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ MANAGER ENDPOINTS ============

// Get all tenants for a building (manager view)
app.get('/api/buildings/:buildingId/tenants', authenticateToken, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  try {
    const tenants = await User.find({ building: req.params.buildingId, role: 'tenant' }).populate('apartment');
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pending tenants (no building assigned)
app.get('/api/tenants/pending', authenticateToken, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  try {
    const tenants = await User.find({ role: 'tenant', status: 'pending' });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create apartment/unit in a building
app.post('/api/buildings/:buildingId/apartments', authenticateToken, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  const { unitNumber, address, numPeople } = req.body;
  if (!unitNumber) return res.status(400).json({ message: 'Unit number is required.' });
  try {
    const mgr = await User.findOne({ username: req.user.username });
    if (!mgr || mgr.status !== 'active') return res.status(403).json({ message: 'Manager not active' });
    const apartment = new Apartment({ building: req.params.buildingId, unitNumber, address, numPeople });
    await apartment.save();
    res.status(201).json({ message: 'Apartment created.', apartment });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: list buildings for signup selection (id, name, address)
app.get('/api/buildings/public', async (req, res) => {
  try {
    const buildings = await Building.find().select('name address imageUrl');
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: list vacant apartments for a building (unitNumber)
app.get('/api/buildings/:buildingId/apartments/vacant', async (req, res) => {
  try {
    // Vacant means tenant is null OR not set; Mongoose stores field even if null so check for null explicitly
    const apartments = await Apartment.find({ building: req.params.buildingId, tenant: null }).select('unitNumber');
    res.json(apartments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// BULK CREATE APARTMENTS (ONE TIME ONLY)
app.post('/api/buildings/:buildingId/apartments/bulk', authenticateToken, async (req, res) => {
  if (!['manager','director'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  const { floors, unitsPerFloor, startNumber } = req.body;
  if (!floors || !Array.isArray(unitsPerFloor) || unitsPerFloor.length !== floors) {
    return res.status(400).json({ message: 'Invalid floors or unitsPerFloor.' });
  }
  try {
    const buildingId = req.params.buildingId;
    // Check if apartments already exist for this building
    const existingCount = await Apartment.countDocuments({ building: buildingId });
    if (existingCount > 0) {
      return res.status(400).json({ message: `Bulk creation already done. ${existingCount} apartments exist. Use individual creation to add more.` });
    }
    const created = [];
    let counter = startNumber || 1; // Start numbering from user input or 1
    for (let floor = 1; floor <= floors; floor++) {
      const units = unitsPerFloor[floor - 1];
      for (let unit = 1; unit <= units; unit++) {
        // Simple sequential numbering: 1, 2, 3, ... or starting from user input
        const unitNumber = counter.toString();
        const apartment = new Apartment({ building: buildingId, unitNumber, address: '', numPeople: undefined });
        await apartment.save();
        created.push(apartment);
        counter++;
      }
    }
    res.status(201).json({ message: `Created ${created.length} apartments.`, apartments: created });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign tenant to apartment
app.patch('/api/tenants/:tenantId/assign', authenticateToken, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  const { apartmentId, buildingId } = req.body;
  try {
    const manager = await User.findOne({ username: req.user.username }).select('managedBuildings');
    if (!manager || !manager.managedBuildings || !manager.managedBuildings.map(String).includes(String(buildingId))) {
      return res.status(403).json({ message: 'You can only assign tenants to your managed buildings.' });
    }
    const tenant = await User.findById(req.params.tenantId);
    if (!tenant || tenant.role !== 'tenant') return res.status(404).json({ message: 'Tenant not found' });
    if (tenant.status !== 'pending' || tenant.building || tenant.apartment) {
      return res.status(400).json({ message: 'Tenant already assigned.' });
    }
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) return res.status(404).json({ message: 'Apartment not found' });
    if (String(apartment.building) !== String(buildingId)) {
      return res.status(400).json({ message: 'Apartment does not belong to the specified building.' });
    }
    if (apartment.tenant) {
      return res.status(400).json({ message: 'Apartment is already occupied.' });
    }
    tenant.building = buildingId;
    tenant.apartment = apartmentId;
    tenant.status = 'active';
    await tenant.save();
    apartment.tenant = tenant._id;
    await apartment.save();
    res.json({ message: 'Tenant assigned.', tenant });
  } catch (err) {
    console.error('Error assigning tenant:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update tenant info (manager can update address and numPeople via apartment)
app.patch('/api/apartments/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  const { unitNumber, address, numPeople } = req.body;
  try {
    const apartment = await Apartment.findById(req.params.id);
    if (!apartment) return res.status(404).json({ message: 'Apartment not found' });
    if (unitNumber) apartment.unitNumber = unitNumber;
    if (address) apartment.address = address;
    if (numPeople) apartment.numPeople = numPeople;
    await apartment.save();
    res.json({ message: 'Apartment updated.', apartment });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ POLL ENDPOINTS ============
// ============ NOTICE ENDPOINTS ============

// Get all notices for a building
app.get('/api/buildings/:buildingId/notices', authenticateToken, async (req, res) => {
  try {
    const notices = await Notice.find({ building: req.params.buildingId }).sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Post a new notice to a building
app.post('/api/buildings/:buildingId/notices', authenticateToken, async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Content is required.' });
  }
  try {
    const notice = new Notice({
      building: req.params.buildingId,
      author: req.user._id,
      authorName: req.user.username,
      authorRole: req.user.role,
      content
    });
    await notice.save();
    res.status(201).json({ message: 'Notice posted.', notice });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a notice
app.delete('/api/notices/:noticeId', authenticateToken, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.noticeId);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    const isAuthor = notice.author && notice.author.toString() === req.user._id.toString();
    let isManagerOfBuilding = false;
    if (req.user.role === 'manager') {
      const building = await Building.findById(notice.building);
      if (building && building.manager && building.manager.toString() === req.user._id.toString()) {
        isManagerOfBuilding = true;
      }
    }
    if (!isAuthor && !isManagerOfBuilding) {
      return res.status(403).json({ message: 'Not authorized to delete this notice.' });
    }
    await notice.deleteOne();
    res.json({ message: 'Notice deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a poll (managers only)
app.post('/api/buildings/:buildingId/polls', authenticateToken, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Only managers can create polls.' });
  let { question, options } = req.body;
  if (!question || !options) {
    return res.status(400).json({ message: 'Question and options are required.' });
  }
  if (!Array.isArray(options)) {
    return res.status(400).json({ message: 'Options must be an array.' });
  }
  // Trim and filter empty options
  options = options.map(o => (o || '').trim()).filter(Boolean);
  if (options.length < 2) {
    return res.status(400).json({ message: 'At least 2 non-empty options are required.' });
  }
  if (options.length > 7) {
    return res.status(400).json({ message: 'Maximum 7 options allowed.' });
  }
  try {
    const user = await User.findOne({ username: req.user.username });
    const poll = new Poll({
      building: req.params.buildingId,
      question: question.trim(),
      options,
      createdBy: user._id
    });
    await poll.save();
    res.status(201).json({ message: 'Poll created.', poll });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all polls for a building
app.get('/api/buildings/:buildingId/polls', authenticateToken, async (req, res) => {
  try {
    const polls = await Poll.find({ building: req.params.buildingId }).populate('createdBy', 'firstName lastName').sort({ createdAt: -1 });
    const enhanced = polls.map(p => {
      const obj = p.toObject();
      const counts = {};
      (p.votes || []).forEach(v => { counts[v.option] = (counts[v.option] || 0) + 1; });
      const max = Object.values(counts).reduce((a,b)=> Math.max(a,b), 0);
      const winners = (p.options || []).filter(opt => (counts[opt] || 0) === max && max > 0);
      return {
        ...obj,
        totalVotes: (p.votes || []).length,
        results: (p.options || []).map(opt => ({ option: opt, votes: counts[opt] || 0 })),
        winner: winners.length ? { options: winners, votes: max } : null,
        closed: !!p.closedAt
      };
    });
    res.json(enhanced);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote in a poll
app.post('/api/polls/:pollId/vote', authenticateToken, async (req, res) => {
  const { option } = req.body;
  if (!option) return res.status(400).json({ message: 'Option is required.' });
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (poll.closedAt) return res.status(400).json({ message: 'Poll is closed.' });
    const user = await User.findOne({ username: req.user.username });
    // Check if user already voted
    const alreadyVoted = poll.votes.find(v => v.voter.toString() === user._id.toString());
    if (alreadyVoted) return res.status(400).json({ message: 'You have already voted in this poll.' });
    poll.votes.push({ option, voter: user._id });
    await poll.save();
    res.json({ message: 'Vote recorded.', poll });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Close a poll (managers only)
app.post('/api/polls/:pollId/close', authenticateToken, async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Only managers can close polls.' });
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (poll.closedAt) return res.status(400).json({ message: 'Poll already closed.' });
    // Optional: ensure manager manages the building (skip if not needed)
    // const building = await Building.findById(poll.building);
    // if (building && building.manager && building.manager.toString() !== req.user.userId) {
    //   return res.status(403).json({ message: 'You do not manage this building.' });
    // }
    poll.closedAt = new Date();
    await poll.save();
    res.json({ message: 'Poll closed.', poll });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend API is running');
});

// ===== Performance Testing (MongoDB driver, no Mongoose) =====
// Utility: measure and log query runtime in ms
async function measureQuery(label, queryFn) {
  const { performance } = require('perf_hooks');
  const start = performance.now();
  const result = await queryFn();
  const end = performance.now();
  const ms = Math.round(end - start);
  console.log(`Query [${label}] took ${ms} ms`);
  return result;
}

// Endpoint to run a series of queries and log their durations
app.get('/test-performance', async (req, res) => {
  try {
    const db = await initMongoDriver();
    // Collections from this app
    const issuesCol = db.collection('issues');
    const usersCol = db.collection('users');
    const noticesCol = db.collection('notices');
    const apartmentsCol = db.collection('apartments');
    const buildingsCol = db.collection('buildings');

    // 1) Issues: urgent
    const r1 = await measureQuery('issues: find({ urgency: "urgent" })', async () => {
      return await issuesCol.find({ urgency: 'urgent' }).toArray();
    });

    // 2) Issues: forwarded to director
    const r2 = await measureQuery('issues: find({ status: "forwarded" })', async () => {
      return await issuesCol.find({ status: 'forwarded' }).toArray();
    });

    // 3) Associates: active
    const r3 = await measureQuery('users: find({ role: "associate", status: "active" })', async () => {
      return await usersCol.find({ role: 'associate', status: 'active' }).toArray();
    });

    // 4) Aggregate: issues per building (match by tenant building via lookup)
    const r4 = await measureQuery('issues: aggregate(match + group by building)', async () => {
      return await issuesCol.aggregate([
        { $lookup: { from: 'users', localField: 'tenant', foreignField: '_id', as: 'tenantUser' } },
        { $unwind: '$tenantUser' },
        { $match: { 'tenantUser.building': { $exists: true, $ne: null } } },
        { $group: { _id: '$tenantUser.building', count: { $sum: 1 } } }
      ]).toArray();
    });

    // 5) Notices: latest for a building (pick first building if any)
    let firstBuildingId = null;
    try {
      const b = await buildingsCol.find({}).project({ _id: 1 }).limit(1).toArray();
      firstBuildingId = b && b[0] ? b[0]._id : null;
    } catch (_) {}
    const r5 = await measureQuery('notices: find(by building).sort({ createdAt: -1 })', async () => {
      const filter = firstBuildingId ? { building: firstBuildingId } : {};
      return await noticesCol.find(filter).sort({ createdAt: -1 }).toArray();
    });

    res.json({
      message: 'Performance tests executed. See server logs for timings.',
      counts: {
        urgentIssues: r1.length,
        forwardedIssues: r2.length,
        activeAssociates: r3.length,
        issuesPerBuildingGroups: r4.length,
        noticesFetched: r5.length
      }
    });
  } catch (err) {
    console.error('Performance test error:', err);
    res.status(500).json({ message: 'Performance test failed', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
