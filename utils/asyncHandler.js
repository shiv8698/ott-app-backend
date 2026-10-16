// Lets us write async controllers without try/catch; errors go to the central handler.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
