/** Central error handler — every controller throws and this returns clean JSON. */
export function notFound(req, res) {
  res.status(404).json({ error: 'The resource you are looking for was not found.' });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) console.error('[server error]', err.message);
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong. Please try again.' : err.message,
    code: err.code,
  });
}

/** Wraps async controllers so rejected promises hit errorHandler. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Shortcut to create a "not found" error. */
export const httpError = (status, message, code) => {
  const e = new Error(message);
  e.status = status;
  e.code = code;
  return e;
};
