import { Params } from 'nestjs-pino';

export const pinoConfig: Params = {
  pinoHttp: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
              singleLine: false,
            },
          }
        : undefined,
    autoLogging: process.env.LOG_REQUESTS !== 'false',
    genReqId: () => require('crypto').randomUUID(),
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          headers: {
            host: req.headers.host,
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
            authorization: req.headers.authorization ? '[REDACTED]' : undefined,
          },
          query: req.query,
          params: req.params,
          remoteAddress: req.connection?.remoteAddress,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
          headers: {
            'content-type': res.getHeader?.('content-type') || undefined,
            'content-length': res.getHeader?.('content-length') || undefined,
          },
        };
      },
      err(err) {
        return {
          type: err.constructor.name,
          message: err.message,
          stack: err.stack,
          code: err.code,
          statusCode: err.statusCode,
        };
      },
    },
    formatters: {
      level(label) {
        return { level: label };
      },
      bindings() {
        return {
          service: 'laraigo-api',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        };
      },
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.passwordHash',
        'req.body.token',
        'req.body.refreshToken',
      ],
      censor: '[REDACTED]',
    },
  },
};