// Operational error type carried through the request pipeline. The error
// handler serializes these as { detail } with the given status — matching the
// original FastAPI backend's error contract.

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }

  static badRequest(detail) {
    return new ApiError(400, detail);
  }

  static unauthorized(detail) {
    return new ApiError(401, detail);
  }

  static notFound(detail) {
    return new ApiError(404, detail);
  }

  static conflict(detail) {
    return new ApiError(409, detail);
  }
}
