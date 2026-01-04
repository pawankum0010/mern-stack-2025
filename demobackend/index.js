const express = require('express');
require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

const userRoutes = require('./src/routes/user.routes');
const roleRoutes = require('./src/routes/role.routes');
const authRoutes = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/product.routes');
const cartRoutes = require('./src/routes/cart.routes');
const orderRoutes = require('./src/routes/order.routes');
const invoiceRoutes = require('./src/routes/invoice.routes');
const vendorRoutes = require('./src/routes/vendor.routes');
const categoryRoutes = require('./src/routes/category.routes');
const addressRoutes = require('./src/routes/address.routes');
const stateRoutes = require('./src/routes/state.routes');
const weightUnitRoutes = require('./src/routes/weightUnit.routes');
const sizeRoutes = require('./src/routes/size.routes');
const pincodeRoutes = require('./src/routes/pincode.routes');
const customerActivityLogRoutes = require('./src/routes/customerActivityLog.routes');
const errorLogRoutes = require('./src/routes/errorLog.routes');
const reportRoutes = require('./src/routes/report.routes');
const notFound = require('./src/middlewares/notFound');
const errorHandler = require('./src/middlewares/errorHandler');
const { apiLimiter } = require('./src/middlewares/security');
const validateInput = require('./src/middlewares/validateInput');
const { connectDB } = require('./src/config/db');

// Security Headers using Helmet
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: [
                    "'self'",
                    'data:',
                    'https:',
                    'http://localhost:5000', // Allow images from backend
                    'http://localhost:3000', // Allow images from frontend
                ],
                connectSrc: [
                    "'self'",
                    'http://localhost:5000', // Allow API calls to backend
                    'http://localhost:3000', // Allow API calls from frontend
                ],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false, // Allow external resources if needed
        crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to be loaded cross-origin
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
        },
    })
);

// CORS Configuration
app.use(
    cors({
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input validation and sanitization
app.use(validateInput);

// Apply general API rate limiting to all routes
app.use('/api', apiLimiter);

// Serve static files from uploads directory with CORS headers
app.use(
    '/uploads',
    (req, res, next) => {
        // Set CORS headers for static files
        res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    },
    express.static(path.join(__dirname, '../uploads'))
);

connectDB();

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// Middleware (put before routes if you need body parsing)
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/states', stateRoutes);
app.use('/api/weight-units', weightUnitRoutes);
app.use('/api/sizes', sizeRoutes);
app.use('/api/pincodes', pincodeRoutes);
app.use('/api/customer-activity-logs', customerActivityLogRoutes);
app.use('/api/error-logs', errorLogRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'API is running...',
        env: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT
            // add only non-sensitive vars you want to confirm
        }
    });
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
