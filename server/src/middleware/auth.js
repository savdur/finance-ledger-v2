import jwt from 'jsonwebtoken'

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided. Please log in.' })

  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    req.userId = decoded.userId
    req.userName = decoded.name
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' })
  }
}
