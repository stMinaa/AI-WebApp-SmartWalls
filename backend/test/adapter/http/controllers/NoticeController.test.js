/* eslint-disable max-nested-callbacks */
'use strict';

const NoticeController = require('../../../../src/adapter/http/controllers/NoticeController');
const NotFoundException = require('../../../../src/domain/exception/NotFoundException');

function makeService(overrides = {}) {
  return {
    deleteNotice: jest.fn(),
    ...overrides
  };
}

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('NoticeController', () => {
  let service;
  let controller;

  beforeEach(() => {
    service = makeService();
    controller = new NoticeController(service);
  });

  describe('deleteNotice', () => {
    it('returns 200 on success', async () => {
      service.deleteNotice.mockResolvedValue();
      const req = { params: { noticeId: 'notice1' } };
      const res = makeRes();
      await controller.deleteNotice(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 when not found', async () => {
      service.deleteNotice.mockRejectedValue(new NotFoundException('Notice not found'));
      const res = makeRes();
      await controller.deleteNotice({ params: { noticeId: 'x' } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 500 on unexpected error', async () => {
      service.deleteNotice.mockRejectedValue(new Error('DB error'));
      const res = makeRes();
      await controller.deleteNotice({ params: { noticeId: 'x' } }, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
