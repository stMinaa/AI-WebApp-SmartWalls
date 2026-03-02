const NotFoundException = require('../../domain/exception/NotFoundException');
const ValidationError = require('../../domain/exception/ValidationError');

class NoticeService {
  constructor(noticeRepository) {
    this.repo = noticeRepository;
  }

  async listByBuilding(buildingId) {
    return this.repo.findByBuilding(buildingId);
  }

  async create(buildingId, { title, content }, author) {
    if (!content?.trim()) throw new ValidationError('Content is required');
    return this.repo.create({
      building: buildingId,
      author: author.id,
      authorName: author.username,
      authorRole: author.role,
      title: title?.trim() || undefined,
      content
    });
  }

  async deleteNotice(noticeId) {
    const notice = await this.repo.findById(noticeId);
    if (!notice) throw new NotFoundException('Notice not found');
    await this.repo.deleteById(noticeId);
  }
}

module.exports = NoticeService;
