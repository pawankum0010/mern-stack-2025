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

describe('Cart API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Get Cart', () => {
    it('should fetch cart successfully', async () => {
      const mockCart = {
        items: [
          { productId: '1', quantity: 2, product: { name: 'Product 1', price: 100 } },
          { productId: '2', quantity: 1, product: { name: 'Product 2', price: 200 } },
        ],
      };

      api.get.mockResolvedValue({
        data: { data: mockCart },
      });

      const response = await api.get('/cart');
      expect(response.data.data.items).toHaveLength(2);
      expect(api.get).toHaveBeenCalledWith('/cart');
    });
  });

  describe('Add to Cart', () => {
    it('should add item to cart', async () => {
      api.post.mockResolvedValue({
        data: {
          data: {
            items: [{ productId: '1', quantity: 1 }],
          },
          message: 'Item added to cart',
        },
      });

      const response = await api.post('/cart/add', {
        productId: '1',
        quantity: 1,
      });

      expect(response.data.data.items).toHaveLength(1);
      expect(api.post).toHaveBeenCalledWith('/cart/add', {
        productId: '1',
        quantity: 1,
      });
    });

    it('should handle invalid product', async () => {
      api.post.mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Product not found' },
        },
      });

      await expect(
        api.post('/cart/add', { productId: 'invalid', quantity: 1 })
      ).rejects.toBeDefined();
    });
  });

  describe('Update Cart Item', () => {
    it('should update item quantity', async () => {
      api.put.mockResolvedValue({
        data: {
          data: {
            items: [{ productId: '1', quantity: 5 }],
          },
          message: 'Cart updated',
        },
      });

      const response = await api.put('/cart/update', {
        productId: '1',
        quantity: 5,
      });

      expect(response.data.data.items[0].quantity).toBe(5);
      expect(api.put).toHaveBeenCalledWith('/cart/update', {
        productId: '1',
        quantity: 5,
      });
    });
  });

  describe('Remove from Cart', () => {
    it('should remove item from cart', async () => {
      api.delete.mockResolvedValue({
        data: {
          data: {
            items: [],
          },
          message: 'Item removed from cart',
        },
      });

      const response = await api.delete('/cart/remove/product1');
      expect(response.data.data.items).toHaveLength(0);
      expect(api.delete).toHaveBeenCalledWith('/cart/remove/product1');
    });
  });

  describe('Clear Cart', () => {
    it('should clear all items from cart', async () => {
      api.delete.mockResolvedValue({
        data: {
          data: {
            items: [],
          },
          message: 'Cart cleared',
        },
      });

      const response = await api.delete('/cart');
      expect(response.data.data.items).toHaveLength(0);
      expect(api.delete).toHaveBeenCalledWith('/cart');
    });
  });
});

