// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Authrouter from './routes/authroute.js';
import authMiddleware from './middleware/authmiddleware.js';
import bookingrouter from "./routes/bookingRoutes.js"
import seedDB from './lib/seedDB.js'; // Import the seedDB function
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/auth', Authrouter);
app.use('/api/bookings', bookingrouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const startServer = async () => {
  try {
      await seedDB();
      app.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
          console.log('Database seeded successfully');
      });
  } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
  }
};

startServer();