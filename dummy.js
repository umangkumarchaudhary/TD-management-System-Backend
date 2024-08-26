const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');
const bookingRoutes = require('./routes/bookingRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const cors = require('cors'); // Import cors

dotenv.config();
connectDB();

const app = express();

// Middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json());

// CORS Configuration
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from this origin
}));

// Routes
app.use('/api/bookings', bookingRoutes);

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
