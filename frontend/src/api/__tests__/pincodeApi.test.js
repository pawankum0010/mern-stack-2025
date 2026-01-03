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

describe('Pincode API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Get Pincodes', () => {
    it('should fetch pincodes successfully', async () => {
      const mockPincodes = [
        { _id: '1', pincode: '123456', shippingCharge: 50, status: 'active' },
        { _id: '2', pincode: '789012', shippingCharge: 75, status: 'active' },
      ];

      api.get.mockResolvedValue({
        data: {
          data: mockPincodes,
        },
      });

      const response = await api.get('/pincodes');
      expect(response.data.data).toEqual(mockPincodes);
      expect(api.get).toHaveBeenCalledWith('/pincodes');
    });

    it('should fetch pincode by code', async () => {
      const mockPincode = { _id: '1', pincode: '123456', shippingCharge: 50, status: 'active' };

      api.get.mockResolvedValue({
        data: {
          data: mockPincode,
        },
      });

      const response = await api.get('/pincodes/code/123456');
      expect(response.data.data).toEqual(mockPincode);
      expect(api.get).toHaveBeenCalledWith('/pincodes/code/123456');
    });
  });

  describe('Create Pincode', () => {
    it('should create pincode successfully', async () => {
      const newPincode = {
        pincode: '123456',
        shippingCharge: 50,
        status: 'active',
      };

      api.post.mockResolvedValue({
        data: {
          data: { _id: '1', ...newPincode },
        },
      });

      const response = await api.post('/pincodes', newPincode);
      expect(response.data.data.pincode).toBe('123456');
      expect(api.post).toHaveBeenCalledWith('/pincodes', newPincode);
    });
  });

  describe('Update Pincode', () => {
    it('should update pincode successfully', async () => {
      const updatedPincode = {
        shippingCharge: 75,
        status: 'active',
      };

      api.put.mockResolvedValue({
        data: {
          data: { _id: '1', pincode: '123456', ...updatedPincode },
        },
      });

      const response = await api.put('/pincodes/1', updatedPincode);
      expect(response.data.data.shippingCharge).toBe(75);
      expect(api.put).toHaveBeenCalledWith('/pincodes/1', updatedPincode);
    });
  });

  describe('Delete Pincode', () => {
    it('should delete pincode successfully', async () => {
      api.delete.mockResolvedValue({
        data: {
          message: 'Pincode deleted successfully',
        },
      });

      await api.delete('/pincodes/1');
      expect(api.delete).toHaveBeenCalledWith('/pincodes/1');
    });
  });

  describe('Get Notifications', () => {
    it('should fetch pincode notifications successfully', async () => {
      const mockNotifications = [
        {
          _id: '1',
          pincode: '123456',
          status: 'pending',
          userId: 'user1',
        },
      ];

      api.get.mockResolvedValue({
        data: {
          data: mockNotifications,
        },
      });

      const response = await api.get('/pincodes/notifications');
      expect(response.data.data).toEqual(mockNotifications);
      expect(api.get).toHaveBeenCalledWith('/pincodes/notifications');
    });
  });

  describe('Check Pincode', () => {
    it('should check if pincode exists', async () => {
      const mockResponse = {
        exists: true,
        shippingCharge: 50,
      };

      api.post.mockResolvedValue({
        data: {
          data: mockResponse,
        },
      });

      const response = await api.post('/pincodes/check', { pincode: '123456' });
      expect(response.data.data.exists).toBe(true);
      expect(api.post).toHaveBeenCalledWith('/pincodes/check', { pincode: '123456' });
    });
  });
});

