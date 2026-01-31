/**
 * Notice Service
 * Handles building notices and tenant notifications
 */

const Notice = require('../models/Notice');
const Poll = require('../models/Poll');
const Building = require('../models/Building');
const NoticeRead = require('../models/NoticeRead');

/**
 * Create a building notice
 * @param {string} buildingId
 * @param {Object} data - { title, body, attachment }
 * @returns {Promise<Object>}
 */
async function createNotice(buildingId, data) {
  const { title, body, attachment } = data;

  if (!title || !title.trim()) throw { status: 400, message: 'Title required' };
  if (!body || !body.trim()) throw { status: 400, message: 'Body required' };

  const building = await Building.findById(buildingId);
  if (!building) throw { status: 404, message: 'Building not found' };

  const notice = new Notice({
    building: buildingId,
    title: title.trim(),
    body: body.trim(),
    attachment: attachment || null
  });

  await notice.save();
  return { message: 'Notice created', notice };
}

/**
 * Get all notices for a building (tenant can see)
 * @param {string} buildingId
 * @returns {Promise<Array>}
 */
async function getNoticesByBuilding(buildingId) {
  return await Notice.find({ building: buildingId })
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get notices for a tenant (from their building)
 * @param {string} tenantId - User ID of tenant
 * @param {string} buildingId - Building ID of tenant
 * @returns {Promise<Array>}
 */
async function getTenantNotices(tenantId, buildingId) {
  const notices = await Notice.find({ building: buildingId })
    .sort({ createdAt: -1 })
    .lean();

  // Attach read status for tenant
  const reads = await NoticeRead.find({ tenant: tenantId }).lean();
  const readIds = new Set(reads.map(r => String(r.notice)));

  return notices.map(notice => ({
    ...notice,
    isRead: readIds.has(String(notice._id))
  }));
}

/**
 * Mark notice as read by tenant
 * @param {string} noticeId
 * @param {string} tenantId
 * @returns {Promise<Object>}
 */
async function markNoticeAsRead(noticeId, tenantId) {
  const notice = await Notice.findById(noticeId);
  if (!notice) throw { status: 404, message: 'Notice not found' };

  // Check if already read
  const existing = await NoticeRead.findOne({ notice: noticeId, tenant: tenantId });
  if (existing) return { message: 'Already marked as read' };

  const read = new NoticeRead({ notice: noticeId, tenant: tenantId });
  await read.save();

  return { message: 'Marked as read' };
}

/**
 * Create a poll for a building
 * @param {string} buildingId
 * @param {Object} data - { question, options }
 * @returns {Promise<Object>}
 */
async function createPoll(buildingId, data) {
  const { question, options } = data;

  if (!question || !question.trim()) throw { status: 400, message: 'Question required' };
  if (!Array.isArray(options) || options.length < 2) {
    throw { status: 400, message: 'At least 2 options required' };
  }

  const building = await Building.findById(buildingId);
  if (!building) throw { status: 404, message: 'Building not found' };

  const poll = new Poll({
    building: buildingId,
    question: question.trim(),
    options: options.map(opt => opt.trim()).filter(opt => opt)
  });

  await poll.save();
  return { message: 'Poll created', poll };
}

/**
 * Get polls for a building
 * @param {string} buildingId
 * @returns {Promise<Array>}
 */
async function getPollsByBuilding(buildingId) {
  return await Poll.find({ building: buildingId })
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Vote on a poll
 * @param {string} pollId
 * @param {string} tenantId - User ID of tenant
 * @param {string} option
 * @returns {Promise<Object>}
 */
async function votePoll(pollId, tenantId, option) {
  if (!option || !option.trim()) throw { status: 400, message: 'Option required' };

  const poll = await Poll.findById(pollId);
  if (!poll) throw { status: 404, message: 'Poll not found' };

  if (!poll.options.includes(option.trim())) {
    throw { status: 400, message: 'Invalid option' };
  }

  // Check if already voted
  const existing = await Poll.findOne({
    _id: pollId,
    voters: { $elemMatch: { voter: tenantId } }
  });

  if (existing) throw { status: 400, message: 'Already voted' };

  // Add vote
  poll.voters.push({
    voter: tenantId,
    vote: option.trim()
  });

  await poll.save();
  return { message: 'Vote recorded', poll };
}

/**
 * Get poll results (admin/manager view)
 * @param {string} pollId
 * @returns {Promise<Object>}
 */
async function getPollResults(pollId) {
  const poll = await Poll.findById(pollId);
  if (!poll) throw { status: 404, message: 'Poll not found' };

  const results = {};
  poll.options.forEach(opt => {
    results[opt] = poll.voters.filter(v => v.vote === opt).length;
  });

  return {
    poll: {
      _id: poll._id,
      question: poll.question,
      options: poll.options
    },
    results,
    totalVotes: poll.voters.length
  };
}

module.exports = {
  createNotice,
  getNoticesByBuilding,
  getTenantNotices,
  markNoticeAsRead,
  createPoll,
  getPollsByBuilding,
  votePoll,
  getPollResults
};
