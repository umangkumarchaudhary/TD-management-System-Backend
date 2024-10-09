const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const webpush = require('web-push');
require('dotenv').config();

// Initialize the Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

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

// Push Notification Setup
const vapidKeys = {
    publicKey: 'BH2URV2TQMM_Q8nRvoW5Ic4lC_hZges1aCfkLf5V_cg1fDFUIraa3j3hccOAZ2bbfqoOvKENYgEzDM7m0tJBFbA',
    privateKey: 'wpk8cjrmED6BlHQJua8Wm138-BJs_82sGD3Cr4Abw6g',
};

webpush.setVapidDetails(
    'mailto:umangkumarchaudhary5@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const subscriptions = []; // Store user subscriptions in a database in production

// Push Notification Subscription Endpoint
app.post('/api/subscribe', (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription); // Save subscription to a database in a real app
    res.status(201).json({ message: 'Subscription received.' });
});

// Push Notification Sending Endpoint
app.post('/api/notify', (req, res) => {
    const payload = JSON.stringify({
        title: 'New Notification',
        body: 'This is a test notification!',
    });

    Promise.all(subscriptions.map(sub => webpush.sendNotification(sub, payload)))
        .then(() => res.status(200).json({ message: 'Notifications sent.' }))
        .catch(error => {
            console.error('Error sending notification:', error);
            res.sendStatus(500);
        });
});

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

    try {
        // Check if the car is already booked for the requested time
        const existingBooking = await Booking.findOne({
            carModel,
            date,
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } },
                {
                    $and: [
                        { startTime: { $lte: startTime } },
                        { endTime: { $gte: endTime } },
                    ],
                },
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
