import { useEffect, useState } from 'react';
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
} from 'react-bootstrap';
import { FiCheck } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/client';

const CheckoutPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState({ shipping: [], billing: [] });
  const [selectedShippingAddress, setSelectedShippingAddress] = useState('');
  const [selectedBillingAddress, setSelectedBillingAddress] = useState('');
  const [useManualShipping, setUseManualShipping] = useState(false);
  const [useManualBilling, setUseManualBilling] = useState(false);
  const [formData, setFormData] = useState({
    shippingAddress: {
      line1: user?.address?.line1 || '',
      line2: user?.address?.line2 || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      postalCode: user?.address?.postalCode || '',
      country: user?.address?.country || '',
    },
    billingAddress: {
      line1: user?.address?.line1 || '',
      line2: user?.address?.line2 || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      postalCode: user?.address?.postalCode || '',
      country: user?.address?.country || '',
    },
    gstNumber: '',
    useBillingAsShipping: true,
    paymentMethod: 'cash',
    tax: 0,
    shipping: 0,
    notes: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    fetchCart();
    fetchAddresses();
  }, [isAuthenticated, navigate]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data?.data);
    } catch (error) {
      setError(error.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/addresses');
      const addresses = data?.data || [];
      const shipping = addresses.filter((addr) => addr.type === 'shipping');
      const billing = addresses.filter((addr) => addr.type === 'billing');
      
      setSavedAddresses({ shipping, billing });
      
      // Auto-select default addresses if available
      const defaultShipping = shipping.find((addr) => addr.isDefault);
      const defaultBilling = billing.find((addr) => addr.isDefault);
      
      if (defaultShipping) {
        setSelectedShippingAddress(defaultShipping._id);
        populateShippingAddress(defaultShipping);
      }
      
      if (defaultBilling) {
        setSelectedBillingAddress(defaultBilling._id);
        populateBillingAddress(defaultBilling);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      // Don't show error, just allow manual entry
    }
  };

  const populateShippingAddress = (address) => {
    setFormData((prev) => ({
      ...prev,
      shippingAddress: {
        line1: address.line1 || '',
        line2: address.line2 || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || '',
      },
    }));
  };

  const populateBillingAddress = (address) => {
    setFormData((prev) => ({
      ...prev,
      billingAddress: {
        line1: address.line1 || '',
        line2: address.line2 || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || '',
      },
    }));
  };

  const handleShippingAddressSelect = (e) => {
    const addressId = e.target.value;
    setSelectedShippingAddress(addressId);
    
    if (addressId === 'manual') {
      setUseManualShipping(true);
      setFormData((prev) => ({
        ...prev,
        shippingAddress: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
      }));
    } else if (addressId === 'new') {
      navigate('/addresses');
    } else {
      setUseManualShipping(false);
      const address = savedAddresses.shipping.find((addr) => addr._id === addressId);
      if (address) {
        populateShippingAddress(address);
      }
    }
  };

  const handleBillingAddressSelect = (e) => {
    const addressId = e.target.value;
    setSelectedBillingAddress(addressId);
    
    if (addressId === 'manual') {
      setUseManualBilling(true);
      setFormData((prev) => ({
        ...prev,
        billingAddress: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
      }));
    } else if (addressId === 'new') {
      navigate('/addresses');
    } else {
      setUseManualBilling(false);
      const address = savedAddresses.billing.find((addr) => addr._id === addressId);
      if (address) {
        populateBillingAddress(address);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
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
      if (checked) {
        setSelectedBillingAddress('');
        setUseManualBilling(false);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    const subtotal = cart.items.reduce((total, item) => {
      const price = item.product?.price || item.price || 0;
      return total + price * (item.quantity || 0);
    }, 0);
    return subtotal + Number(formData.tax) + Number(formData.shipping);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const orderData = {
        ...formData,
        billingAddress: formData.useBillingAsShipping ? formData.shippingAddress : formData.billingAddress,
      };
      delete orderData.useBillingAsShipping;
      
      const { data } = await api.post('/orders', orderData);
      refreshCart(); // Clear cart count after order
      if (data?.data?._id) {
        navigate(`/orders/${data.data._id}`);
      } else {
        navigate('/orders');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to place order';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading checkout...</p>
          </div>
        </Container>
      </>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <Card>
            <Card.Body className="text-center py-5">
              <h5>Your cart is empty</h5>
              <Button variant="primary" onClick={() => navigate('/shop')}>
                Continue Shopping
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </>
    );
  }

  const subtotal = cart.items.reduce((total, item) => {
    const price = item.product?.price || item.price || 0;
    return total + price * (item.quantity || 0);
  }, 0);

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Row className="g-4">
          <Col xs={12} lg={8}>
            <Card>
              <Card.Header>
                <Card.Title className="mb-0">Shipping Information</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col sm={12}>
                      <Form.Group controlId="selectShippingAddress">
                        <Form.Label>Select Shipping Address</Form.Label>
                        <Form.Select
                          value={selectedShippingAddress}
                          onChange={handleShippingAddressSelect}
                        >
                          <option value="">Choose an address...</option>
                          {savedAddresses.shipping.map((address) => (
                            <option key={address._id} value={address._id}>
                              {address.label} {address.isDefault && '(Default)'} - {address.line1}, {address.city}
                            </option>
                          ))}
                          <option value="new">+ Add New Address</option>
                          <option value="manual">Enter Address Manually</option>
                        </Form.Select>
                        {selectedShippingAddress && savedAddresses.shipping.find((a) => a._id === selectedShippingAddress)?.isDefault && (
                          <Badge bg="success" className="mt-2">
                            <FiCheck className="me-1" />
                            Default Address
                          </Badge>
                        )}
                      </Form.Group>
                    </Col>
                    {(useManualShipping || !selectedShippingAddress) && (
                      <>
                        <Col sm={12}>
                          <Form.Group controlId="line1">
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
                      <Form.Group controlId="line2">
                        <Form.Label>Address Line 2</Form.Label>
                        <Form.Control
                          name="shippingAddress.line2"
                          value={formData.shippingAddress.line2}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="city">
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
                      <Form.Group controlId="state">
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
                      <Form.Group controlId="postalCode">
                        <Form.Label>Postal Code *</Form.Label>
                        <Form.Control
                          name="shippingAddress.postalCode"
                          value={formData.shippingAddress.postalCode}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12} md={6}>
                      <Form.Group controlId="country">
                        <Form.Label>Country *</Form.Label>
                        <Form.Control
                          name="shippingAddress.country"
                          value={formData.shippingAddress.country}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                      </>
                    )}
                  </Row>
                </Form>
              </Card.Body>
            </Card>
            <Card className="mt-3">
              <Card.Header>
                <Card.Title className="mb-0">Billing Information</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Row className="g-3">
                    <Col sm={12}>
                      <Form.Check
                        type="checkbox"
                        id="useBillingAsShipping"
                        name="useBillingAsShipping"
                        label="Use shipping address as billing address"
                        checked={formData.useBillingAsShipping}
                        onChange={handleChange}
                      />
                    </Col>
                    {!formData.useBillingAsShipping && (
                      <>
                        <Col sm={12}>
                          <Form.Group controlId="selectBillingAddress">
                            <Form.Label>Select Billing Address</Form.Label>
                            <Form.Select
                              value={selectedBillingAddress}
                              onChange={handleBillingAddressSelect}
                              disabled={formData.useBillingAsShipping}
                            >
                              <option value="">Choose an address...</option>
                              {savedAddresses.billing.map((address) => (
                                <option key={address._id} value={address._id}>
                                  {address.label} {address.isDefault && '(Default)'} - {address.line1}, {address.city}
                                </option>
                              ))}
                              <option value="new">+ Add New Address</option>
                              <option value="manual">Enter Address Manually</option>
                            </Form.Select>
                            {formData.useBillingAsShipping && (
                              <small className="text-muted d-block mt-1">Using shipping address as billing address</small>
                            )}
                            {!formData.useBillingAsShipping && selectedBillingAddress && savedAddresses.billing.find((a) => a._id === selectedBillingAddress)?.isDefault && (
                              <Badge bg="success" className="mt-2">
                                <FiCheck className="me-1" />
                                Default Address
                              </Badge>
                            )}
                          </Form.Group>
                        </Col>
                        {!formData.useBillingAsShipping && (useManualBilling || !selectedBillingAddress) && (
                          <>
                            <Col sm={12}>
                              <Form.Group controlId="billingLine1">
                                <Form.Label>Billing Address Line 1</Form.Label>
                                <Form.Control
                                  name="billingAddress.line1"
                                  value={formData.billingAddress.line1}
                                  onChange={handleChange}
                                />
                              </Form.Group>
                            </Col>
                        <Col sm={12}>
                          <Form.Group controlId="billingLine2">
                            <Form.Label>Billing Address Line 2</Form.Label>
                            <Form.Control
                              name="billingAddress.line2"
                              value={formData.billingAddress.line2}
                              onChange={handleChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col sm={12} md={6}>
                          <Form.Group controlId="billingCity">
                            <Form.Label>City</Form.Label>
                            <Form.Control
                              name="billingAddress.city"
                              value={formData.billingAddress.city}
                              onChange={handleChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col sm={12} md={6}>
                          <Form.Group controlId="billingState">
                            <Form.Label>State</Form.Label>
                            <Form.Control
                              name="billingAddress.state"
                              value={formData.billingAddress.state}
                              onChange={handleChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col sm={12} md={6}>
                          <Form.Group controlId="billingPostalCode">
                            <Form.Label>Postal Code</Form.Label>
                            <Form.Control
                              name="billingAddress.postalCode"
                              value={formData.billingAddress.postalCode}
                              onChange={handleChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col sm={12} md={6}>
                          <Form.Group controlId="billingCountry">
                            <Form.Label>Country</Form.Label>
                            <Form.Control
                              name="billingAddress.country"
                              value={formData.billingAddress.country}
                              onChange={handleChange}
                            />
                          </Form.Group>
                        </Col>
                          </>
                        )}
                      </>
                    )}
                    <Col sm={12}>
                      <Form.Group controlId="gstNumber">
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
                </Form>
              </Card.Body>
            </Card>
            <Card className="mt-3">
              <Card.Header>
                <Card.Title className="mb-0">Payment & Additional Information</Card.Title>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col sm={12} md={6}>
                      <Form.Group controlId="paymentMethod">
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
                      <Form.Group controlId="tax">
                        <Form.Label>Tax ($)</Form.Label>
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
                    <Col sm={12} md={6}>
                      <Form.Group controlId="shipping">
                        <Form.Label>Shipping ($)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0"
                          name="shipping"
                          value={formData.shipping}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col sm={12}>
                      <Form.Group controlId="notes">
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
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} lg={4}>
            <Card className="sticky-top" style={{ top: '20px' }}>
              <Card.Header>
                <Card.Title className="mb-0">Order Summary</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  {cart.items.map((item) => {
                    const product = item.product || {};
                    const price = product.price || item.price || 0;
                    const quantity = item.quantity || 0;
                    return (
                      <div key={item._id} className="d-flex justify-content-between mb-2">
                        <div>
                          <div>{product.name}</div>
                          <small className="text-muted">Qty: {quantity}</small>
                        </div>
                        <div>${(price * quantity).toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tax:</span>
                  <span>${Number(formData.tax).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span>Shipping:</span>
                  <span>${Number(formData.shipping).toFixed(2)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4">
                  <strong>Total:</strong>
                  <strong className="h5">${calculateTotal().toFixed(2)}</strong>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-100"
                  onClick={handleSubmit}
                  disabled={submitting}
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
    </>
  );
};

const CheckoutPageWithProtection = () => (
  <ProtectedRoute>
    <CheckoutPage />
  </ProtectedRoute>
);

export default CheckoutPageWithProtection;

