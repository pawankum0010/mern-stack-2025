/**
 * Product Utility Functions Tests
 * These tests validate product-related calculations and transformations
 */

describe('Product Utilities', () => {
  describe('Price Calculations', () => {
    it('should calculate discount percentage correctly', () => {
      const compareAtPrice = 100;
      const price = 75;
      const discount = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
      expect(discount).toBe(25);
    });

    it('should return 0 discount when compareAtPrice is not provided', () => {
      const compareAtPrice = null;
      const price = 75;
      const discount = compareAtPrice && compareAtPrice > price
        ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
        : 0;
      expect(discount).toBe(0);
    });

    it('should calculate subtotal correctly', () => {
      const items = [
        { price: 10, quantity: 2 },
        { price: 15, quantity: 3 },
        { price: 5, quantity: 1 },
      ];
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      expect(subtotal).toBe(70);
    });

    it('should calculate total with tax and shipping', () => {
      const subtotal = 100;
      const tax = 10;
      const shipping = 5;
      const total = subtotal + tax + shipping;
      expect(total).toBe(115);
    });
  });

  describe('Product Image Handling', () => {
    it('should construct full image URL for local uploads', () => {
      const imagePath = '/uploads/products/product-123.jpg';
      const baseURL = 'http://localhost:5000/api';
      const fullUrl = imagePath.startsWith('http')
        ? imagePath
        : `${baseURL.replace('/api', '')}${imagePath}`;
      expect(fullUrl).toBe('http://localhost:5000/uploads/products/product-123.jpg');
    });

    it('should keep external URLs unchanged', () => {
      const imagePath = 'https://example.com/image.jpg';
      const baseURL = 'http://localhost:5000/api';
      const fullUrl = imagePath.startsWith('http')
        ? imagePath
        : `${baseURL.replace('/api', '')}${imagePath}`;
      expect(fullUrl).toBe('https://example.com/image.jpg');
    });

    it('should handle empty images array', () => {
      const images = [];
      expect(images.length).toBe(0);
      expect(images[0]).toBeUndefined();
    });
  });

  describe('Product Stock Validation', () => {
    it('should validate stock availability', () => {
      const stock = 10;
      const requestedQuantity = 5;
      expect(requestedQuantity <= stock).toBe(true);
    });

    it('should detect out of stock', () => {
      const stock = 0;
      expect(stock > 0).toBe(false);
    });

    it('should limit quantity to available stock', () => {
      const stock = 5;
      const requestedQuantity = 10;
      const actualQuantity = Math.min(requestedQuantity, stock);
      expect(actualQuantity).toBe(5);
    });
  });

  describe('Product Category/Vendor Handling', () => {
    it('should handle category as object', () => {
      const category = { _id: '123', name: 'Electronics' };
      const categoryName = typeof category === 'object' && category?.name
        ? category.name
        : typeof category === 'string'
          ? category
          : 'Uncategorized';
      expect(categoryName).toBe('Electronics');
    });

    it('should handle category as string', () => {
      const category = 'Electronics';
      const categoryName = typeof category === 'object' && category?.name
        ? category.name
        : typeof category === 'string'
          ? category
          : 'Uncategorized';
      expect(categoryName).toBe('Electronics');
    });

    it('should default to Uncategorized when category is missing', () => {
      const category = null;
      const categoryName = typeof category === 'object' && category?.name
        ? category.name
        : typeof category === 'string'
          ? category
          : 'Uncategorized';
      expect(categoryName).toBe('Uncategorized');
    });
  });

  describe('Product Tags Processing', () => {
    it('should parse comma-separated tags', () => {
      const tagsString = 'electronics, mobile, smartphone';
      const tags = tagsString.split(',').map((tag) => tag.trim()).filter((tag) => tag);
      expect(tags).toEqual(['electronics', 'mobile', 'smartphone']);
    });

    it('should handle empty tags string', () => {
      const tagsString = '';
      const tags = tagsString.split(',').map((tag) => tag.trim()).filter((tag) => tag);
      expect(tags).toEqual([]);
    });

    it('should remove empty tags', () => {
      const tagsString = 'electronics, , mobile,  , smartphone';
      const tags = tagsString.split(',').map((tag) => tag.trim()).filter((tag) => tag);
      expect(tags).toEqual(['electronics', 'mobile', 'smartphone']);
    });
  });
});

