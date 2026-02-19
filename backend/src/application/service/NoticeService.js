class NoticeService {
  constructor(noticeRepository) {
    this.repo = noticeRepository;
  }

  async deleteNotice(noticeId) {
    const notice = await this.repo.findById(noticeId);
    if (!notice) {
      const err = new Error('Notice not found');
      err.status = 404;
      throw err;
    }
    await this.repo.deleteById(noticeId);
  }
}

module.exports = NoticeService;
