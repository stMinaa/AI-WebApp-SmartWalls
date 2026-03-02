/**
 * Composition Root
 * Wires all dependencies as singletons — imported once by each route file.
 */

const AuthApplicationService = require('../application/service/AuthApplicationService');
const BuildingService = require('../application/service/BuildingService');
const InvoiceService = require('../application/service/InvoiceService');
const IssueService = require('../application/service/IssueService');
const NoticeService = require('../application/service/NoticeService');
const PollService = require('../application/service/PollService');
const TestService = require('../application/service/TestService');
const UserService = require('../application/service/UserService');
const AuthService = require('../domain/auth/AuthService');

const AuthController = require('./http/controllers/AuthController');
const BuildingController = require('./http/controllers/BuildingController');
const InvoiceController = require('./http/controllers/InvoiceController');
const IssueController = require('./http/controllers/IssueController');
const NoticeController = require('./http/controllers/NoticeController');
const PollController = require('./http/controllers/PollController');
const TestController = require('./http/controllers/TestController');
const UserController = require('./http/controllers/UserController');
const MongoApartmentRepository = require('./persistence/MongoApartmentRepository');
const MongoAuthRepository = require('./persistence/MongoAuthRepository');
const MongoBuildingRepository = require('./persistence/MongoBuildingRepository');
const MongoInvoiceRepository = require('./persistence/MongoInvoiceRepository');
const MongoIssueRepository = require('./persistence/MongoIssueRepository');
const MongoNoticeRepository = require('./persistence/MongoNoticeRepository');
const MongoPollRepository = require('./persistence/MongoPollRepository');
const MongoTestRepository = require('./persistence/MongoTestRepository');
const MongoUserRepository = require('./persistence/MongoUserRepository');

// --- Repositories ---
const apartmentRepo = new MongoApartmentRepository();
const authRepo = new MongoAuthRepository();
const buildingRepo = new MongoBuildingRepository();
const invoiceRepo = new MongoInvoiceRepository();
const issueRepo = new MongoIssueRepository();
const noticeRepo = new MongoNoticeRepository();
const pollRepo = new MongoPollRepository();
const testRepo = new MongoTestRepository();
const userRepo = new MongoUserRepository();

// --- Application services ---
const domainAuthService = new AuthService(userRepo);
const authAppService = new AuthApplicationService(authRepo, domainAuthService);
const buildingService = new BuildingService(buildingRepo, apartmentRepo, userRepo);
const invoiceService = new InvoiceService(invoiceRepo);
const issueService = new IssueService(issueRepo, userRepo, invoiceRepo);
const noticeService = new NoticeService(noticeRepo);
const pollService = new PollService(pollRepo);
const testService = new TestService(testRepo);
const userService = new UserService(userRepo);

// --- Controllers ---
const authController = new AuthController(authAppService);
const buildingController = new BuildingController(buildingService);
const invoiceController = new InvoiceController(invoiceService);
const issueController = new IssueController(issueService);
const noticeController = new NoticeController(noticeService);
const pollController = new PollController(pollService);
const testController = new TestController(testService);
const userController = new UserController(userService);

module.exports = {
  authController,
  buildingController,
  invoiceController,
  issueController,
  noticeController,
  pollController,
  testController,
  userController
};
