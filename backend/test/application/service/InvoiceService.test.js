/* eslint-disable max-nested-callbacks */
'use strict';

const InvoiceService = require('../../../src/application/service/InvoiceService');
const ValidationError = require('../../../src/domain/exception/ValidationError');

function makeRepo(overrides = {}) {
  return {
    findAll: jest.fn(),
    findUnpaid: jest.fn(),
    findById: jest.fn(),
    findByIdPopulated: jest.fn(),
    findAssociate: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    deleteOne: jest.fn(),
    ...overrides
  };
}

describe('InvoiceService', () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = makeRepo();
    service = new InvoiceService(repo);
  });

  describe('getAll', () => {
    it('returns all invoices with no filter', async () => {
      const invoices = [{ _id: '1' }];
      repo.findAll.mockResolvedValue(invoices);
      const result = await service.getAll({});
      expect(repo.findAll).toHaveBeenCalledWith({});
      expect(result).toBe(invoices);
    });

    it('passes paid filter when provided', async () => {
      repo.findAll.mockResolvedValue([]);
      await service.getAll({ paid: 'true' });
      expect(repo.findAll).toHaveBeenCalledWith({ paid: true });
    });

    it('passes paid=false filter', async () => {
      repo.findAll.mockResolvedValue([]);
      await service.getAll({ paid: 'false' });
      expect(repo.findAll).toHaveBeenCalledWith({ paid: false });
    });

    it('passes company filter when provided', async () => {
      repo.findAll.mockResolvedValue([]);
      await service.getAll({ company: 'Acme' });
      expect(repo.findAll).toHaveBeenCalledWith({ company: 'Acme' });
    });

    it('combines paid and company filters', async () => {
      repo.findAll.mockResolvedValue([]);
      await service.getAll({ paid: 'true', company: 'Acme' });
      expect(repo.findAll).toHaveBeenCalledWith({ paid: true, company: 'Acme' });
    });
  });

  describe('getUnpaid', () => {
    it('groups unpaid invoices by company with totals', async () => {
      repo.findUnpaid.mockResolvedValue([
        { company: 'Acme', amount: 100 },
        { company: 'Acme', amount: 50 },
        { company: 'Beta', amount: 200 }
      ]);
      const result = await service.getUnpaid();
      expect(result).toHaveLength(2);
      const acme = result.find((g) => g.company === 'Acme');
      expect(acme.total).toBe(150);
      expect(acme.invoices).toHaveLength(2);
      const beta = result.find((g) => g.company === 'Beta');
      expect(beta.total).toBe(200);
    });

    it('uses "Nepoznata firma" for invoices without company', async () => {
      repo.findUnpaid.mockResolvedValue([{ company: undefined, amount: 50 }]);
      const result = await service.getUnpaid();
      expect(result[0].company).toBe('Nepoznata firma');
    });
  });

  describe('create', () => {
    const validInput = {
      company: 'Acme',
      associateId: 'assoc1',
      title: 'Work',
      amount: 500,
      reason: 'Repair',
      buildingId: 'b1',
      issueId: 'i1'
    };
    const associate = { _id: 'assoc1', role: 'associate', firstName: 'John', lastName: 'Doe' };

    it('throws ValidationError when company missing', async () => {
      await expect(service.create({ ...validInput, company: '' })).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when associateId missing', async () => {
      await expect(service.create({ ...validInput, associateId: undefined })).rejects.toThrow(
        ValidationError
      );
    });

    it('throws ValidationError when title missing', async () => {
      await expect(service.create({ ...validInput, title: '' })).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when amount invalid', async () => {
      await expect(service.create({ ...validInput, amount: 0 })).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when associate not found', async () => {
      repo.findAssociate.mockResolvedValue(null);
      await expect(service.create(validInput)).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when user is not an associate', async () => {
      repo.findAssociate.mockResolvedValue({ _id: 'assoc1', role: 'tenant' });
      await expect(service.create(validInput)).rejects.toThrow(ValidationError);
    });

    it('creates invoice and returns populated result', async () => {
      repo.findAssociate.mockResolvedValue(associate);
      const savedInvoice = { _id: 'inv1' };
      repo.create.mockResolvedValue(savedInvoice);
      const populated = { _id: 'inv1', associate: { firstName: 'John' } };
      repo.findByIdPopulated.mockResolvedValue(populated);

      const result = await service.create(validInput);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          company: 'Acme',
          associate: 'assoc1',
          title: 'Work',
          amount: 500
        })
      );
      expect(result).toBe(populated);
    });
  });

  describe('markAsPaid', () => {
    it('throws ValidationError for invalid ObjectId', async () => {
      await expect(service.markAsPaid('bad-id')).rejects.toThrow(ValidationError);
    });

    it('throws 404 when invoice not found', async () => {
      repo.findById.mockResolvedValue(null);
      const validId = '507f1f77bcf86cd799439011';
      await expect(service.markAsPaid(validId)).rejects.toMatchObject({ status: 404 });
    });

    it('throws ValidationError when invoice already paid', async () => {
      repo.findById.mockResolvedValue({ paid: true });
      const validId = '507f1f77bcf86cd799439011';
      await expect(service.markAsPaid(validId)).rejects.toThrow(ValidationError);
    });

    it('marks invoice as paid and returns populated', async () => {
      const invoice = { _id: '507f1f77bcf86cd799439011', paid: false, paidDate: null };
      repo.findById.mockResolvedValue(invoice);
      repo.save.mockResolvedValue(invoice);
      const populated = { _id: invoice._id, paid: true };
      repo.findByIdPopulated.mockResolvedValue(populated);

      const result = await service.markAsPaid('507f1f77bcf86cd799439011');
      expect(invoice.paid).toBe(true);
      expect(invoice.paidDate).toBeDefined();
      expect(result).toBe(populated);
    });
  });

  describe('remove', () => {
    it('throws ValidationError for invalid ObjectId', async () => {
      await expect(service.remove('bad-id')).rejects.toThrow(ValidationError);
    });

    it('throws 404 when invoice not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toMatchObject({
        status: 404
      });
    });

    it('deletes invoice when found', async () => {
      const invoice = { _id: '507f1f77bcf86cd799439011' };
      repo.findById.mockResolvedValue(invoice);
      repo.deleteOne.mockResolvedValue();

      await service.remove('507f1f77bcf86cd799439011');
      expect(repo.deleteOne).toHaveBeenCalledWith(invoice);
    });
  });
});
