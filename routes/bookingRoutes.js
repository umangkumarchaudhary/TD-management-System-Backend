const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking'); // Adjust path as necessary

// GET /api/bookings - Fetch all bookings
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find({});
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error: Could not fetch bookings.' });
    }
});

// POST /api/bookings - Create a new booking
router.post('/bookings', async (req, res) => {
    const { date, startTime, endTime, carModel, consultantName } = req.body;

    try {
        // Check if the car is already booked for the selected time
        const existingBooking = await Booking.findOne({
            carModel,
            date,
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } },
            ]
        });

        if (existingBooking) {
            return res.status(400).json({ message: 'Car is already booked for this time.' });
        }

        const newBooking = new Booking({
            date,
            startTime,
            endTime,
            carModel,
            consultantName
        });

        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking);
    } catch (error) {
        res.status(500).json({ message: 'Server error: Could not create booking.' });
    }
});

module.exports = router;
