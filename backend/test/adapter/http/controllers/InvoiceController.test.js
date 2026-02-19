/* eslint-disable max-nested-callbacks */
'use strict';

const InvoiceController = require('../../../../src/adapter/http/controllers/InvoiceController');
const ValidationError = require('../../../../src/domain/exception/ValidationError');

function makeService(overrides = {}) {
  return {
    getAll: jest.fn(),
    getUnpaid: jest.fn(),
    create: jest.fn(),
    markAsPaid: jest.fn(),
    remove: jest.fn(),
    ...overrides
  };
}

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('InvoiceController', () => {
  let service;
  let controller;

  beforeEach(() => {
    service = makeService();
    controller = new InvoiceController(service);
  });

  describe('getAll', () => {
    it('returns 200 with invoices', async () => {
      const invoices = [{ _id: '1' }];
      service.getAll.mockResolvedValue(invoices);
      const req = { query: {} };
      const res = makeRes();
      await controller.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: invoices })
      );
    });

    it('returns 500 on error', async () => {
      service.getAll.mockRejectedValue(new Error('DB error'));
      const res = makeRes();
      await controller.getAll({ query: {} }, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUnpaid', () => {
    it('returns 200 with grouped unpaid invoices', async () => {
      const grouped = [{ company: 'Acme', total: 100, invoices: [] }];
      service.getUnpaid.mockResolvedValue(grouped);
      const res = makeRes();
      await controller.getUnpaid({}, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 on error', async () => {
      service.getUnpaid.mockRejectedValue(new Error('DB error'));
      const res = makeRes();
      await controller.getUnpaid({}, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create', () => {
    it('returns 201 on success', async () => {
      const invoice = { _id: 'inv1' };
      service.create.mockResolvedValue(invoice);
      const req = { body: { company: 'Acme', associateId: 'a1', title: 'Work', amount: 100 } };
      const res = makeRes();
      await controller.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 400 on ValidationError', async () => {
      service.create.mockRejectedValue(new ValidationError('Company name required'));
      const res = makeRes();
      await controller.create({ body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 500 on unexpected error', async () => {
      service.create.mockRejectedValue(new Error('DB error'));
      const res = makeRes();
      await controller.create({ body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('markAsPaid', () => {
    it('returns 200 on success', async () => {
      service.markAsPaid.mockResolvedValue({ _id: 'inv1', paid: true });
      const req = { params: { id: '507f1f77bcf86cd799439011' } };
      const res = makeRes();
      await controller.markAsPaid(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 400 on ValidationError', async () => {
      service.markAsPaid.mockRejectedValue(new ValidationError('Invalid ID'));
      const res = makeRes();
      await controller.markAsPaid({ params: { id: 'bad' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when not found', async () => {
      const err = new Error('Invoice not found');
      err.status = 404;
      service.markAsPaid.mockRejectedValue(err);
      const res = makeRes();
      await controller.markAsPaid({ params: { id: '507f1f77bcf86cd799439011' } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('remove', () => {
    it('returns 200 on success', async () => {
      service.remove.mockResolvedValue();
      const req = { params: { id: '507f1f77bcf86cd799439011' } };
      const res = makeRes();
      await controller.remove(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 when not found', async () => {
      const err = new Error('Invoice not found');
      err.status = 404;
      service.remove.mockRejectedValue(err);
      const res = makeRes();
      await controller.remove({ params: { id: '507f1f77bcf86cd799439011' } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
