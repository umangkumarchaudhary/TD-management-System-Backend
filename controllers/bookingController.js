const Booking = require('../models/Booking');

const createBooking = async (req, res) => {
    const { date, startTime, endTime, carModel, consultantName } = req.body;

    const existingBooking = await Booking.findOne({
        date,
        carModel,
        $or: [
            { startTime: { $lte: endTime, $gte: startTime } },
            { endTime: { $gte: startTime, $lte: endTime } },
        ],
    });

    if (existingBooking) {
        return res.status(400).json({ message: 'Car is already booked for this time.' });
    }

    const booking = new Booking({
        date,
        startTime,
        endTime,
        carModel,
        consultantName,
    });

    await booking.save();
    res.status(201).json(booking);
};

const getBookings = async (req, res) => {
    const bookings = await Booking.find({});
    res.json(bookings);
};

module.exports = { createBooking, getBookings };
