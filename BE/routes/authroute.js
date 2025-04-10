// routes/authRoutes.js
import express from 'express';
import { signup, login } from '../controllers/authcontrol.js';

const Authrouter = express.Router();

Authrouter.post('/signup', signup);
Authrouter.post('/login', login);

export default Authrouter;
