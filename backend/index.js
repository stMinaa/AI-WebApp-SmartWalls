require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// MongoDB connection string (hardcoded for simplicity)
const MONGO_URI = 'mongodb+srv://minastankovic111_db_user:XcZ45WFEEOnILNJu@cluster0.2lelkqq.mongodb.net/tennetdb?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = 'your_secret_key_here';

// Import models
const User = require('./models/User');
const Building = require('./models/Building');
const Apartment = require('./models/Apartment');
const Issue = require('./models/Issue');

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MONGO RUNNING - Connected to MongoDB'))
    .catch(err => {
      console.error('❌ MONGO ERROR:', err.message);
      process.exit(1);
    });
}

// Simple auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ===== SIGNUP =====
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password, firstName, lastName, role } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate role if provided
  const validRoles = ['tenant', 'manager', 'director', 'associate'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be one of: tenant, manager, director, associate' });
  }

  try {
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'tenant',
      status: 'pending'
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== LOGIN =====
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Find user by username or email
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== GET CURRENT USER =====
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== BUILDING ENDPOINTS =====

// POST /api/buildings - Director creates a building
app.post('/api/buildings', authenticateToken, async (req, res) => {
  console.log('POST /api/buildings - User:', req.user?.username, 'Body:', req.body);
  try {
    const user = await User.findOne({ username: req.user.username });
    console.log('Found user:', user?.username, 'Role:', user?.role);
    if (!user || user.role !== 'director') {
      console.log('Authorization failed - user role:', user?.role);
      return res.status(403).json({ message: 'Only directors can create buildings' });
    }

    const { name, address, imageUrl } = req.body;
    if (!address) {
      console.log('Validation failed - no address');
      return res.status(400).json({ message: 'Address is required' });
    }

    const building = new Building({
      name: name || '',
      address,
      imageUrl: imageUrl || '',
      director: user._id
    });

    await building.save();
    console.log('Building created:', building._id);
    res.status(201).json(building);
  } catch (err) {
    console.error('Create building error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/buildings - Director views all buildings with apartment count
app.get('/api/buildings', authenticateToken, async (req, res) => {
  console.log('GET /api/buildings - User:', req.user?.username);
  try {
    const user = await User.findOne({ username: req.user.username });
    console.log('Found user:', user?.username, 'Role:', user?.role);
    if (!user || user.role !== 'director') {
      console.log('Authorization failed - user role:', user?.role);
      return res.status(403).json({ message: 'Only directors can view all buildings' });
    }

    const buildings = await Building.find({})
      .populate('manager', 'firstName lastName email')
      .populate('director', 'firstName lastName email')
      .sort({ createdAt: -1 });

    console.log('Found buildings:', buildings.length);

    // Add apartment count for each building
    const buildingsWithCount = await Promise.all(
      buildings.map(async (building) => {
        const apartmentCount = await Apartment.countDocuments({ building: building._id });
        return {
          ...building.toObject(),
          apartmentCount
        };
      })
    );

    console.log('Returning buildings with counts');
    res.json(buildingsWithCount);
  } catch (err) {
    console.error('Get buildings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/buildings/managed - Manager views their assigned buildings
app.get('/api/buildings/managed', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can view managed buildings' });
    }

    const buildings = await Building.find({ manager: user._id })
      .populate('director', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Add apartment count for each building
    const buildingsWithCount = await Promise.all(
      buildings.map(async (building) => {
        const apartmentCount = await Apartment.countDocuments({ building: building._id });
        return {
          ...building.toObject(),
          apartmentCount
        };
      })
    );

    res.json(buildingsWithCount);
  } catch (err) {
    console.error('Get managed buildings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/issues - Get issues (role-based filtering)
app.get('/api/issues', authenticateToken, async (req, res) => {
  console.log('GET /api/issues - User:', req.user?.username, 'Query:', req.query);
  try {
    const user = await User.findOne({ username: req.user.username });
    console.log('Found user:', user?.username, 'Role:', user?.role);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    const { status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Role-based filtering
    if (user.role === 'manager') {
      // Managers see issues from their buildings (status: reported, assigned, in-progress, resolved)
      const buildings = await Building.find({ manager: user._id });
      const buildingIds = buildings.map(b => b._id);
      const apartments = await Apartment.find({ building: { $in: buildingIds } });
      const apartmentIds = apartments.map(a => a._id);
      filter.apartment = { $in: apartmentIds };
    } else if (user.role === 'tenant') {
      // Tenants see only their own issues
      filter.createdBy = user._id;
    } else if (user.role === 'associate') {
      // Associates see only issues assigned to them
      filter.assignedTo = user._id;
    } else if (user.role === 'director') {
      // Directors see forwarded and assigned issues (to track what they've assigned)
      if (!filter.status) {
        filter.status = { $in: ['forwarded', 'assigned', 'in-progress', 'resolved'] };
      }
    }

    const issues = await Issue.find(filter)
      .populate('apartment', 'number building')
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 });

    console.log('Returning issues:', issues.length);
    res.json(issues);
  } catch (err) {
    console.error('Get issues error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/issues/:issueId/triage - Manager triages issue (forward/reject/assign)
app.patch('/api/issues/:issueId/triage', authenticateToken, async (req, res) => {
  console.log('PATCH /api/issues/:issueId/triage - User:', req.user?.username, 'Body:', req.body);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can triage issues' });
    }

    const issue = await Issue.findById(req.params.issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const { action, associateId } = req.body;
    
    const updateData = { updatedAt: new Date() };

    if (action === 'forward') {
      updateData.status = 'forwarded';
    } else if (action === 'reject') {
      updateData.status = 'rejected';
    } else if (action === 'assign' && associateId) {
      // Manager assigns to associate directly
      const associate = await User.findById(associateId);
      if (!associate || associate.role !== 'associate' || associate.status !== 'active') {
        return res.status(400).json({ message: 'Invalid associate' });
      }
      updateData.assignedTo = associateId;
      updateData.status = 'assigned';
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const updated = await Issue.findByIdAndUpdate(
      req.params.issueId,
      updateData,
      { new: true, runValidators: false }
    )
      .populate('apartment', 'number building')
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    console.log('Issue triaged:', req.params.issueId, 'Action:', action);
    res.json(updated);
  } catch (err) {
    console.error('Triage issue error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/issues/:issueId/assign - Director assigns forwarded issue (or rejects)
app.patch('/api/issues/:issueId/assign', authenticateToken, async (req, res) => {
  console.log('PATCH /api/issues/:issueId/assign - User:', req.user?.username, 'Body:', req.body);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.role !== 'director') {
      return res.status(403).json({ message: 'Only directors can assign issues' });
    }

    const issue = await Issue.findById(req.params.issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Allow assigning any issue for testing (in production, check: issue.status !== 'forwarded')
    // if (issue.status !== 'forwarded') {
    //   return res.status(400).json({ message: 'Only forwarded issues can be assigned by director' });
    // }

    const { action, associateId } = req.body;

    const updateData = { updatedAt: new Date() };

    if (action === 'reject') {
      updateData.status = 'rejected';
    } else if (action === 'assign' && associateId) {
      const associate = await User.findById(associateId);
      if (!associate || associate.role !== 'associate' || associate.status !== 'active') {
        return res.status(400).json({ message: 'Invalid associate' });
      }
      updateData.assignedTo = associateId;
      updateData.status = 'assigned';
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const updated = await Issue.findByIdAndUpdate(
      req.params.issueId,
      updateData,
      { new: true, runValidators: false }
    )
      .populate('apartment', 'number building')
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    console.log('Issue assigned by director:', action);
    res.json(updated);
  } catch (err) {
    console.error('Assign issue error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/issues/:issueId/accept - Associate accepts assigned job
app.patch('/api/issues/:issueId/accept', authenticateToken, async (req, res) => {
  console.log('PATCH /api/issues/:issueId/accept - User:', req.user?.username);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.role !== 'associate') {
      return res.status(403).json({ message: 'Only associates can accept jobs' });
    }

    const issue = await Issue.findById(req.params.issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (issue.assignedTo?.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'This issue is not assigned to you' });
    }

    if (issue.status !== 'assigned') {
      return res.status(400).json({ message: 'Issue is not in assigned status' });
    }

    const updated = await Issue.findByIdAndUpdate(
      req.params.issueId,
      { status: 'in-progress', updatedAt: new Date() },
      { new: true, runValidators: false }
    )
      .populate('apartment', 'number building')
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    console.log('Issue accepted by associate:', user._id);
    res.json(updated);
  } catch (err) {
    console.error('Accept issue error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/issues/:issueId/complete - Associate completes job
app.patch('/api/issues/:issueId/complete', authenticateToken, async (req, res) => {
  console.log('PATCH /api/issues/:issueId/complete - User:', req.user?.username);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.role !== 'associate') {
      return res.status(403).json({ message: 'Only associates can complete jobs' });
    }

    const issue = await Issue.findById(req.params.issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (issue.assignedTo?.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'This issue is not assigned to you' });
    }

    if (issue.status !== 'in-progress') {
      return res.status(400).json({ message: 'Issue must be in-progress to complete' });
    }

    const { completionNotes, cost } = req.body;
    const updateData = {
      status: 'resolved',
      completionDate: new Date(),
      updatedAt: new Date()
    };
    if (completionNotes) updateData.completionNotes = completionNotes;
    if (cost) updateData.cost = cost;

    const updated = await Issue.findByIdAndUpdate(
      req.params.issueId,
      updateData,
      { new: true, runValidators: false }
    )
      .populate('apartment', 'number building')
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    console.log('Issue completed by associate:', user._id);
    res.json(updated);
  } catch (err) {
    console.error('Complete issue error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/buildings/:buildingId/assign-manager - Assign manager to building
app.patch('/api/buildings/:buildingId/assign-manager', authenticateToken, async (req, res) => {
  console.log('PATCH /api/buildings/:buildingId/assign-manager - User:', req.user?.username, 'Body:', req.body);
  try {
    const user = await User.findOne({ username: req.user.username });
    console.log('Found user:', user?.username, 'Role:', user?.role);
    if (!user || user.role !== 'director') {
      console.log('Authorization failed - user role:', user?.role);
      return res.status(403).json({ message: 'Only directors can assign managers' });
    }

    const { managerId } = req.body;
    const building = await Building.findById(req.params.buildingId);
    
    if (!building) {
      return res.status(404).json({ message: 'Building not found' });
    }

    // Validate manager exists and is active (if managerId provided)
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== 'manager') {
        return res.status(400).json({ message: 'Invalid manager' });
      }
      if (manager.status !== 'active') {
        return res.status(400).json({ message: 'Manager is not active' });
      }
    }

    // Update building manager (null to unassign)
    building.manager = managerId || null;
    await building.save();

    // Populate and return
    const updated = await Building.findById(building._id)
      .populate('manager', 'firstName lastName email')
      .populate('director', 'firstName lastName email');

    console.log('Manager assigned:', managerId ? managerId : 'removed');
    res.json(updated);
  } catch (err) {
    console.error('Assign manager error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users - Get users with optional role/status filter
app.get('/api/users', authenticateToken, async (req, res) => {
  console.log('GET /api/users - User:', req.user?.username, 'Query:', req.query);
  try {
    const user = await User.findOne({ username: req.user.username });
    console.log('Found user:', user?.username, 'Role:', user?.role);
    if (!user || user.role !== 'director') {
      console.log('Authorization failed - user role:', user?.role);
      return res.status(403).json({ message: 'Only directors can view users' });
    }

    const { role, status, includeTest } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    
    // Exclude test users by default (usernames starting with 'test' or names matching test patterns)
    if (includeTest !== 'true') {
      filter.$and = [
        { username: { $not: /^test/i } },
        { firstName: { $not: /^(name|test)\d+$/i } },
        { lastName: { $not: /^(last|test)\d+$/i } }
      ];
    }

    const users = await User.find(filter)
      .select('firstName lastName email username role status')
      .sort({ createdAt: -1 });

    // If fetching managers, add building count
    if (role === 'manager') {
      const usersWithCount = await Promise.all(
        users.map(async (u) => {
          const buildingCount = await Building.countDocuments({ manager: u._id });
          return {
            ...u.toObject(),
            buildingCount
          };
        })
      );
      console.log('Returning managers with building counts:', usersWithCount.length);
      return res.json(usersWithCount);
    }

    console.log('Returning users:', users.length);
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/:userId/approve - Approve pending user (director only)
app.patch('/api/users/:userId/approve', authenticateToken, async (req, res) => {
  console.log('PATCH /api/users/:userId/approve - User:', req.user?.username, 'Target:', req.params.userId);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.role !== 'director') {
      return res.status(403).json({ message: 'Only directors can approve users' });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.status === 'active') {
      return res.status(400).json({ message: 'User is already active' });
    }

    targetUser.status = 'active';
    await targetUser.save();

    console.log('User approved:', targetUser.username);
    res.json({ 
      message: 'User approved successfully',
      user: {
        _id: targetUser._id,
        username: targetUser.username,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status
      }
    });
  } catch (err) {
    console.error('Approve user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:userId - Delete a user (director only)
app.delete('/api/users/:userId', authenticateToken, async (req, res) => {
  console.log('DELETE /api/users/:userId - User:', req.user?.username, 'Target:', req.params.userId);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.role !== 'director') {
      return res.status(403).json({ message: 'Only directors can delete users' });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting yourself
    if (targetUser.username === user.username) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    // If deleting a manager, remove them from all buildings
    if (targetUser.role === 'manager') {
      await Building.updateMany(
        { manager: targetUser._id },
        { $set: { manager: null } }
      );
      console.log('Removed manager from all buildings');
    }

    await User.findByIdAndDelete(req.params.userId);
    console.log('User deleted:', targetUser.username);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/bulk/test - Delete all test users (director only)
app.delete('/api/users/bulk/test', authenticateToken, async (req, res) => {
  console.log('DELETE /api/users/bulk/test - User:', req.user?.username);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.role !== 'director') {
      return res.status(403).json({ message: 'Only directors can delete users' });
    }

    // Find all test users (excluding the current user)
    const testUsers = await User.find({
      _id: { $ne: user._id },
      $or: [
        { username: /^test/i },
        { firstName: /^(name|test)\d+$/i },
        { lastName: /^(last|test)\d+$/i }
      ]
    });

    console.log(`Found ${testUsers.length} test users to delete`);

    // Remove test managers from buildings
    const testManagerIds = testUsers.filter(u => u.role === 'manager').map(u => u._id);
    if (testManagerIds.length > 0) {
      await Building.updateMany(
        { manager: { $in: testManagerIds } },
        { $set: { manager: null } }
      );
      console.log('Removed test managers from buildings');
    }

    // Delete all test users
    const result = await User.deleteMany({
      _id: { $ne: user._id },
      $or: [
        { username: /^test/i },
        { firstName: /^(name|test)\d+$/i },
        { lastName: /^(last|test)\d+$/i }
      ]
    });

    console.log(`Deleted ${result.deletedCount} test users`);
    res.json({ 
      message: `Successfully deleted ${result.deletedCount} test users`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== TEST ENDPOINT =====
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// POST /api/test/seed-issues - Create test issues (dev only)
app.post('/api/test/seed-issues', authenticateToken, async (req, res) => {
  console.log('POST /api/test/seed-issues - User:', req.user?.username);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.role !== 'director') {
      return res.status(403).json({ message: 'Only directors can seed data' });
    }

    // Find first apartment and tenant
    const apartment = await Apartment.findOne();
    const tenant = await User.findOne({ role: 'tenant' });
    
    if (!apartment || !tenant) {
      return res.status(400).json({ message: 'Need at least one apartment and tenant to create issues' });
    }

    const testIssues = [
      { title: 'Nema tople vode', description: 'U kupatilu nema tople vode već tri dana', priority: 'high', status: 'forwarded' },
      { title: 'Lift ne radi', description: 'Lift je zaglavio između spratova', priority: 'high', status: 'forwarded' },
      { title: 'Curi slavina u kuhinji', description: 'Slavina u kuhinji kaplje celu noć', priority: 'medium', status: 'forwarded' },
      { title: 'Pukla sijalica u hodniku', description: 'Sijalica na trećem spratu je pregorela', priority: 'low', status: 'forwarded' },
      { title: 'Nezatvoren prozor na stepeništu', description: 'Prozor na drugom spratu ne može da se zatvori', priority: 'medium', status: 'forwarded' },
      { title: 'Nema grejanja u stanu', description: 'Radijatori su hladni već dva dana', priority: 'high', status: 'forwarded' },
      { title: 'Prljav ulaz zgrade', description: 'Ulaz nije čišćen nedelju dana', priority: 'low', status: 'forwarded' },
      { title: 'Škripi vrata na ulazu', description: 'Glavna vrata jako škripe i teško se otvaraju', priority: 'medium', status: 'forwarded' }
    ];

    const createdIssues = [];
    for (const issueData of testIssues) {
      const issue = new Issue({
        title: issueData.title,
        description: issueData.description,
        priority: issueData.priority,
        status: issueData.status,
        apartment: apartment._id,
        createdBy: tenant._id
      });
      await issue.save();
      createdIssues.push(issue);
    }

    console.log(`Created ${createdIssues.length} test issues`);
    res.json({ 
      message: `Created ${createdIssues.length} test issues`,
      count: createdIssues.length 
    });
  } catch (err) {
    console.error('Seed issues error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend API is running');
});

const PORT = process.env.PORT || 5000;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✅ BACKEND RUNNING - Server listening on port ${PORT}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}`);
    console.log(`✅ MONGO RUNNING ✅ BACKEND RUNNING - Ready to accept requests!\n`);
  });
}

// Export app for testing
module.exports = app;
