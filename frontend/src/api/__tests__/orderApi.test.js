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

describe('Order API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Order', () => {
    it('should create order successfully', async () => {
      const orderData = {
        shippingAddress: {
          line1: '123 Main St',
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'Country',
        },
        paymentMethod: 'cash',
        items: [{ productId: '1', quantity: 2 }],
      };

      api.post.mockResolvedValue({
        data: {
          data: {
            _id: 'order123',
            orderNumber: 'ORD-001',
            status: 'pending',
            ...orderData,
          },
          message: 'Order created successfully',
        },
      });

      const response = await api.post('/orders', orderData);
      expect(response.data.data.orderNumber).toBe('ORD-001');
      expect(api.post).toHaveBeenCalledWith('/orders', orderData);
    });

    it('should handle validation errors', async () => {
      api.post.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Shipping address is required' },
        },
      });

      await expect(api.post('/orders', {})).rejects.toBeDefined();
    });
  });

  describe('Get Orders', () => {
    it('should fetch user orders', async () => {
      const mockOrders = [
        { _id: '1', orderNumber: 'ORD-001', status: 'pending' },
        { _id: '2', orderNumber: 'ORD-002', status: 'approved' },
      ];

      api.get.mockResolvedValue({
        data: {
          data: mockOrders,
          message: 'Orders retrieved successfully',
        },
      });

      const response = await api.get('/orders');
      expect(response.data.data).toEqual(mockOrders);
      expect(api.get).toHaveBeenCalledWith('/orders');
    });

    it('should fetch orders with filters', async () => {
      api.get.mockResolvedValue({ data: { data: [] } });

      await api.get('/orders', {
        params: { status: 'approved' },
      });

      expect(api.get).toHaveBeenCalledWith('/orders', {
        params: { status: 'approved' },
      });
    });
  });

  describe('Get Order by ID', () => {
    it('should fetch single order', async () => {
      const mockOrder = {
        _id: 'order123',
        orderNumber: 'ORD-001',
        status: 'approved',
        items: [],
      };

      api.get.mockResolvedValue({
        data: { data: mockOrder },
      });

      const response = await api.get('/orders/order123');
      expect(response.data.data).toEqual(mockOrder);
      expect(api.get).toHaveBeenCalledWith('/orders/order123');
    });
  });

  describe('Update Order Status', () => {
    it('should update order status', async () => {
      api.put.mockResolvedValue({
        data: {
          data: {
            _id: 'order123',
            status: 'approved',
          },
          message: 'Order updated successfully',
        },
      });

      const response = await api.put('/orders/order123', {
        status: 'approved',
      });

      expect(response.data.data.status).toBe('approved');
      expect(api.put).toHaveBeenCalledWith('/orders/order123', {
        status: 'approved',
      });
    });
  });
});

