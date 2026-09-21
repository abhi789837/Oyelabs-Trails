const HTTP_STATUS = {
  BadRequestException: 400,
  UnauthorizedException: 401,
  ForbiddenException: 403,
  NotFoundException: 404,
  RequestTimeoutException: 408,
  ConflictException: 409,
};

/**
 * Simulates Nest's request lifecycle for one request.
 * @returns {{ log: string[], status: number, handledBy: string | null }}
 */
function simulateRequest(config) {
  const log = [];
  const outcome = config.outcome || {};
  const bound = (group, levels) => levels.flatMap((level) => (config[group] && config[group][level]) || []);
  const failureAt = (point) => {
    if (outcome.at !== point) return null;
    return outcome.deny ? "ForbiddenException" : outcome.throw || null;
  };

  let error = null;
  let fromMiddleware = false;

  for (const name of config.middleware || []) {
    log.push("middleware:" + name);
    error = failureAt("middleware:" + name);
    if (error) {
      fromMiddleware = true;
      break;
    }
  }

  if (!error) {
    for (const name of bound("guards", ["global", "controller", "route"])) {
      log.push("guard:" + name);
      error = failureAt("guard:" + name);
      if (error) break;
    }
  }

  if (!error) {
    const entered = [];
    for (const name of bound("interceptors", ["global", "controller", "route"])) {
      log.push("interceptor:" + name + ":before");
      error = failureAt("interceptor:" + name);
      if (error) break;
      entered.push(name);
    }
    if (!error) {
      for (const name of bound("pipes", ["global", "controller", "route", "param"])) {
        log.push("pipe:" + name);
        error = failureAt("pipe:" + name);
        if (error) break;
      }
    }
    if (!error) {
      log.push("handler");
      error = failureAt("handler");
    }
    for (const name of entered.reverse()) log.push("interceptor:" + name + (error ? ":error" : ":after"));
  }

  if (!error) return { log, status: config.method === "POST" ? 201 : 200, handledBy: null };

  const isHttp = Object.prototype.hasOwnProperty.call(HTTP_STATUS, error);
  const status = isHttp ? HTTP_STATUS[error] : 500;
  const levels = fromMiddleware ? ["global"] : ["route", "controller", "global"];
  for (const level of levels) {
    const filters = ((config.filters && config.filters[level]) || []).slice().reverse();
    for (const filter of filters) {
      const catches = filter.catches;
      if (catches === "*" || catches.includes(error) || (isHttp && catches.includes("HttpException"))) {
        log.push("filter:" + filter.name);
        return { log, status, handledBy: filter.name };
      }
    }
  }
  return { log, status, handledBy: "default" };
}
