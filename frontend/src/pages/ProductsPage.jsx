import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { gsap } from 'gsap';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api/client';

const initialFormState = {
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  sku: '',
  category: '',
  tags: '',
  images: '',
  stock: '',
  status: 'active',
  featured: false,
  weight: '',
  weightUnit: '',
  vendor: '',
  brand: '',
  color: '',
  size: '',
  material: '',
  dimensionsLength: '',
  dimensionsWidth: '',
  dimensionsHeight: '',
  dimensionUnit: 'cm',
  warranty: '',
  shippingInfo: '',
  returnPolicy: '',
  specifications: '',
};

const ProductsPage = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  // data
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [weightUnits, setWeightUnits] = useState([]);
  const [sizes, setSizes] = useState([]);

  // ui state
  const [formState, setFormState] = useState(initialFormState);
  const [feedback, setFeedback] = useState({ type: null, message: null });
  const [submitting, setSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // drawer & edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  // refs for animation
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  // permissions
  const canManageProducts = useMemo(() => {
    const roleName = user?.role?.name?.toLowerCase();
    return roleName === 'superadmin' || roleName === 'admin';
  }, [user]);

  // --- data loaders ---
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data } = await api.get('/products', { params: { limit: 100 } });
      setProducts(data?.data || []);
    } catch (error) {
      if (error.response?.status === 404) setProducts([]);
      else setFeedback({ type: 'danger', message: error.message });
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const { data } = await api.get('/vendors', { params: { status: 'active' } });
      setVendors(data?.data || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories', { params: { status: 'active' } });
      setCategories(data?.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchWeightUnits = async () => {
    try {
      const { data } = await api.get('/weight-units', { params: { status: 'active' } });
      setWeightUnits(data?.data || []);
    } catch (error) {
      console.error('Failed to fetch weight units:', error);
    }
  };

  const fetchSizes = async () => {
    try {
      const { data } = await api.get('/sizes', { params: { status: 'active' } });
      setSizes(data?.data || []);
    } catch (error) {
      console.error('Failed to fetch sizes:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchVendors(), fetchCategories(), fetchWeightUnits(), fetchSizes()]);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (drawerRef.current) {
      gsap.to(drawerRef.current, {
        x: isDrawerOpen ? 0 : '100%',
        duration: 0.5,
        ease: 'power3.inOut',
      });
    }
    if (overlayRef.current) {
      overlayRef.current.style.pointerEvents = isDrawerOpen ? 'auto' : 'none';
      gsap.to(overlayRef.current, {
        opacity: isDrawerOpen ? 0.45 : 0,
        duration: 0.4,
        ease: 'power2.out',
      });
    }
  }, [isDrawerOpen]);

  const resetForm = () => {
    setFormState(initialFormState);
    setIsEditing(false);
    setEditingProductId(null);
    setSelectedImages([]);
    setExistingImages([]);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedImages((prev) => [...prev, ...files]);
  };

  const removeSelectedImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: null, message: null });

    const isUpdate = isEditing && editingProductId;

    // Create FormData for file uploads
    const formData = new FormData();

    // Add text fields
    formData.append('name', formState.name);
    formData.append('description', formState.description || '');
    formData.append('price', Number(formState.price));
    if (formState.compareAtPrice) {
      formData.append('compareAtPrice', Number(formState.compareAtPrice));
    }
    if (formState.sku) {
      formData.append('sku', formState.sku);
    }
    if (formState.category) {
      formData.append('category', formState.category);
    }
    if (formState.tags) {
      const tags = formState.tags.split(',').map((t) => t.trim()).filter(Boolean);
      formData.append('tags', JSON.stringify(tags));
    }
    formData.append('stock', formState.stock ? Number(formState.stock) : 0);
    formData.append('status', formState.status);
    formData.append('featured', formState.featured);
    
    if (formState.weight) {
      formData.append('weight', Number(formState.weight));
      if (formState.weightUnit) {
        formData.append('weightUnit', formState.weightUnit);
      }
    }
    
    if (formState.vendor) {
      formData.append('vendor', formState.vendor);
    }
    
    if (formState.brand) {
      formData.append('brand', formState.brand);
    }
    
    if (formState.color) {
      formData.append('color', formState.color);
    }
    
    if (formState.size) {
      formData.append('size', formState.size);
    }
    
    if (formState.material) {
      formData.append('material', formState.material);
    }
    
    if (formState.dimensionsLength || formState.dimensionsWidth || formState.dimensionsHeight) {
      const dimensions = {
        length: formState.dimensionsLength ? Number(formState.dimensionsLength) : undefined,
        width: formState.dimensionsWidth ? Number(formState.dimensionsWidth) : undefined,
        height: formState.dimensionsHeight ? Number(formState.dimensionsHeight) : undefined,
      };
      formData.append('dimensions', JSON.stringify(dimensions));
    }
    
    formData.append('dimensionUnit', formState.dimensionUnit);
    
    if (formState.warranty) {
      formData.append('warranty', formState.warranty);
    }
    
    if (formState.shippingInfo) {
      formData.append('shippingInfo', formState.shippingInfo);
    }
    
    if (formState.returnPolicy) {
      formData.append('returnPolicy', formState.returnPolicy);
    }
    
    if (formState.specifications) {
      try {
        const specs = formState.specifications.trim().startsWith('{') || formState.specifications.trim().startsWith('[')
          ? JSON.parse(formState.specifications)
          : formState.specifications;
        formData.append('specifications', JSON.stringify(specs));
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    // Add uploaded images
    selectedImages.forEach((file) => {
      formData.append('images', file);
    });

    // For updates, if we removed existing images, we need to replace them
    // The backend will handle this based on whether files are uploaded
    if (isUpdate && existingImages.length === 0 && selectedImages.length === 0) {
      // User removed all images, we'll send empty array
      formData.append('images', JSON.stringify([]));
    }

    setSubmitting(true);
    try {
      // For FormData, let axios/browser set Content-Type automatically with boundary
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (isUpdate) {
        await api.put(`/products/${editingProductId}`, formData, config);
        setFeedback({ type: 'success', message: 'Product updated successfully.' });
      } else {
        await api.post('/products', formData, config);
        setFeedback({ type: 'success', message: 'Product created successfully.' });
      }
      await fetchProducts();
      closeDrawer();
    } catch (error) {
      setFeedback({ 
        type: 'danger', 
        message: error.response?.data?.message || error.message || 'Operation failed.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddProduct = () => {
    resetForm();
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const handleEditProduct = (product) => {
    setIsEditing(true);
    setEditingProductId(product._id);
    
    // Set existing images
    const productImages = product.images || [];
    setExistingImages(productImages);
    setSelectedImages([]);
    
    setFormState({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      compareAtPrice: product.compareAtPrice || '',
      sku: product.sku || '',
      category: product.category?._id || product.category || '',
      tags: product.tags?.join(', ') || '',
      images: '', // No longer used for file input
      stock: product.stock || '',
      status: product.status || 'active',
      featured: product.featured || false,
      weight: product.weight || '',
      weightUnit: product.weightUnit?._id || product.weightUnit || '',
      vendor: product.vendor?._id || product.vendor || '',
      brand: product.brand || '',
      color: product.color || '',
      size: product.size?._id || product.size || '',
      material: product.material || '',
      dimensionsLength: product.dimensions?.length || '',
      dimensionsWidth: product.dimensions?.width || '',
      dimensionsHeight: product.dimensions?.height || '',
      dimensionUnit: product.dimensionUnit || 'cm',
      warranty: product.warranty || '',
      shippingInfo: product.shippingInfo || '',
      returnPolicy: product.returnPolicy || '',
      specifications: typeof product.specifications === 'string' 
        ? product.specifications 
        : product.specifications 
          ? JSON.stringify(product.specifications, null, 2) 
          : '',
    });
    setIsDrawerOpen(true);
  };

  const handleDeleteProduct = async (productId) => {
    const confirmed = window.confirm('Are you sure you want to delete this product?');
    if (!confirmed) return;

    try {
      await api.delete(`/products/${productId}`);
      setFeedback({ type: 'success', message: 'Product deleted successfully.' });
      fetchProducts();
    } catch (error) {
      setFeedback({ type: 'danger', message: error.message || 'Failed to delete product.' });
    }
  };

  const renderProducts = () => {
    if (loadingProducts) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
          <p className="mt-2 text-muted">Loading products...</p>
        </div>
      );
    }

    if (!products.length) {
      return <div className="py-4 text-center text-muted">No products found yet.</div>;
    }

    return (
      <div className="table-responsive">
        <Table striped bordered hover size="sm">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Featured</th>
              {canManageProducts && <th style={{ width: 120 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>
                  {typeof item.category === 'object' && item.category?.name
                    ? item.category.name
                    : typeof item.category === 'string'
                      ? item.category
                      : '-'}
                </td>
                <td>{formatPrice(item.price || 0)}</td>
                <td>{item.stock ?? 0}</td>
                <td>
                  <Badge bg={item.status === 'active' ? 'success' : 'secondary'}>
                    {item.status}
                  </Badge>
                </td>
                <td>
                  {item.featured ? (
                    <Badge bg="primary">Yes</Badge>
                  ) : (
                    <span className="text-muted">No</span>
                  )}
                </td>
                {canManageProducts && (
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleEditProduct(item)}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDeleteProduct(item._id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <>
      <AppNavbar />
      <Container fluid className="pb-4 position-relative">
        <Row className="g-4">
          <Col xs={12}>
            {feedback.message && (
              <Alert
                variant={feedback.type === 'success' ? 'success' : 'danger'}
                onClose={() => setFeedback({ type: null, message: null })}
                dismissible
              >
                {feedback.message}
              </Alert>
            )}
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                  <div>
                    <Card.Title>Product Management</Card.Title>
                    <Card.Subtitle className="text-muted">
                      Manage your eCommerce product catalog.
                    </Card.Subtitle>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={fetchProducts}
                      disabled={loadingProducts}
                    >
                      Refresh
                    </Button>
                    {canManageProducts && (
                      <Button size="sm" onClick={handleAddProduct}>
                        + Add Product
                      </Button>
                    )}
                  </div>
                </div>
                {renderProducts()}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* overlay */}
      <div
        ref={overlayRef}
        className="drawer-overlay"
        onClick={closeDrawer}
        role="presentation"
      />

      {/* drawer */}
      <div ref={drawerRef} className="user-drawer">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 className="mb-1">{isEditing ? 'Edit Product' : 'Create Product'}</h5>
            <small className="text-muted">
              {isEditing ? 'Update product details.' : 'Fill the details to create a new product.'}
            </small>
          </div>
          <Button variant="outline-secondary" size="sm" onClick={closeDrawer}>
            Close
          </Button>
        </div>

        {!canManageProducts && (
          <Alert variant="warning">You need to be an Admin or Superadmin to manage products.</Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col sm={12}>
              <Form.Group controlId="name">
                <Form.Label>Product Name *</Form.Label>
                <Form.Control
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  placeholder="Product name"
                  required
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Group controlId="description">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formState.description}
                  onChange={handleChange}
                  placeholder="Product description"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="price">
                <Form.Label>Price *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={formState.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="compareAtPrice">
                <Form.Label>Compare At Price</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="compareAtPrice"
                  value={formState.compareAtPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="sku">
                <Form.Label>SKU</Form.Label>
                <Form.Control
                  name="sku"
                  value={formState.sku}
                  onChange={handleChange}
                  placeholder="SKU-001"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="category">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="category"
                  value={formState.category}
                  onChange={handleChange}
                  disabled={!canManageProducts}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="stock">
                <Form.Label>Stock</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  name="stock"
                  value={formState.stock}
                  onChange={handleChange}
                  placeholder="0"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="status">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formState.status}
                  onChange={handleChange}
                  disabled={!canManageProducts}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Group controlId="tags">
                <Form.Label>Tags (comma-separated)</Form.Label>
                <Form.Control
                  name="tags"
                  value={formState.tags}
                  onChange={handleChange}
                  placeholder="tag1, tag2, tag3"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Group controlId="images">
                <Form.Label>Product Images (Multiple)</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={!canManageProducts || submitting}
                />
                <Form.Text className="text-muted">
                  You can select multiple images. Supported formats: JPEG, PNG, GIF, WebP (Max 5MB per image)
                </Form.Text>
                
                {/* Existing Images Preview */}
                {existingImages.length > 0 && (
                  <div className="mt-3">
                    <small className="text-muted d-block mb-2">Existing Images:</small>
                    <div className="d-flex flex-wrap gap-2">
                        {existingImages.map((imageUrl, index) => {
                          // Handle both base64 (starts with data:image/) and URL strings
                          const fullUrl = imageUrl.startsWith('data:image/') 
                            ? imageUrl 
                            : imageUrl.startsWith('http') 
                            ? imageUrl 
                            : `${api.defaults.baseURL.replace('/api', '')}${imageUrl}`;
                          return (
                          <div key={index} className="position-relative" style={{ width: '100px', height: '100px' }}>
                            <img
                              src={fullUrl}
                              alt={`Product ${index + 1}`}
                              className="img-thumbnail"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {canManageProducts && !submitting && (
                              <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0"
                                style={{ transform: 'translate(50%, -50%)' }}
                                onClick={() => removeExistingImage(index)}
                              >
                                ×
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <Form.Text className="text-muted d-block mt-2">
                      Uploading new images will replace these existing images.
                    </Form.Text>
                  </div>
                )}
                
                {/* Selected Images Preview */}
                {selectedImages.length > 0 && (
                  <div className="mt-3">
                    <small className="text-muted d-block mb-2">New Images to Upload ({selectedImages.length}):</small>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedImages.map((file, index) => {
                        const imageUrl = URL.createObjectURL(file);
                        return (
                          <div key={index} className="position-relative" style={{ width: '100px', height: '100px' }}>
                            <img
                              src={imageUrl}
                              alt={`New ${index + 1}`}
                              className="img-thumbnail"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {canManageProducts && !submitting && (
                              <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0"
                                style={{ transform: 'translate(50%, -50%)' }}
                                onClick={() => removeSelectedImage(index)}
                              >
                                ×
                              </Button>
                            )}
                            <small className="d-block text-center mt-1" style={{ fontSize: '10px' }}>
                              {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                            </small>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="weight">
                <Form.Label>Weight</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="weight"
                    value={formState.weight}
                    onChange={handleChange}
                    placeholder="0.00"
                    disabled={!canManageProducts}
                  />
                  <Form.Select
                    name="weightUnit"
                    value={formState.weightUnit}
                    onChange={handleChange}
                    disabled={!canManageProducts}
                    style={{ width: '150px' }}
                  >
                    <option value="">Select Unit</option>
                    {weightUnits.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.symbol || unit.code} ({unit.name})
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="vendor">
                <Form.Label>Vendor</Form.Label>
                <Form.Select
                  name="vendor"
                  value={formState.vendor}
                  onChange={handleChange}
                  disabled={!canManageProducts}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="brand">
                <Form.Label>Brand</Form.Label>
                <Form.Control
                  name="brand"
                  value={formState.brand}
                  onChange={handleChange}
                  placeholder="Brand name"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="color">
                <Form.Label>Color</Form.Label>
                <Form.Control
                  name="color"
                  value={formState.color}
                  onChange={handleChange}
                  placeholder="Color"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="size">
                <Form.Label>Size</Form.Label>
                <Form.Select
                  name="size"
                  value={formState.size}
                  onChange={handleChange}
                  disabled={!canManageProducts}
                >
                  <option value="">Select Size</option>
                  {sizes.map((size) => (
                    <option key={size._id} value={size._id}>
                      {size.name} ({size.code})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col sm={12} md={6}>
              <Form.Group controlId="material">
                <Form.Label>Material</Form.Label>
                <Form.Control
                  name="material"
                  value={formState.material}
                  onChange={handleChange}
                  placeholder="Material"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12}>
              <hr />
              <h6>Dimensions</h6>
            </Col>
            <Col sm={12} md={4}>
              <Form.Group controlId="dimensionsLength">
                <Form.Label>Length</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="dimensionsLength"
                  value={formState.dimensionsLength}
                  onChange={handleChange}
                  placeholder="0.00"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={4}>
              <Form.Group controlId="dimensionsWidth">
                <Form.Label>Width</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="dimensionsWidth"
                  value={formState.dimensionsWidth}
                  onChange={handleChange}
                  placeholder="0.00"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12} md={4}>
              <Form.Group controlId="dimensionsHeight">
                <Form.Label>Height</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="dimensionsHeight"
                    value={formState.dimensionsHeight}
                    onChange={handleChange}
                    placeholder="0.00"
                    disabled={!canManageProducts}
                  />
                  <Form.Select
                    name="dimensionUnit"
                    value={formState.dimensionUnit}
                    onChange={handleChange}
                    disabled={!canManageProducts}
                    style={{ width: '100px' }}
                  >
                    <option value="cm">cm</option>
                    <option value="m">m</option>
                    <option value="in">in</option>
                    <option value="ft">ft</option>
                  </Form.Select>
                </div>
              </Form.Group>
            </Col>
            <Col sm={12}>
              <hr />
              <h6>Additional Details</h6>
            </Col>
            <Col sm={12}>
              <Form.Group controlId="warranty">
                <Form.Label>Warranty</Form.Label>
                <Form.Control
                  name="warranty"
                  value={formState.warranty}
                  onChange={handleChange}
                  placeholder="e.g., 1 year warranty"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Group controlId="shippingInfo">
                <Form.Label>Shipping Information</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="shippingInfo"
                  value={formState.shippingInfo}
                  onChange={handleChange}
                  placeholder="Shipping details"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Group controlId="returnPolicy">
                <Form.Label>Return Policy</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="returnPolicy"
                  value={formState.returnPolicy}
                  onChange={handleChange}
                  placeholder="Return policy details"
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Group controlId="specifications">
                <Form.Label>Specifications (JSON or plain text)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  name="specifications"
                  value={formState.specifications}
                  onChange={handleChange}
                  placeholder='{"key": "value"} or plain text'
                  disabled={!canManageProducts}
                />
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Form.Check
                type="checkbox"
                id="featured"
                name="featured"
                label="Featured Product"
                checked={formState.featured}
                onChange={handleChange}
                disabled={!canManageProducts}
              />
            </Col>
            <Col xs={12}>
              <div className="d-grid">
                <Button type="submit" variant="primary" disabled={!canManageProducts || submitting}>
                  {submitting ? (isEditing ? 'Updating...' : 'Creating...') : isEditing ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </>
  );
};

const ProductsPageWithProtection = () => (
  <ProtectedRoute roles={['superadmin', 'admin']}>
    <ProductsPage />
  </ProtectedRoute>
);

export default ProductsPageWithProtection;

