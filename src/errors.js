class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   * @param {any} [details]
   */
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

/**
 * @param {any} err
 * @returns {err is HttpError}
 */
function isHttpError(err) {
  return Boolean(err && err.name === 'HttpError' && typeof err.status === 'number');
}

module.exports = {
  HttpError,
  isHttpError,
};
