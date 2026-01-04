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

// Middleware (put before routes if you need body parsing)
app.use(express.json());

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
