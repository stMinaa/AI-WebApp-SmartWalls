/* eslint-disable max-nested-callbacks */
'use strict';

const NoticeService = require('../../../src/application/service/NoticeService');

function makeRepo(overrides = {}) {
  return {
    findById: jest.fn(),
    deleteById: jest.fn(),
    ...overrides
  };
}

describe('NoticeService', () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = makeRepo();
    service = new NoticeService(repo);
  });

  describe('deleteNotice', () => {
    it('throws 404 when notice not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.deleteNotice('someId')).rejects.toMatchObject({ status: 404 });
    });

    it('deletes notice when found', async () => {
      repo.findById.mockResolvedValue({ _id: 'noticeId' });
      repo.deleteById.mockResolvedValue();

      await service.deleteNotice('noticeId');
      expect(repo.deleteById).toHaveBeenCalledWith('noticeId');
    });
  });
});
