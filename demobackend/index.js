const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

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
