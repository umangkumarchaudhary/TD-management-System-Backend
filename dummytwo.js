const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
require('dotenv').config();

// Initialize the Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// Define the booking schema and model
const bookingSchema = new mongoose.Schema({
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    carModel: { type: String, required: true },
    consultantName: { type: String, required: true },
    location: { type: String, required: true },  // Added location field
    passkey: { type: String, required: true },   // Added passkey field
});

const Booking = mongoose.model('Booking', bookingSchema);

// Get all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error });
    }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
    const { date, startTime, endTime, carModel, consultantName, location, passkey } = req.body;

    // Check if the car is already booked for the requested time
    try {
        const existingBooking = await Booking.findOne({
            carModel,
            date,
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } },
                {
                    $and: [
                        { startTime: { $lte: startTime } },
                        { endTime: { $gte: endTime } }
                    ]
                }
            ],
        });

        if (existingBooking) {
            return res.status(400).json({ message: 'Car is already booked for this time.' });
        }

        // Create and save the new booking
        const booking = new Booking({
            date,
            startTime,
            endTime,
            carModel,
            consultantName,
            location,   // Save location
            passkey     // Save passkey
        });

        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Error submitting booking', error });
    }
});

// Cancel a booking
// Cancel a booking
app.post('/api/cancel-booking', async (req, res) => {
    const { bookingId, passkey } = req.body; // bookingId is the MongoDB _id

    try {
        // Find the booking by its MongoDB _id
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Check if the provided passkey matches the passkey stored in the booking
        if (booking.passkey !== passkey) {
            return res.status(401).json({ success: false, message: 'Invalid passkey' });
        }

        // Delete the booking from the database
        await Booking.findByIdAndDelete(bookingId);
        res.status(200).json({ success: true, message: 'Booking canceled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error canceling booking', error });
    }
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
