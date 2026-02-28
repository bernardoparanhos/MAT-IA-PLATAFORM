const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'mat-ia',
      audience: 'mat-ia-app',
    });
    req.usuario = payload;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido ou expirado.' });
  }
}

module.exports = { verifyToken };