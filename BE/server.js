// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Authrouter from './routes/authroute.js';
// import bookingRoutes from './routes/bookingRoutes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', Authrouter);
// app.use('/api/bookings', bookingRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
