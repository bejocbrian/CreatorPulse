const { HttpError } = require('../errors');

function authMiddleware(req, _res, next) {
  const userId = req.header('x-user-id');
  if (!userId) return next(new HttpError(401, 'Missing X-User-Id header'));
  req.user = { id: String(userId) };
  return next();
}

module.exports = {
  authMiddleware,
};
