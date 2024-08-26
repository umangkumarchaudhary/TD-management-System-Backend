const express = require('express');
const connectDB = require('./config/db'); // Adjust path as necessary
const bookingRoutes = require('./routes/bookingRoutes'); // Adjust path as necessary
require('dotenv').config(); // Load environment variables

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api', bookingRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
