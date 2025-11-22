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

describe('Product API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Get Products', () => {
    it('should fetch products successfully', async () => {
      const mockProducts = [
        { _id: '1', name: 'Product 1', price: 100 },
        { _id: '2', name: 'Product 2', price: 200 },
      ];

      api.get.mockResolvedValue({
        data: {
          data: mockProducts,
          pagination: { page: 1, limit: 20, total: 2, pages: 1 },
        },
      });

      const response = await api.get('/products');
      expect(response.data.data).toEqual(mockProducts);
      expect(api.get).toHaveBeenCalledWith('/products');
    });

    it('should fetch products with filters', async () => {
      api.get.mockResolvedValue({ data: { data: [] } });

      await api.get('/products', {
        params: { category: 'electronics', minPrice: 100, maxPrice: 500 },
      });

      expect(api.get).toHaveBeenCalledWith('/products', {
        params: { category: 'electronics', minPrice: 100, maxPrice: 500 },
      });
    });

    it('should handle API errors', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await expect(api.get('/products')).rejects.toThrow('Network error');
    });
  });

  describe('Get Product by ID', () => {
    it('should fetch single product', async () => {
      const mockProduct = {
        _id: '123',
        name: 'Test Product',
        price: 100,
        description: 'Test description',
      };

      api.get.mockResolvedValue({ data: { data: mockProduct } });

      const response = await api.get('/products/123');
      expect(response.data.data).toEqual(mockProduct);
      expect(api.get).toHaveBeenCalledWith('/products/123');
    });

    it('should handle product not found', async () => {
      api.get.mockRejectedValue({
        response: { status: 404, data: { message: 'Product not found' } },
      });

      await expect(api.get('/products/invalid')).rejects.toBeDefined();
    });
  });

  describe('Create Product', () => {
    it('should create product with FormData', async () => {
      const formData = new FormData();
      formData.append('name', 'New Product');
      formData.append('price', '100');

      api.post.mockResolvedValue({
        data: {
          data: { _id: '123', name: 'New Product', price: 100 },
          message: 'Product created successfully',
        },
      });

      const response = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      expect(response.data.data.name).toBe('New Product');
      expect(api.post).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      api.post.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Name and price are required' },
        },
      });

      await expect(api.post('/products', {})).rejects.toBeDefined();
    });
  });

  describe('Update Product', () => {
    it('should update product', async () => {
      const formData = new FormData();
      formData.append('name', 'Updated Product');
      formData.append('price', '150');

      api.put.mockResolvedValue({
        data: {
          data: { _id: '123', name: 'Updated Product', price: 150 },
          message: 'Product updated successfully',
        },
      });

      const response = await api.put('/products/123', formData);
      expect(response.data.data.name).toBe('Updated Product');
      expect(api.put).toHaveBeenCalledWith('/products/123', formData);
    });
  });

  describe('Delete Product', () => {
    it('should delete product', async () => {
      api.delete.mockResolvedValue({
        data: { message: 'Product deleted successfully' },
      });

      await api.delete('/products/123');
      expect(api.delete).toHaveBeenCalledWith('/products/123');
    });

    it('should handle delete errors', async () => {
      api.delete.mockRejectedValue({
        response: { status: 404, data: { message: 'Product not found' } },
      });

      await expect(api.delete('/products/invalid')).rejects.toBeDefined();
    });
  });
});

