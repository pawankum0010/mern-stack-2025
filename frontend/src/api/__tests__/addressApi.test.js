import api from '../client';

// Mock axios
jest.mock('../client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: {
      baseURL: 'http://localhost:5000/api',
    },
  },
  setAuthToken: jest.fn(),
}));

describe('Address API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Get Addresses', () => {
    it('should fetch user addresses', async () => {
      const mockAddresses = [
        {
          _id: '1',
          type: 'shipping',
          line1: '123 Main St',
          city: 'City',
          isDefault: true,
        },
        {
          _id: '2',
          type: 'billing',
          line1: '456 Oak Ave',
          city: 'City',
          isDefault: false,
        },
      ];

      api.get.mockResolvedValue({
        data: { data: mockAddresses },
      });

      const response = await api.get('/addresses');
      expect(response.data.data).toHaveLength(2);
      expect(api.get).toHaveBeenCalledWith('/addresses');
    });
  });

  describe('Create Address', () => {
    it('should create address successfully', async () => {
      const addressData = {
        type: 'shipping',
        line1: '123 Main St',
        city: 'City',
        state: 'State',
        postalCode: '12345',
        country: 'Country',
        isDefault: true,
      };

      api.post.mockResolvedValue({
        data: {
          data: { _id: 'addr123', ...addressData },
          message: 'Address created successfully',
        },
      });

      const response = await api.post('/addresses', addressData);
      expect(response.data.data.line1).toBe('123 Main St');
      expect(api.post).toHaveBeenCalledWith('/addresses', addressData);
    });
  });

  describe('Update Address', () => {
    it('should update address', async () => {
      const updateData = {
        line1: 'Updated Address',
        city: 'New City',
      };

      api.put.mockResolvedValue({
        data: {
          data: { _id: 'addr123', ...updateData },
          message: 'Address updated successfully',
        },
      });

      const response = await api.put('/addresses/addr123', updateData);
      expect(response.data.data.line1).toBe('Updated Address');
      expect(api.put).toHaveBeenCalledWith('/addresses/addr123', updateData);
    });
  });

  describe('Delete Address', () => {
    it('should delete address', async () => {
      api.delete.mockResolvedValue({
        data: { message: 'Address deleted successfully' },
      });

      await api.delete('/addresses/addr123');
      expect(api.delete).toHaveBeenCalledWith('/addresses/addr123');
    });
  });

  describe('Set Default Address', () => {
    it('should set address as default', async () => {
      api.put.mockResolvedValue({
        data: {
          data: { _id: 'addr123', isDefault: true },
          message: 'Default address updated',
        },
      });

      const response = await api.put('/addresses/addr123', { isDefault: true });
      expect(response.data.data.isDefault).toBe(true);
    });
  });
});

