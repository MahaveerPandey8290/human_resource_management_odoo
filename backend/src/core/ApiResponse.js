/**
 * Standardized API response formatter.
 */
export class ApiResponse {
  /**
   * Sends 200 OK response with data and optional pagination meta.
   * @param {import("express").Response} res
   * @param {any} [data={}]
   * @param {object} [meta]
   */
  static ok(res, data = {}, meta = undefined) {
    const requestId = res.req?.id || res.getHeader("X-Request-Id");
    const payload = {
      success: true,
      data,
      ...(meta ? { meta } : {}),
      requestId
    };
    return res.status(200).json(payload);
  }

  /**
   * Sends 201 Created response.
   * @param {import("express").Response} res
   * @param {any} [data={}]
   */
  static created(res, data = {}) {
    const requestId = res.req?.id || res.getHeader("X-Request-Id");
    return res.status(201).json({
      success: true,
      data,
      requestId
    });
  }

  /**
   * Sends 204 No Content response.
   * @param {import("express").Response} res
   */
  static noContent(res) {
    return res.status(204).send();
  }
}
