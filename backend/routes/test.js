/**
 * Test & Seed Routes
 * Development/testing endpoints for health checks and data seeding
 * Only available in test/development environments
 */

const express = require('express');

const router = express.Router();
const {
  USER_ROLES,
  ISSUE_STATUS,
  PRIORITY_LEVELS,
  HTTP_STATUS,
  ERROR_MESSAGES
} = require('../config/constants');
const { authenticateToken } = require('../middleware/authHelper');
const Apartment = require('../models/Apartment');
const Building = require('../models/Building');
const Issue = require('../models/Issue');
const Notice = require('../models/Notice');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');

// GET /api/test - Health check
router.get('/', (req, res) => {
  return ApiResponse.success(res, null, 'Backend is working!');
});

// GET /api/test/me - Test authentication
router.get('/me', authenticateToken, async (req, res) => {
  console.info('GET /api/test/me - User:', req.user);
  try {
    const user = await User.findOne({ username: req.user.username }).select('-password');
    return ApiResponse.success(res, { user }, 'Authentication working!');
  } catch (err) {
    console.error('Test me error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, err);
  }
});

async function createTestIssues(apartment, tenant) {
  const testIssues = [
    {
      title: 'Nema tople vode',
      description: 'U kupatilu nema tople vode već tri dana',
      priority: PRIORITY_LEVELS.HIGH
    },
    {
      title: 'Lift ne radi',
      description: 'Lift je zaglavio između spratova',
      priority: PRIORITY_LEVELS.HIGH
    },
    {
      title: 'Curi slavina u kuhinji',
      description: 'Slavina u kuhinji kaplje celu noć',
      priority: PRIORITY_LEVELS.MEDIUM
    },
    {
      title: 'Pukla sijalica u hodniku',
      description: 'Sijalica na trećem spratu je pregorela',
      priority: PRIORITY_LEVELS.LOW
    },
    {
      title: 'Nezatvoren prozor na stepeništu',
      description: 'Prozor na drugom spratu ne može da se zatvori',
      priority: PRIORITY_LEVELS.MEDIUM
    },
    {
      title: 'Nema grejanja u stanu',
      description: 'Radijatori su hladni već dva dana',
      priority: PRIORITY_LEVELS.HIGH
    },
    {
      title: 'Prljav ulaz zgrade',
      description: 'Ulaz nije čišćen nedelju dana',
      priority: PRIORITY_LEVELS.LOW
    },
    {
      title: 'Škripi vrata na ulazu',
      description: 'Glavna vrata jako škripe i teško se otvaraju',
      priority: PRIORITY_LEVELS.MEDIUM
    }
  ];

  const created = [];
  for (const data of testIssues) {
    const issue = new Issue({
      ...data,
      status: ISSUE_STATUS.FORWARDED,
      apartment: apartment._id,
      createdBy: tenant._id
    });
    await issue.save();
    created.push(issue);
  }
  return created;
}

async function createTestNotices(building, manager) {
  const contents = [
    'Obaveštenje o planiranom održavanju lifta 10. februara od 9h do 15h. Molimo stanare da ne koriste lift tog dana.',
    'Redovno čišćenje stepeništa je planirano svakog ponedeljka i četvrtka. Molimo stanare da ne ostavljaju predmete na stepeništu.',
    'Skupština stanara će se održati 15. februara u 18h u prostorijama zgrade. Molimo sve stanare da prisustvuju.',
    'Grejanje će biti isključeno 12. februara od 8h do 12h zbog servisa kotlarnice.',
    'Molimo stanare da vode računa o zatvaranju ulaznih vrata. Primećeno je da vrata često ostaju otvorena.',
    'Parking mesto broj 7 je trenutno van upotrebe zbog radova. Molimo stanare da koriste alternativna mesta.',
    'Novo radno vreme domara: ponedeljak-petak 8-16h, subota 9-13h. U slučaju hitnosti zovite 064-123-4567.'
  ];

  const created = [];
  for (const content of contents) {
    const notice = new Notice({
      building: building._id,
      author: manager._id,
      authorName: manager.username,
      authorRole: manager.role,
      content
    });
    await notice.save();
    created.push(notice);
  }
  return created;
}

// POST /api/test/seed-issues - Create test issues (dev only)
router.post('/seed-issues', authenticateToken, async (req, res) => {
  console.info('POST /api/test/seed-issues - User:', req.user?.username);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.role !== USER_ROLES.DIRECTOR) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: ERROR_MESSAGES.ONLY_DIRECTORS });
    }

    const apartment = await Apartment.findOne();
    const tenant = await User.findOne({ role: USER_ROLES.TENANT });
    if (!apartment || !tenant) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: 'Need at least one apartment and tenant to create issues' });
    }

    const created = await createTestIssues(apartment, tenant);
    console.info(`Created ${created.length} test issues`);
    return ApiResponse.success(
      res,
      { count: created.length },
      `Created ${created.length} test issues`
    );
  } catch (err) {
    console.error('Seed issues error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, err);
  }
});

// POST /api/test/seed-notices - Create test notices (dev only)
router.post('/seed-notices', authenticateToken, async (req, res) => {
  console.info('POST /api/test/seed-notices - User:', req.user?.username);
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user || user.role !== USER_ROLES.DIRECTOR) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: ERROR_MESSAGES.ONLY_DIRECTORS });
    }

    const building = await Building.findOne();
    const manager = await User.findOne({ role: USER_ROLES.MANAGER });
    if (!building || !manager) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: 'Need at least one building and manager to create notices' });
    }

    const created = await createTestNotices(building, manager);
    console.info(`Created ${created.length} test notices`);
    return ApiResponse.success(
      res,
      { count: created.length },
      `Created ${created.length} test notices`
    );
  } catch (err) {
    console.error('Seed notices error:', err);
    if (err.status) return ApiResponse.error(res, err.message, err.status);
    return ApiResponse.serverError(res, ERROR_MESSAGES.SERVER_ERROR, err);
  }
});

module.exports = router;
