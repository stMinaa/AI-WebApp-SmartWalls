/* eslint-disable max-nested-callbacks */
'use strict';

const PollController = require('../../../../src/adapter/http/controllers/PollController');
const ValidationError = require('../../../../src/domain/exception/ValidationError');

function makeService(overrides = {}) {
  return {
    vote: jest.fn(),
    close: jest.fn(),
    ...overrides
  };
}

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('PollController', () => {
  let service;
  let controller;

  beforeEach(() => {
    service = makeService();
    controller = new PollController(service);
  });

  describe('vote', () => {
    it('returns 200 on success', async () => {
      service.vote.mockResolvedValue({ _id: 'poll1' });
      const req = { params: { pollId: 'poll1' }, user: { userId: 'user1' }, body: { option: 'A' } };
      const res = makeRes();
      await controller.vote(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 400 on ValidationError', async () => {
      service.vote.mockRejectedValue(new ValidationError('Option is required'));
      const req = { params: { pollId: 'poll1' }, user: { userId: 'user1' }, body: {} };
      const res = makeRes();
      await controller.vote(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when poll not found', async () => {
      const err = new Error('Poll not found');
      err.status = 404;
      service.vote.mockRejectedValue(err);
      const req = { params: { pollId: 'poll1' }, user: { userId: 'user1' }, body: { option: 'A' } };
      const res = makeRes();
      await controller.vote(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 500 on unexpected error', async () => {
      service.vote.mockRejectedValue(new Error('DB error'));
      const req = { params: { pollId: 'poll1' }, user: { userId: 'user1' }, body: { option: 'A' } };
      const res = makeRes();
      await controller.vote(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('close', () => {
    it('returns 200 on success', async () => {
      service.close.mockResolvedValue({ _id: 'poll1', closedAt: new Date() });
      const req = { params: { pollId: 'poll1' } };
      const res = makeRes();
      await controller.close(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 when poll not found', async () => {
      const err = new Error('Poll not found');
      err.status = 404;
      service.close.mockRejectedValue(err);
      const res = makeRes();
      await controller.close({ params: { pollId: 'x' } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 500 on unexpected error', async () => {
      service.close.mockRejectedValue(new Error('DB error'));
      const res = makeRes();
      await controller.close({ params: { pollId: 'x' } }, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
