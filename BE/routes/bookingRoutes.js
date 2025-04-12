import express from 'express';
import authMiddleware from '../middleware/authmiddleware.js';
import { allseats, book } from '../controllers/bookingcontrol.js';

const bookingrouter = express.Router();

// Basic route to test booking endpoint
// bookingrouter.get('/test', authMiddleware, (req, res) => {
//     res.json({ message: 'Booking route is working' });
// });
bookingrouter.post('/book', authMiddleware,book);
bookingrouter.get('/allseats', authMiddleware,allseats);
export default bookingrouter;