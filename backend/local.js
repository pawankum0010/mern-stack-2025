const appHandler = require('./index'); // if you saved above as index.js
const express = require('express');

const app = express();
app.use((req, res) => appHandler(req, res));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Local running on ${PORT}`));
