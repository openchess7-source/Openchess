// Express 4 does not automatically catch rejected promises inside async
// route handlers — an unhandled rejection there just leaves the request
// hanging with no response, which is worse than a silent fallback: the
// client sits there forever with no error surfaced at all. Wrap every
// async route with this so DB/network failures always produce a real
// error response.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
