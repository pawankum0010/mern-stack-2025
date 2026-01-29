import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  InputGroup,
  Modal,
} from 'react-bootstrap';
import { FiPlus, FiMinus, FiTrash2, FiSearch, FiCheck } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api/client';
import './PosOrderPage.css';

const PosOrderPage = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  
  // Customer info
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  
  // Autocomplete states
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [phoneSuggestions, setPhoneSuggestions] = useState([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [loadingEmailSuggestions, setLoadingEmailSuggestions] = useState(false);
  const [loadingPhoneSuggestions, setLoadingPhoneSuggestions] = useState(false);

  // Products
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Cart items
  const [cartItems, setCartItems] = useState([]);

  // Address
  const [formData, setFormData] = useState({
    shippingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    billingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    useBillingAsShipping: true,
    gstNumber: '',
    paymentMethod: 'cash',
    tax: 0,
    shipping: 0,
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = {
        status: 'active',
        limit: 50,
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const { data } = await api.get('/products', { params });
      setProducts(data?.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Autocomplete search for email
  const searchEmailAutocomplete = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setEmailSuggestions([]);
      setShowEmailSuggestions(false);
      return;
    }

    setLoadingEmailSuggestions(true);
    try {
      const { data } = await api.get('/users', { 
        params: { 
          search: query.toLowerCase(),
          limit: 10 
        } 
      });
      const users = data?.data || [];
      setEmailSuggestions(users);
      setShowEmailSuggestions(users.length > 0);
    } catch (error) {
      // If 404, no users found
      if (error.response?.status !== 404) {
        console.error('Error fetching email suggestions:', error);
      }
      setEmailSuggestions([]);
      setShowEmailSuggestions(false);
    } finally {
      setLoadingEmailSuggestions(false);
    }
  }, []);

  // Autocomplete search for phone
  const searchPhoneAutocomplete = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setPhoneSuggestions([]);
      setShowPhoneSuggestions(false);
      return;
    }

    setLoadingPhoneSuggestions(true);
    try {
      const { data } = await api.get('/users', { 
        params: { 
          search: query,
          limit: 10 
        } 
      });
      const users = data?.data || [];
      setPhoneSuggestions(users);
      setShowPhoneSuggestions(users.length > 0);
    } catch (error) {
      // If 404, no users found
      if (error.response?.status !== 404) {
        console.error('Error fetching phone suggestions:', error);
      }
      setPhoneSuggestions([]);
      setShowPhoneSuggestions(false);
    } finally {
      setLoadingPhoneSuggestions(false);
    }
  }, []);

  // Debounced email autocomplete
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerEmail) {
        searchEmailAutocomplete(customerEmail);
      } else {
        setEmailSuggestions([]);
        setShowEmailSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerEmail, searchEmailAutocomplete]);

  // Debounced phone autocomplete
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerPhone) {
        searchPhoneAutocomplete(customerPhone);
      } else {
        setPhoneSuggestions([]);
        setShowPhoneSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerPhone, searchPhoneAutocomplete]);

  // Select customer from autocomplete
  const selectCustomer = (selectedUser) => {
    setCustomerInfo(selectedUser);
    setCustomerEmail(selectedUser.email || '');
    setCustomerPhone(selectedUser.phone || '');
    setCustomerName(selectedUser.name || '');
    setEmailSuggestions([]);
    setPhoneSuggestions([]);
    setShowEmailSuggestions(false);
    setShowPhoneSuggestions(false);
    
    // Pre-fill address if available
    if (selectedUser.address) {
      setFormData((prev) => ({
        ...prev,
        shippingAddress: {
          line1: selectedUser.address.line1 || '',
          line2: selectedUser.address.line2 || '',
          city: selectedUser.address.city || '',
          state: selectedUser.address.state || '',
          postalCode: selectedUser.address.postalCode || '',
          country: selectedUser.address.country || '',
        },
      }));
    }
    setSuccess('Customer selected!');
  };

  // Search customer by email or phone (final search)
  const searchCustomer = async () => {
    if (!customerEmail && !customerPhone) {
      setError('Please enter customer email or phone number');
      return;
    }

    setSearchingCustomer(true);
    setError(null);
    setShowEmailSuggestions(false);
    setShowPhoneSuggestions(false);
    
    try {
      const params = {};
      if (customerEmail) params.email = customerEmail.toLowerCase();
      if (customerPhone) params.phone = customerPhone;

      try {
        const { data } = await api.get('/users', { params });
        const users = data?.data || [];
        
        if (users.length > 0) {
          const foundUser = users[0];
          selectCustomer(foundUser);
          setSuccess('Customer found!');
        } else {
          setCustomerInfo(null);
          setSuccess('Customer not found. New customer will be created when order is placed.');
        }
      } catch (error) {
        // If 404, customer doesn't exist - that's fine, we'll create one
        if (error.response?.status === 404) {
          setCustomerInfo(null);
          setSuccess('Customer not found. New customer will be created when order is placed.');
        } else {
          throw error;
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to search customer');
      setCustomerInfo(null);
    } finally {
      setSearchingCustomer(false);
    }
  };

  // Handle Enter key in email field
  const handleEmailKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (emailSuggestions.length === 1) {
        // If only one suggestion, auto-select it
        selectCustomer(emailSuggestions[0]);
      } else if (emailSuggestions.length > 1) {
        // If multiple, just close suggestions
        setShowEmailSuggestions(false);
      } else {
        // If no suggestions, trigger search
        searchCustomer();
      }
    } else if (e.key === 'Escape') {
      setShowEmailSuggestions(false);
    }
  };

  // Handle Enter key in phone field
  const handlePhoneKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (phoneSuggestions.length === 1) {
        // If only one suggestion, auto-select it
        selectCustomer(phoneSuggestions[0]);
      } else if (phoneSuggestions.length > 1) {
        // If multiple, just close suggestions
        setShowPhoneSuggestions(false);
      } else {
        // If no suggestions, trigger search
        searchCustomer();
      }
    } else if (e.key === 'Escape') {
      setShowPhoneSuggestions(false);
    }
  };

  // Calculate shipping based on postal code
  useEffect(() => {
    const calculateShipping = async () => {
      const postalCode = formData.shippingAddress?.postalCode;
      if (!postalCode || postalCode.length !== 6) {
        setFormData((prev) => ({ ...prev, shipping: 0 }));
        return;
      }

      try {
        const { data } = await api.get(`/pincodes/code/${postalCode}`);
        const charge = data?.data?.shippingCharge || 0;
        setFormData((prev) => ({ ...prev, shipping: charge }));
      } catch (error) {
        setFormData((prev) => ({ ...prev, shipping: 0 }));
      }
    };

    const timeoutId = setTimeout(() => {
      calculateShipping();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.shippingAddress?.postalCode]);

  // Add product to cart
  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.product === product._id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.product === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
      }]);
    }
  };

  // Update cart item quantity
  const updateQuantity = (productId, delta) => {
    setCartItems(cartItems.map(item => {
      if (item.product === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return null;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.product !== productId));
  };

  // Calculate totals
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + Number(formData.tax) + Number(formData.shipping);
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name.startsWith('shippingAddress.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [field]: value,
        },
      }));
    } else if (name.startsWith('billingAddress.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [field]: value,
        },
      }));
    } else if (name === 'useBillingAsShipping') {
      setFormData((prev) => ({
        ...prev,
        useBillingAsShipping: checked,
        billingAddress: checked ? prev.shippingAddress : prev.billingAddress,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Submit order
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!customerEmail && !customerPhone) {
      setError('Customer email or phone number is required');
      return;
    }

    if (cartItems.length === 0) {
      setError('Please add at least one product to the order');
      return;
    }

    if (!formData.shippingAddress.line1 || !formData.shippingAddress.city) {
      setError('Shipping address is required');
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        customerName: customerName || undefined,
        items: cartItems.map(item => ({
          product: item.product,
          price: item.price,
          quantity: item.quantity,
        })),
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.useBillingAsShipping 
          ? formData.shippingAddress 
          : formData.billingAddress,
        gstNumber: formData.gstNumber || undefined,
        paymentMethod: formData.paymentMethod,
        tax: formData.tax,
        shipping: formData.shipping,
        notes: formData.notes || undefined,
      };

      const { data } = await api.post('/orders/pos', orderData);
      setCreatedOrder(data?.data);
      setShowSuccessModal(true);
      
      // Reset form
      setCartItems([]);
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerName('');
      setCustomerInfo(null);
      setFormData({
        shippingAddress: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
        billingAddress: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
        useBillingAsShipping: true,
        gstNumber: '',
        paymentMethod: 'cash',
        tax: 0,
        shipping: 0,
        notes: '',
      });
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Card className="mb-4">
          <Card.Header>
            <Card.Title className="mb-0">POS - Place Order</Card.Title>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={(e) => { e.preventDefault(); searchCustomer(); }}>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group className="position-relative">
                    <Form.Label>Customer Email *</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Type email or name (e.g., pawankum)"
                        value={customerEmail}
                        onChange={(e) => {
                          setCustomerEmail(e.target.value);
                          setShowEmailSuggestions(true);
                        }}
                        onKeyDown={handleEmailKeyDown}
                        onFocus={() => {
                          if (emailSuggestions.length > 0) {
                            setShowEmailSuggestions(true);
                          }
                        }}
                        onBlur={() => {
                          // Delay to allow click on suggestion
                          setTimeout(() => setShowEmailSuggestions(false), 200);
                        }}
                        autoComplete="off"
                      />
                      {loadingEmailSuggestions && (
                        <InputGroup.Text>
                          <Spinner size="sm" />
                        </InputGroup.Text>
                      )}
                    </InputGroup>
                    {showEmailSuggestions && emailSuggestions.length > 0 && (
                      <div 
                        className="position-absolute w-100 border rounded shadow-lg autocomplete-dropdown"
                        style={{ 
                          zIndex: 1000, 
                          maxHeight: '200px', 
                          overflowY: 'auto',
                          top: '100%',
                          marginTop: '2px'
                        }}
                      >
                        {emailSuggestions.map((user) => (
                          <div
                            key={user._id}
                            className="p-2 border-bottom autocomplete-item"
                            style={{ cursor: 'pointer' }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectCustomer(user);
                            }}
                          >
                            <div className="fw-bold">{user.name || 'No Name'}</div>
                            <div className="text-muted small">
                              {user.email}
                              {user.phone && ` • ${user.phone}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Form.Text className="text-muted">Press Enter to search or select from suggestions</Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="position-relative">
                    <Form.Label>Customer Phone *</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="tel"
                        placeholder="Type phone or name (e.g., 801008)"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          setShowPhoneSuggestions(true);
                        }}
                        onKeyDown={handlePhoneKeyDown}
                        onFocus={() => {
                          if (phoneSuggestions.length > 0) {
                            setShowPhoneSuggestions(true);
                          }
                        }}
                        onBlur={() => {
                          // Delay to allow click on suggestion
                          setTimeout(() => setShowPhoneSuggestions(false), 200);
                        }}
                        autoComplete="off"
                      />
                      {loadingPhoneSuggestions && (
                        <InputGroup.Text>
                          <Spinner size="sm" />
                        </InputGroup.Text>
                      )}
                    </InputGroup>
                    {showPhoneSuggestions && phoneSuggestions.length > 0 && (
                      <div 
                        className="position-absolute w-100 border rounded shadow-lg autocomplete-dropdown"
                        style={{ 
                          zIndex: 1000, 
                          maxHeight: '200px', 
                          overflowY: 'auto',
                          top: '100%',
                          marginTop: '2px'
                        }}
                      >
                        {phoneSuggestions.map((user) => (
                          <div
                            key={user._id}
                            className="p-2 border-bottom autocomplete-item"
                            style={{ cursor: 'pointer' }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectCustomer(user);
                            }}
                          >
                            <div className="fw-bold">{user.name || 'No Name'}</div>
                            <div className="text-muted small">
                              {user.phone || 'No Phone'}
                              {user.email && ` • ${user.email}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Form.Text className="text-muted">Press Enter to search or select from suggestions</Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Customer Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Customer Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Button
                    variant="primary"
                    onClick={searchCustomer}
                    disabled={searchingCustomer || (!customerEmail && !customerPhone)}
                  >
                    {searchingCustomer ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Searching...
                      </>
                    ) : (
                      'Search Customer'
                    )}
                  </Button>
                </Col>
                {customerInfo && (
                  <Col md={12}>
                    <Alert variant="info">
                      <strong>Customer Selected:</strong> {customerInfo.name} ({customerInfo.email})
                      {customerInfo.phone && ` - ${customerInfo.phone}`}
                    </Alert>
                  </Col>
                )}
              </Row>
            </Form>
          </Card.Body>
        </Card>

        <Row className="g-4">
          <Col xs={12} lg={8}>
            {/* Product Search */}
            <Card className="mb-3">
              <Card.Header>
                <Card.Title className="mb-0">Search Products</Card.Title>
              </Card.Header>
              <Card.Body>
                <InputGroup className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Search products by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="outline-secondary">
                    <FiSearch />
                  </Button>
                </InputGroup>
                {loadingProducts ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <Table striped hover size="sm">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product._id}>
                            <td>{product.name}</td>
                            <td>{formatPrice(product.price)}</td>
                            <td>
                              <Badge bg={product.stock > 0 ? 'success' : 'danger'}>
                                {product.stock}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => addToCart(product)}
                                disabled={product.stock === 0}
                              >
                                <FiPlus /> Add
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Cart Items */}
            <Card className="mb-3">
              <Card.Header>
                <Card.Title className="mb-0">Order Items</Card.Title>
              </Card.Header>
              <Card.Body>
                {cartItems.length === 0 ? (
                  <p className="text-muted text-center py-3">No items in cart. Add products to continue.</p>
                ) : (
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.product}>
                          <td>{item.name}</td>
                          <td>{formatPrice(item.price)}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => updateQuantity(item.product, -1)}
                              >
                                <FiMinus />
                              </Button>
                              <span>{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => updateQuantity(item.product, 1)}
                              >
                                <FiPlus />
                              </Button>
                            </div>
                          </td>
                          <td>{formatPrice(item.price * item.quantity)}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => removeFromCart(item.product)}
                            >
                              <FiTrash2 />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>

            {/* Shipping Address */}
            <Card className="mb-3">
              <Card.Header>
                <Card.Title className="mb-0">Shipping Address</Card.Title>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col sm={12}>
                    <Form.Group>
                      <Form.Label>Address Line 1 *</Form.Label>
                      <Form.Control
                        name="shippingAddress.line1"
                        value={formData.shippingAddress.line1}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={12}>
                    <Form.Group>
                      <Form.Label>Address Line 2</Form.Label>
                      <Form.Control
                        name="shippingAddress.line2"
                        value={formData.shippingAddress.line2}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={12} md={6}>
                    <Form.Group>
                      <Form.Label>City *</Form.Label>
                      <Form.Control
                        name="shippingAddress.city"
                        value={formData.shippingAddress.city}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={12} md={6}>
                    <Form.Group>
                      <Form.Label>State *</Form.Label>
                      <Form.Control
                        name="shippingAddress.state"
                        value={formData.shippingAddress.state}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={12} md={6}>
                    <Form.Group>
                      <Form.Label>Postal Code *</Form.Label>
                      <Form.Control
                        name="shippingAddress.postalCode"
                        value={formData.shippingAddress.postalCode}
                        onChange={handleChange}
                        required
                        maxLength={6}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={12} md={6}>
                    <Form.Group>
                      <Form.Label>Country *</Form.Label>
                      <Form.Control
                        name="shippingAddress.country"
                        value={formData.shippingAddress.country}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Billing Address */}
            <Card className="mb-3">
              <Card.Header>
                <Card.Title className="mb-0">Billing Address</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form.Check
                  type="checkbox"
                  id="useBillingAsShipping"
                  name="useBillingAsShipping"
                  label="Use shipping address as billing address"
                  checked={formData.useBillingAsShipping}
                  onChange={handleChange}
                  className="mb-3"
                />
                {!formData.useBillingAsShipping && (
                  <Row className="g-3">
                    <Col sm={12}>
                      <Form.Group>
                        <Form.Label>Billing Address Line 1</Form.Label>
                        <Form.Control
                          name="billingAddress.line1"
                          value={formData.billingAddress.line1}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12}>
                      <Form.Group>
                        <Form.Label>Billing Address Line 2</Form.Label>
                        <Form.Control
                          name="billingAddress.line2"
                          value={formData.billingAddress.line2}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group>
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          name="billingAddress.city"
                          value={formData.billingAddress.city}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group>
                        <Form.Label>State</Form.Label>
                        <Form.Control
                          name="billingAddress.state"
                          value={formData.billingAddress.state}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group>
                        <Form.Label>Postal Code</Form.Label>
                        <Form.Control
                          name="billingAddress.postalCode"
                          value={formData.billingAddress.postalCode}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group>
                        <Form.Label>Country</Form.Label>
                        <Form.Control
                          name="billingAddress.country"
                          value={formData.billingAddress.country}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}
                <Row className="g-3 mt-2">
                  <Col sm={12}>
                    <Form.Group>
                      <Form.Label>GST Number (Optional)</Form.Label>
                      <Form.Control
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        placeholder="GSTIN-XXXXXXXXXX"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Payment & Additional Info */}
            <Card>
              <Card.Header>
                <Card.Title className="mb-0">Payment & Additional Information</Card.Title>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col sm={12} md={6}>
                    <Form.Group>
                      <Form.Label>Payment Method</Form.Label>
                      <Form.Select
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleChange}
                      >
                        <option value="cash">Cash on Delivery</option>
                        <option value="card">Credit/Debit Card</option>
                        <option value="paypal">PayPal</option>
                        <option value="other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col sm={12} md={6}>
                    <Form.Group>
                      <Form.Label>Tax</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        name="tax"
                        value={formData.tax}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={12}>
                    <Form.Group>
                      <Form.Label>Order Notes</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Any special instructions..."
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Order Summary */}
          <Col xs={12} lg={4}>
            <Card className="sticky-top" style={{ top: '20px' }}>
              <Card.Header>
                <Card.Title className="mb-0">Order Summary</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  {cartItems.map((item) => (
                    <div key={item.product} className="d-flex justify-content-between mb-2">
                      <div>
                        <div>{item.name}</div>
                        <small className="text-muted">Qty: {item.quantity}</small>
                      </div>
                      <div>{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
                {cartItems.length === 0 && (
                  <p className="text-muted text-center py-3">No items</p>
                )}
                <hr />
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span>{formatPrice(calculateSubtotal())}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tax:</span>
                  <span>{formatPrice(Number(formData.tax))}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span>Shipping:</span>
                  <span>{formatPrice(Number(formData.shipping))}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4">
                  <strong>Total:</strong>
                  <strong className="h5">{formatPrice(calculateTotal())}</strong>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-100"
                  onClick={handleSubmit}
                  disabled={submitting || cartItems.length === 0 || (!customerEmail && !customerPhone)}
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Success Modal */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Order Placed Successfully!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="success">
            <strong>Order Number:</strong> {createdOrder?.orderNumber}
          </Alert>
          <p>Order has been placed successfully. Invoice will be generated automatically.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSuccessModal(false)}>
            Close
          </Button>
          {createdOrder?._id && (
            <Button
              variant="primary"
              onClick={() => {
                setShowSuccessModal(false);
                navigate(`/admin/orders/${createdOrder._id}`);
              }}
            >
              View Order
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

const PosOrderPageWithProtection = () => (
  <ProtectedRoute roles={['superadmin', 'admin']}>
    <PosOrderPage />
  </ProtectedRoute>
);

export default PosOrderPageWithProtection;

