import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'msr-sports-dev-secret-change-me';

export function sign(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role, student_id: user.student_id || null },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please sign in again' });
  }
}

// Role gate. Today only admin/staff accounts exist, but coach + student
// roles are already wired so the apps can be opened up without a rewrite.
export function allow(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not signed in' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have access to this' });
    }
    next();
  };
}

export const ADMIN = ['admin'];
export const OFFICE = ['admin', 'staff'];
export const TRAINING = ['admin', 'staff', 'coach'];
