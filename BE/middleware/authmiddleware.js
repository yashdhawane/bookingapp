// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log(`middleware ${authHeader}`)
  if (authHeader) {
    // const token = authHeader.split(' ')[1]; // Expected format: "Bearer <token>"
    const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader;
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Token is not valid' });
      }
      console.log(user)
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: 'Authentication required' });
  }
}
