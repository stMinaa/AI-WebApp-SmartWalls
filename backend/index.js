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

    // Determine status based on role
    let status = 'pending';
    if (!role || role === 'tenant' || role === 'director') {
      status = 'active';
    }

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'tenant',
      status: status
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
        _id: user._id,
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
      .populate('manager', 'firstName lastName email')
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
    
    // Phase 2.5: Only managers can view issues via this endpoint
    if (!user || user.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers can view issues' });
    }

    const { status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Managers see issues from their buildings
    const buildings = await Building.find({ manager: user._id });
    const buildingIds = buildings.map(b => b._id);
    const apartments = await Apartment.find({ building: { $in: buildingIds } });
    const apartmentIds = apartments.map(a => a._id);
    filter.apartment = { $in: apartmentIds };

    const issues = await Issue.find(filter)
      .populate('apartment', 'unitNumber address')
      .populate({
        path: 'apartment',
        populate: {
          path: 'building',
          select: 'name address'
        }
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Flatten building from apartment.building to building for easier access
    const issuesWithBuilding = issues.map(issue => {
      const issueObj = issue.toObject();
      if (issueObj.apartment && issueObj.apartment.building) {
        issueObj.building = issueObj.apartment.building;
      }
      return issueObj;
    });

    console.log('Returning issues:', issuesWithBuilding.length);
    res.json(issuesWithBuilding);
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

// ===== APARTMENT ENDPOINTS =====

// POST /api/buildings/:id/apartments/bulk - Bulk create apartments (manager/director)
app.post('/api/buildings/:id/apartments/bulk', authenticateToken, async (req, res) => {
  console.log('POST /api/buildings/:id/apartments/bulk - User:', req.user?.username, 'Body:', req.body);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || !['manager', 'director'].includes(user.role)) {
      return res.status(403).json({ error: 'Only managers and directors can create apartments' });
    }

    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    // Check if building already has apartments
    const existingCount = await Apartment.countDocuments({ building: building._id });
    if (existingCount > 0) {
      return res.status(400).json({ error: 'Building already has apartments. Bulk create only works on empty buildings.' });
    }

    const { floors, unitsPerFloor, floorsSpec } = req.body;
    const apartments = [];

    if (floorsSpec) {
      // Advanced spec: custom floors (e.g., "2,3,5")
      const floorNumbers = floorsSpec.split(',').map(f => parseInt(f.trim()));
      
      for (const floorNum of floorNumbers) {
        // Floor 5 has 2 units, others have 4 units (as per test spec)
        const unitsOnFloor = (floorNum === 5) ? 2 : 4;
        
        for (let unit = 1; unit <= unitsOnFloor; unit++) {
          apartments.push({
            building: building._id,
            unitNumber: `${floorNum}0${unit}`
          });
        }
      }
    } else if (floors && unitsPerFloor) {
      // Simple replication: same units per floor
      for (let floor = 1; floor <= floors; floor++) {
        for (let unit = 1; unit <= unitsPerFloor; unit++) {
          apartments.push({
            building: building._id,
            unitNumber: `${floor}0${unit}`
          });
        }
      }
    } else {
      return res.status(400).json({ error: 'Either (floors + unitsPerFloor) or floorsSpec is required' });
    }

    const created = await Apartment.insertMany(apartments);
    console.log(`Created ${created.length} apartments`);
    res.status(201).json({ message: `${created.length} apartments created`, count: created.length });
  } catch (err) {
    console.error('Bulk create apartments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/buildings/:id/apartments - Create single apartment (manager/director)
app.post('/api/buildings/:id/apartments', authenticateToken, async (req, res) => {
  console.log('POST /api/buildings/:id/apartments - User:', req.user?.username, 'Body:', req.body);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || !['manager', 'director'].includes(user.role)) {
      return res.status(403).json({ error: 'Only managers and directors can create apartments' });
    }

    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    const { unitNumber, address } = req.body;
    if (!unitNumber) {
      return res.status(400).json({ error: 'unitNumber is required' });
    }

    const apartment = await Apartment.create({
      building: building._id,
      unitNumber,
      address: address || building.address
    });

    console.log('Apartment created:', apartment._id);
    res.status(201).json({
      _id: apartment._id,
      building: apartment.building.toString(),
      unitNumber: apartment.unitNumber,
      address: apartment.address
    });
  } catch (err) {
    console.error('Create apartment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/buildings/:id/apartments - Get all apartments for building (authenticated)
app.get('/api/buildings/:id/apartments', authenticateToken, async (req, res) => {
  console.log('GET /api/buildings/:id/apartments - User:', req.user?.username);
  try {
    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    const apartments = await Apartment.find({ building: building._id }).sort('unitNumber');
    res.json(apartments);
  } catch (err) {
    console.error('Get apartments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== TENANT ENDPOINTS =====

// GET /api/buildings/:id/tenants - Get all tenants for building (manager/director)
app.get('/api/buildings/:id/tenants', authenticateToken, async (req, res) => {
  console.log('GET /api/buildings/:id/tenants - User:', req.user?.username);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || !['manager', 'director'].includes(user.role)) {
      return res.status(403).json({ error: 'Only managers and directors can view tenants' });
    }

    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    // Find all tenants assigned to this building
    const tenants = await User.find({ 
      building: building._id,
      role: 'tenant'
    })
      .populate('apartment', 'unitNumber')
      .populate('building', 'name address')
      .select('username email firstName lastName apartment building createdAt');

    res.json(tenants);
  } catch (err) {
    console.error('Get tenants error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tenants/:id - Delete tenant and free apartment (manager/director)
app.delete('/api/tenants/:id', authenticateToken, async (req, res) => {
  console.log('DELETE /api/tenants/:id - User:', req.user?.username, 'Tenant:', req.params.id);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || !['manager', 'director'].includes(user.role)) {
      return res.status(403).json({ error: 'Only managers and directors can delete tenants' });
    }

    const tenant = await User.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // If tenant has an apartment, free it
    if (tenant.apartment) {
      await Apartment.findByIdAndUpdate(tenant.apartment, { tenant: null });
      console.log('Freed apartment:', tenant.apartment);
    }

    await User.findByIdAndDelete(req.params.id);
    console.log('Tenant deleted:', tenant.username);
    res.json({ message: 'Tenant deleted successfully' });
  } catch (err) {
    console.error('Delete tenant error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tenants/:id/assign - Assign tenant to apartment
app.post('/api/tenants/:id/assign', authenticateToken, async (req, res) => {
  console.log(`POST /api/tenants/:id/assign - User: ${req.user.username} Body:`, req.body);

  try {
    // Check if user is manager or director
    const user = await User.findOne({ username: req.user.username });
    console.log(`Found user: ${user.username} Role: ${user.role}`);

    if (!user || (user.role !== 'manager' && user.role !== 'director')) {
      return res.status(403).json({ error: 'Only managers and directors can assign tenants' });
    }

    const { apartmentId, buildingId, numPeople } = req.body;

    // Validate required fields
    if (!apartmentId || !buildingId) {
      return res.status(400).json({ error: 'apartmentId and buildingId are required' });
    }

    // Find tenant
    const tenant = await User.findById(req.params.id);
    if (!tenant || tenant.role !== 'tenant') {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Find apartment
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    // Check if apartment is already occupied by another tenant
    if (apartment.tenant && apartment.tenant.toString() !== tenant._id.toString()) {
      return res.status(400).json({ error: 'Apartment is already occupied by another tenant' });
    }

    // If tenant is being reassigned to a different apartment, free the old one
    if (tenant.apartment && tenant.apartment.toString() !== apartmentId) {
      await Apartment.findByIdAndUpdate(tenant.apartment, {
        tenant: null,
        numPeople: 0
      });
      console.log('Freed old apartment:', tenant.apartment);
    }

    // Update tenant
    tenant.apartment = apartmentId;
    tenant.building = buildingId;
    await tenant.save();

    // Update apartment
    apartment.tenant = tenant._id;
    apartment.numPeople = numPeople || 1;
    await apartment.save();

    console.log('Tenant assigned successfully:', tenant._id, 'to apartment:', apartmentId);
    res.json({ message: 'Tenant assigned successfully' });
  } catch (err) {
    console.error('Assign tenant error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tenants/me/apartment - Tenant views their apartment and building info
app.get('/api/tenants/me/apartment', authenticateToken, async (req, res) => {
  console.log(`GET /api/tenants/me/apartment - User: ${req.user.username}`);

  try {
    // Check if user is tenant
    const user = await User.findOne({ username: req.user.username });
    console.log(`Found user: ${user.username} Role: ${user.role}`);

    if (!user || user.role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can view apartment info' });
    }

    // Check if tenant has an apartment assigned
    if (!user.apartment) {
      return res.status(404).json({ error: 'You are not assigned to any apartment yet' });
    }

    // Fetch apartment with building info
    const apartment = await Apartment.findById(user.apartment);
    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    const building = await Building.findById(apartment.building)
      .populate('manager', 'firstName lastName email');
    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    // Get apartment count for building
    const apartmentCount = await Apartment.countDocuments({ building: building._id });

    console.log('Tenant apartment info retrieved successfully');
    res.json({
      apartment: {
        _id: apartment._id,
        unitNumber: apartment.unitNumber,
        address: apartment.address,
        numPeople: apartment.numPeople,
        floor: apartment.floor
      },
      building: {
        _id: building._id,
        name: building.name,
        address: building.address,
        imageUrl: building.imageUrl,
        apartmentCount: apartmentCount,
        manager: building.manager
      }
    });
  } catch (err) {
    console.error('Get tenant apartment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== PHASE 3.2: TENANT REPORTS ISSUES =====
// POST /api/issues - Tenant creates an issue
app.post('/api/issues', authenticateToken, async (req, res) => {
  try {
    console.log(`POST /api/issues - User: ${req.user.username} Body:`, req.body);
    
    // Fetch user
    const user = await User.findOne({ username: req.user.username });
    console.log(`Found user: ${user.username} Role: ${user.role}`);
    
    // Check if user is a tenant
    if (!user || user.role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can report issues' });
    }
    
    // Check if tenant is assigned to an apartment
    if (!user.apartment) {
      return res.status(404).json({ error: 'You are not assigned to any apartment yet' });
    }
    
    const { title, description, priority } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    // Validate priority if provided
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority. Must be low, medium, or high' });
    }
    
    // Fetch apartment to get building
    const apartment = await Apartment.findById(user.apartment);
    
    // Create issue
    const issue = new Issue({
      createdBy: user._id,
      apartment: user.apartment,
      building: apartment.building,
      title: title.trim(),
      description: description.trim(),
      priority: priority || 'medium',
      status: 'reported'
    });
    
    await issue.save();
    console.log(`Issue created: ${issue._id}`);
    
    res.status(201).json({ issue });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== PHASE 3.3: TENANT VIEWS THEIR OWN ISSUES =====
// GET /api/issues/my - Tenant views their reported issues
app.get('/api/issues/my', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/issues/my - User: ${req.user.username} Query:`, req.query);
    
    // Fetch user
    const user = await User.findOne({ username: req.user.username });
    console.log(`Found user: ${user.username} Role: ${user.role}`);
    
    // Check if user is a tenant
    if (!user || user.role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can view their issues' });
    }
    
    const { status, priority } = req.query;
    const filter = { createdBy: user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    const issues = await Issue.find(filter)
      .populate('apartment', 'unitNumber address')
      .populate({
        path: 'apartment',
        populate: {
          path: 'building',
          select: 'name address'
        }
      })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    // Flatten building from apartment.building to building for easier access
    const issuesWithBuilding = issues.map(issue => {
      const issueObj = issue.toObject();
      if (issueObj.apartment && issueObj.apartment.building) {
        issueObj.building = issueObj.apartment.building;
      }
      return issueObj;
    });
    
    console.log(`Tenant issues retrieved: ${issuesWithBuilding.length}`);
    res.json(issuesWithBuilding);
  } catch (error) {
    console.error('Error retrieving tenant issues:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== PHASE 4.1: ASSOCIATE VIEWS ASSIGNED JOBS =====
// GET /api/associates/me/jobs - Associate views their assigned jobs
app.get('/api/associates/me/jobs', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/associates/me/jobs - User: ${req.user.username} Query:`, req.query);
    
    // Fetch user
    const user = await User.findOne({ username: req.user.username });
    console.log(`Found user: ${user.username} Role: ${user.role}`);
    
    // Check if user is an associate
    if (!user || user.role !== 'associate') {
      return res.status(403).json({ error: 'Only associates can view their jobs' });
    }
    
    const { status, priority } = req.query;
    const filter = { assignedTo: user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    const jobs = await Issue.find(filter)
      .populate('apartment', 'unitNumber address')
      .populate({
        path: 'apartment',
        populate: {
          path: 'building',
          select: 'name address'
        }
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'username firstName lastName email company')
      .sort({ createdAt: -1 });
    
    // Flatten building from apartment.building to building for easier access
    const jobsWithBuilding = jobs.map(job => {
      const jobObj = job.toObject();
      if (jobObj.apartment && jobObj.apartment.building) {
        jobObj.building = jobObj.apartment.building;
      }
      return jobObj;
    });
    
    console.log(`Associate jobs retrieved: ${jobsWithBuilding.length}`);
    res.json(jobsWithBuilding);
  } catch (error) {
    console.error('Error retrieving associate jobs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== PHASE 4.2: ASSOCIATE ACCEPTS JOB WITH COST =====
// POST /api/issues/:id/accept - Associate accepts assigned job with cost estimate
app.post('/api/issues/:id/accept', authenticateToken, async (req, res) => {
  try {
    console.log(`POST /api/issues/${req.params.id}/accept - User: ${req.user.username}`);
    
    // Fetch user
    const user = await User.findOne({ username: req.user.username });
    
    // Check if user is an associate
    if (!user || user.role !== 'associate') {
      return res.status(403).json({ error: 'Only associates can accept jobs' });
    }
    
    // Validate estimatedCost
    const { estimatedCost } = req.body;
    if (estimatedCost === undefined || estimatedCost === null) {
      return res.status(400).json({ error: 'estimatedCost is required' });
    }
    if (typeof estimatedCost !== 'number' || isNaN(estimatedCost)) {
      return res.status(400).json({ error: 'estimatedCost must be a valid number' });
    }
    if (estimatedCost < 0) {
      return res.status(400).json({ error: 'estimatedCost must be a positive number' });
    }
    
    // Find issue
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    // Check if issue is assigned to this associate
    if (!issue.assignedTo || issue.assignedTo.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'This issue is not assigned to you' });
    }
    
    // Check if issue is in assigned status
    if (issue.status !== 'assigned') {
      return res.status(400).json({ error: 'Issue must be in assigned status to accept' });
    }
    
    // Update issue
    issue.status = 'in-progress';
    issue.cost = estimatedCost;
    await issue.save();
    
    // Populate and return
    const updated = await Issue.findById(issue._id)
      .populate('apartment', 'unitNumber address')
      .populate({
        path: 'apartment',
        populate: {
          path: 'building',
          select: 'name address'
        }
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'username firstName lastName email company');
    
    // Flatten building
    const issueObj = updated.toObject();
    if (issueObj.apartment && issueObj.apartment.building) {
      issueObj.building = issueObj.apartment.building;
    }
    
    console.log(`Issue ${issue._id} accepted with cost $${estimatedCost}`);
    res.json(issueObj);
  } catch (error) {
    console.error('Error accepting job:', error);
    res.status(500).json({ error: 'Server error' });
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
