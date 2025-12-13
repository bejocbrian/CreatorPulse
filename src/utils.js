const { HttpError } = require('./errors');

/**
 * @template {(...args: any[]) => any} T
 * @param {T} fn
 */
function asyncHandler(fn) {
  return function handler(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * @param {number} status
 * @param {string} message
 * @param {any} [details]
 */
function fail(status, message, details) {
  throw new HttpError(status, message, details);
}

module.exports = {
  asyncHandler,
  fail,
};
