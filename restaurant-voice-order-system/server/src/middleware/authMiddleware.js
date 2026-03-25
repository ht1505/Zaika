import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Missing bearer token' });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({ message: 'JWT_SECRET is not configured' });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
