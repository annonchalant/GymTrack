// Wraps an async route handler so rejections flow into the error middleware
// instead of crashing the process or hanging the request.

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
