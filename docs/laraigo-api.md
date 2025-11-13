# 🎯 Documentación Técnica - API Laraigo (Arquitectura Empresarial)

Esta documentación detalla la **arquitectura empresarial completa** de la API Laraigo construida con **NestJS**, implementando **logging estructurado con Pino**, **observabilidad**, **rate limiting**, **health checks** y **seguridad de nivel producción**.

---

## 📋 ARQUITECTURA GENERAL EMPRESARIAL

### Arquitectura de Alto Nivel
La API Laraigo implementa una **arquitectura modular empresarial** basada en **NestJS** con los siguientes pilares fundamentales:

1. **🏗️ Arquitectura Modular** - Separación clara de responsabilidades
2. **📊 Logging Estructurado (Pino)** - Observabilidad y monitoreo empresarial
3. **🔒 Seguridad Robusta** - JWT + Redis + Rate Limiting
4. **⚡ Performance Optimizada** - Prisma ORM + Redis Caching
5. **🩺 Health Monitoring** - Endpoints de salud y métricas
6. **🛡️ Protección contra Abusos** - Throttling y validación estricta

### Estructura Arquitectónica Actual
```
src/
├── auth/                       # 🔐 Autenticación y Autorización
│   ├── auth.controller.ts      # Controlador con rate limiting
│   ├── auth.service.ts         # Lógica con Pino logging
│   ├── jwt.strategy.ts         # Estrategia Passport con logging
│   ├── guards/                 # Guards de protección
│   └── decorators/             # Decoradores personalizados
├── campaigns/                  # 📢 Gestión de Campañas
│   ├── campaign.controller.ts  # CRUD con logging estructurado
│   ├── campaign.service.ts     # Lógica con eventos Pino
│   └── dto/                    # Validación de datos
├── users/                      # 👥 Gestión de Usuarios  
│   ├── user.controller.ts      # CRUD con autorización
│   ├── user.service.ts         # Lógica con logging estructurado
│   └── dto/                    # DTOs de validación
├── health/                     # 🩺 Health Checks (NUEVO)
│   ├── health.controller.ts    # Endpoint de salud
│   ├── health.service.ts       # Monitoreo de servicios
│   └── health.module.ts        # Configuración de health
├── prisma/                     # 🗄️ Database ORM
│   ├── prisma.service.ts       # Servicio con middleware logging
│   └── prisma.module.ts        # Configuración Prisma
├── redis/                      # ⚡ Cache y Sesiones
│   ├── redis.service.ts        # Servicio con logging estructurado
│   └── redis.module.ts         # Configuración Redis
├── config/                     # ⚙️ Configuración (NUEVO)
│   └── logger.config.ts        # Configuración Pino empresarial
├── middleware/                 # 🔄 Middleware (NUEVO)
│   └── request-context.middleware.ts  # Context y request ID
├── filters/                    # 🚨 Exception Handling (NUEVO)
│   └── global-exception.filter.ts    # Manejo global con Pino
├── main.ts                     # 🚀 Bootstrap de aplicación
└── app.module.ts               # 📦 Módulo raíz con throttling

prisma/
├── schema.prisma              # Esquema principal
└── campaign.prisma           # Esquema de campañas (multi-DB)
```

### Patrones Arquitectónicos Implementados
- **🏗️ Clean Architecture** - Separación en capas bien definidas
- **🔄 Dependency Injection** - Inyección automática con NestJS
- **📊 Event-Driven Logging** - Eventos estructurados con Pino
- **🛡️ Guard Pattern** - Protección de rutas y autorización
- **🎯 Strategy Pattern** - Autenticación JWT con Passport
- **🔧 Middleware Pattern** - Request context y logging automático
- **📋 DTO Pattern** - Validación y transformación de datos
- **🩺 Health Check Pattern** - Monitoreo de dependencias externas

---

## 🗄️ IMPLEMENTACIÓN DE PRISMA ORM (Multi-Database)

### Arquitectura Multi-Database
El proyecto implementa una **arquitectura multi-database** con **Prisma ORM** optimizada para diferentes dominios:

1. **Base de Datos Principal** - Usuarios y autenticación
2. **Base de Datos de Campañas** - Gestión separada de campañas
3. **Logging Middleware** - Monitoreo de queries con Pino
4. **Health Monitoring** - Verificación de conectividad

### Configuración del Esquema Principal
```prisma
// prisma/schema.prisma - Base de datos principal
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

model User {
  id           Int      @id @default(autoincrement())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(USER)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([email])        # Optimización búsquedas por email
  @@index([createdAt])    # Ordenamiento temporal
  @@map("users")
}
```

### Configuración del Esquema de Campañas
```prisma
// prisma/campaign.prisma - Base de datos de campañas
generator campaignClient {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma-campaign"
}

datasource campaignDb {
  provider = "sqlite"
  url      = env("DATABASE_URL_CAMPAIGNS")
}

model Campaign {
  id             Int       @id @default(autoincrement())
  title          String
  description    String?
  startDate      DateTime
  endDate        DateTime?
  source         String
  executionType  String
  scheduledDate  DateTime?
  scheduledTime  String?
  group          String
  channel        String
  messageType    String
  template       String
  persons        Json?
  filePath       String?
  status         String?   @default("draft")
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([status])       # Filtros por estado
  @@index([startDate])    # Ordenamiento temporal
  @@index([source])       # Agrupación por fuente
  @@index([channel])      # Filtros por canal
  @@map("campaigns")
}
```

### Servicio Prisma con Logging Empresarial
```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(
    @InjectPinoLogger(PrismaService.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    
    this.logger.info(
      { event: 'PRISMA_CONNECT', module: 'PrismaService' },
      'Database connected successfully'
    );

    // Middleware de logging configurável
    if (process.env.LOG_PRISMA === 'true') {
      (this as any).$use(async (params, next) => {
        const startTime = Date.now();
        
        this.logger.debug(
          { 
            event: 'QUERY_START', 
            module: 'PrismaService',
            model: params.model,
            action: params.action,
            metadata: { paramsLength: JSON.stringify(params.args).length }
          },
          'Prisma query started'
        );

        try {
          const result = await next(params);
          const durationMs = Date.now() - startTime;
          
          this.logger.debug(
            { 
              event: 'QUERY_END', 
              module: 'PrismaService',
              model: params.model,
              action: params.action,
              durationMs
            },
            'Prisma query completed'
          );
          
          return result;
        } catch (error) {
          const durationMs = Date.now() - startTime;
          
          this.logger.error(
            { 
              event: 'QUERY_ERROR', 
              module: 'PrismaService',
              model: params.model,
              action: params.action,
              durationMs,
              error: error.message
            },
            'Prisma query failed'
          );
          
          throw error;
        }
      });
    }
  }
}
```

### Servicio Prisma de Campañas
```typescript
// src/campaigns/prisma/campaign-prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient as CampaignPrismaClient } from '.prisma-campaign';

@Injectable()
export class CampaignPrismaService extends CampaignPrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

### Scripts NPM para Multi-Database
```json
{
  "scripts": {
    // Base de datos principal
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force",
    
    // Base de datos de campañas
    "campaign:generate": "prisma generate --schema=prisma/campaign.prisma",
    "campaign:migrate": "prisma migrate dev --schema=prisma/campaign.prisma",
    "campaign:studio": "prisma studio --schema=prisma/campaign.prisma"
  }
}
```

### Ventajas del Diseño Multi-Database
- **🎯 Separación de Dominios** - Usuarios vs Campañas aislados
- **⚡ Performance Optimizada** - Consultas específicas por dominio
- **📈 Escalabilidad** - Crecimiento independiente de cada BD
- **🔒 Seguridad** - Aislamiento de datos sensibles
- **🩺 Monitoreo Granular** - Logging específico por modelo
- **🚀 Deploy Flexible** - Diferentes estrategias por database

---

## 📊 LOGGING ESTRUCTURADO EMPRESARIAL (PINO)

### Arquitectura de Logging de Nivel Producción
La API Laraigo implementa **logging estructurado con Pino**, el logger de **mayor performance** para Node.js, utilizado por empresas como **Uber**, **Netflix** y **Stripe**.

#### Características Empresariales Implementadas:
- **📊 JSON Estructurado** - Parseable por sistemas de agregación
- **🔍 Request Tracing** - UUID único por request para trazabilidad completa
- **🛡️ Redacción de Datos Sensibles** - Passwords, tokens, headers automáticamente censurados
- **⚡ Performance Optimizada** - ~10x más rápido que console.log
- **📈 Configurable por Ambiente** - Pretty-print en desarrollo, JSON en producción
- **🎯 Event-Driven** - Eventos estructurados para análisis automatizado

### Configuración Pino Empresarial
```typescript
// src/config/logger.config.ts
import { Params } from 'nestjs-pino';

export const pinoConfig: Params = {
  pinoHttp: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    transport: process.env.NODE_ENV !== 'production' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    } : undefined,
    autoLogging: process.env.LOG_REQUESTS !== 'false',
    genReqId: () => require('crypto').randomUUID(),
    
    // Serialización estructurada
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
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
          headers: {
            'content-type': res.getHeader?.('content-type'),
            'content-length': res.getHeader?.('content-length'),
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
    
    // Metadatos del servicio
    formatters: {
      bindings() {
        return {
          service: 'laraigo-api',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        };
      },
    },
    
    // Redacción automática de datos sensibles
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
```

### Implementación en Servicios con Eventos Estructurados
```typescript
// src/auth/auth.service.ts - Ejemplo de logging estructurado
import { Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    // otras dependencias...
  ) {}

  async login(dto: LoginDto) {
    // Inicio del proceso
    this.logger.info(
      { event: 'USER_LOGIN_ATTEMPT', module: 'AuthService', email: dto.email },
      'User login attempt'
    );

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      this.logger.warn(
        { event: 'USER_LOGIN_FAILED', module: 'AuthService', email: dto.email },
        'Invalid credentials provided'
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokenPair(user.id, user.role);
    
    // Éxito con contexto completo
    this.logger.info(
      { 
        event: 'USER_LOGIN_SUCCESS', 
        module: 'AuthService',
        userId: user.id,
        email: user.email,
        role: user.role 
      }, 
      'User logged in successfully'
    );

    return { user, ...tokens };
  }
}
```

### Middleware de Request Context con Trazabilidad
```typescript
// src/middleware/request-context.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly logger: PinoLogger) {}

  use(req: any, res: Response, next: NextFunction) {
    const requestId = randomUUID();
    req.requestId = requestId;
    
    this.logger.assign({ requestId });
    
    if (process.env.LOG_REQUESTS !== 'false') {
      const startTime = Date.now();
      
      // Log de inicio con contexto completo
      this.logger.info(
        {
          event: 'REQUEST_START',
          module: 'RequestContextMiddleware',
          requestId,
          method: req.method,
          url: req.url,
          userAgent: req.get('user-agent'),
          ip: req.ip,
        },
        'Incoming request',
      );
      
      // Log de finalización con métricas
      res.on('finish', () => {
        const durationMs = Date.now() - startTime;
        
        this.logger.info(
          {
            event: 'REQUEST_COMPLETE',
            module: 'RequestContextMiddleware',
            requestId,
            statusCode: res.statusCode,
            durationMs,
            contentLength: res.get('content-length'),
          },
          'Request completed',
        );
      });
    }
    
    next();
  }
}
```

### Exception Handling con Logging Estructurado
```typescript
// src/filters/global-exception.filter.ts
import { Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(GlobalExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string, user?: { userId: number } }>();

    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : exception?.message || 'Internal server error';

    const errorMessage = typeof message === 'string' ? message : (message as any)?.message || 'Unknown error';

    const errorContext = {
      event: status >= 500 ? 'EXCEPTION_ERROR' : 'EXCEPTION_WARN',
      module: 'GlobalExceptionFilter',
      requestId: request.requestId,
      userId: request.user?.userId,
      method: request.method,
      url: request.url,
      statusCode: status,
      userAgent: request.get('user-agent'),
      ip: request.ip,
      metadata: {
        exceptionType: exception.constructor.name,
        stack: process.env.NODE_ENV !== 'production' ? exception.stack : undefined
      }
    };

    // Logging estructurado por nivel de severidad
    if (status >= 500) {
      this.logger.error(errorContext, `Internal Server Error: ${errorMessage}`);
    } else if (status >= 400) {
      this.logger.warn(errorContext, `Client Error: ${errorMessage}`);
    } else {
      this.logger.info(errorContext, `Exception occurred: ${errorMessage}`);
    }

    response.status(status).json({
      statusCode: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.requestId,
    });
  }
}
```

### Variables de Configuración de Logging
```env
# Configuración de logging empresarial
LOG_LEVEL=debug              # debug, info, warn, error
LOG_REQUESTS=true            # true/false - Logging de requests
LOG_PRISMA=true              # true/false - Logging de queries
LOG_REDIS=false              # true/false - Logging de Redis operations
NODE_ENV=development         # development/production
```

### Salida de Logs Estructurados

**Desarrollo (Pretty-printed):**
```
[2025-11-13 10:45:30.123 -0500] INFO: User logged in successfully
    service: "laraigo-api"
    version: "0.0.1"
    environment: "development"
    event: "USER_LOGIN_SUCCESS"
    module: "AuthService"
    requestId: "9f542a9a-c653-474f-8d59-ba01e5218eef"
    userId: 1
    email: "nirvana.garcia@laraigo.com"
    role: "ADMIN"
```

**Producción (JSON estructurado):**
```json
{
  "level": 30,
  "time": 1699887330123,
  "service": "laraigo-api",
  "version": "0.0.1",
  "environment": "production",
  "event": "USER_LOGIN_SUCCESS",
  "module": "AuthService",
  "requestId": "9f542a9a-c653-474f-8d59-ba01e5218eef",
  "userId": 1,
  "email": "nirvana.garcia@laraigo.com",
  "role": "ADMIN",
  "msg": "User logged in successfully"
}
```

### Ventajas de la Implementación Pino
- **⚡ Performance Superior** - ~10x más rápido que console.log
- **📊 Análisis Automatizado** - JSON parseable para ELK, Datadog, CloudWatch
- **🔍 Trazabilidad Completa** - Request ID único en toda la cadena
- **🛡️ Seguridad** - Redacción automática de datos sensibles
- **📈 Escalabilidad** - Minimal overhead, non-blocking I/O
- **🔧 Flexibilidad** - Configuración granular por ambiente

---

## 🔒 SEGURIDAD Y AUTENTICACIÓN EMPRESARIAL

### Arquitectura de Seguridad Multinivel
La API implementa **seguridad de nivel empresarial** con múltiples capas de protección:

#### Stack de Seguridad Completo:
1. **🔐 JWT + Redis Sessions** - Autenticación stateless con revocación inmediata
2. **🛡️ Rate Limiting** - Protección contra ataques de fuerza bruta
3. **🔒 Bcrypt Hashing** - Salt rounds optimizados para contraseñas
4. **🚨 Exception Handling** - Manejo seguro sin información sensible
5. **📊 Security Logging** - Monitoreo de eventos de seguridad
6. **⚡ Performance Guards** - Validación eficiente con Passport

### JWT con Redis Session Store (Implementación Híbrida)

#### Implementación JWT + Redis Híbrida
La combinación de **JWT stateless** con **Redis session tracking** proporciona:
- ✅ **Performance de JWT** - Validación local sin consulta DB
- ✅ **Revocación inmediata** - Invalidación via Redis
- ✅ **Gestión de sesiones** - Control granular de dispositivos
- ✅ **Logging completo** - Trazabilidad de eventos de seguridad

```typescript
// src/auth/auth.service.ts - Implementación híbrida completa
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly ADMIN_EMAIL = 'nirvana.garcia@laraigo.com';

  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async login(dto: LoginDto) {
    this.logger.info(
      { event: 'USER_LOGIN_ATTEMPT', module: 'AuthService', email: dto.email },
      'User login attempt'
    );

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    // Verificación segura con timing-safe comparison
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      this.logger.warn(
        { event: 'USER_LOGIN_FAILED', module: 'AuthService', email: dto.email },
        'Invalid credentials provided'
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokenPair(user.id, user.role);
    
    this.logger.info(
      { 
        event: 'USER_LOGIN_SUCCESS', 
        module: 'AuthService',
        userId: user.id, 
        email: user.email, 
        role: user.role 
      }, 
      'User logged in successfully'
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  // Generación de token pair con Redis session tracking
  private async generateTokenPair(userId: number, role: Role): Promise<TokenPair> {
    const accessJti = uuidv4();   // Unique token identifier
    const refreshJti = uuidv4();

    // Access Token (15 minutos)
    const accessToken = this.jwtService.sign({
      sub: userId,
      role: role,
      jti: accessJti,
    }, {
      expiresIn: '15m',
    });

    // Refresh Token (7 días)
    const refreshToken = this.jwtService.sign({
      sub: userId,
      role: role,
      jti: refreshJti,
    }, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const accessTtl = 15 * 60;        // 15 minutos
    const refreshTtl = 7 * 24 * 60 * 60; // 7 días

    // Almacenamiento en Redis para validación y revocación
    await Promise.all([
      this.redisService.set(`access:${accessJti}`, userId.toString(), accessTtl),
      this.redisService.set(`refresh:${refreshJti}`, userId.toString(), refreshTtl),
      this.redisService.sadd(`user:${userId}:sessions`, accessJti),
      this.redisService.sadd(`user:${userId}:sessions`, refreshJti),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: '15m',
    };
  }

  // Logout con revocación inmediata
  async logout(user: UserSession): Promise<void> {
    await Promise.all([
      this.redisService.del(`access:${user.jti}`),
      this.redisService.srem(`user:${user.userId}:sessions`, user.jti),
    ]);
    
    this.logger.info(
      { 
        event: 'USER_LOGOUT', 
        module: 'AuthService',
        userId: user.userId, 
        jti: user.jti 
      }, 
      'User token revoked'
    );
  }

  // Logout de todas las sesiones
  async logoutAll(user: UserSession): Promise<void> {
    const sessions = await this.redisService.smembers(`user:${user.userId}:sessions`);
    
    const deletePromises = sessions.flatMap(jti => [
      this.redisService.del(`access:${jti}`),
      this.redisService.del(`refresh:${jti}`),
    ]);

    deletePromises.push(this.redisService.del(`user:${user.userId}:sessions`));

    await Promise.all(deletePromises);
    
    this.logger.info(
      { 
        event: 'USER_LOGOUT_ALL', 
        module: 'AuthService',
        userId: user.userId, 
        sessionCount: sessions.length 
      }, 
      'All user sessions revoked'
    );
  }
}
```

### Rate Limiting Empresarial

#### Configuración Multi-Capa Avanzada
Protección escalonada contra ataques DDoS y abuso de API:

```typescript
// src/common/throttler.config.ts - Configuración empresarial
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = [
  {
    name: 'short',
    ttl: 1000,      // 1 segundo
    limit: 3,       // 3 requests por segundo (ráfagas)
  },
  {
    name: 'medium', 
    ttl: 10000,     // 10 segundos
    limit: 20,      // 20 requests por 10 segundos (sostenido)
  },
  {
    name: 'long',
    ttl: 60000,     // 1 minuto
    limit: 100,     // 100 requests por minuto (volumen)
  }
];

// src/app.module.ts - Integración con logging
@Module({
  imports: [
    ThrottlerModule.forRoot(throttlerConfig),
    // RedisModule para storage distribuido de rate limiting
    RedisModule.forRoot({
      connectionOptions: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

#### Rate Limiting Específico por Endpoint
```typescript
// src/auth/auth.controller.ts - Protección específica
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 registros por minuto
  async register(@Body() registerDto: RegisterDto) {
    // implementación...
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 logins por minuto
  async login(@Body() loginDto: LoginDto) {
    // implementación...
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 refresh por minuto
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    // implementación...
  }
}
```

### JWT Strategy con Logging Estructurado
```typescript
// src/auth/jwt.strategy.ts - Validación con logging empresarial
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectPinoLogger(JwtStrategy.name)
    private readonly logger: PinoLogger,
    private redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<UserSession> {
    this.logger.debug(
      { 
        event: 'JWT_VALIDATE', 
        module: 'JwtStrategy', 
        userId: payload.sub, 
        jti: payload.jti 
      },
      'Validating JWT token'
    );
    
    // Verificación en Redis para revocación inmediata
    const tokenExists = await this.redisService.exists(`access:${payload.jti}`);
    
    if (!tokenExists) {
      this.logger.warn(
        { 
          event: 'JWT_TOKEN_NOT_FOUND', 
          module: 'JwtStrategy', 
          userId: payload.sub, 
          jti: payload.jti 
        },
        'Token not found in session store'
      );
      throw new UnauthorizedException('Token not found in session store');
    }

    this.logger.debug(
      { 
        event: 'JWT_VALIDATE_SUCCESS', 
        module: 'JwtStrategy', 
        userId: payload.sub 
      },
      'JWT token validated successfully'
    );

    return {
      userId: payload.sub,
      role: payload.role,
      jti: payload.jti,
    };
  }
}
```

#### Tipos TypeScript para JWT
```typescript
// src/auth/auth.types.ts
export interface JwtPayload {
  sub: number;    // User ID
  role: Role;     // User role
  jti: string;    // JWT identifier
  iat?: number;   // Issued at
  exp?: number;   // Expires at
}

export interface UserSession {
  userId: number;
  role: Role;
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}
```

### 4.3 Redis - Gestión de Sesiones

#### Configuración del Cliente Redis
```typescript
// src/redis/redis.service.ts
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private isConnected = false;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,         // Conexión bajo demanda
      maxRetriesPerRequest: 1,   // Reintentos limitados
      enableReadyCheck: false,   // Sin health checks automáticos
      connectTimeout: 5000,      // Timeout de conexión
    });

    this.setupEventHandlers();
    this.attemptConnection();
  }
}
```

#### Almacenamiento de Sesiones
```typescript
// Estructura de datos en Redis:
// access:{jti} -> userId (TTL: 15min)
// refresh:{jti} -> userId (TTL: 7d)  
// user:{userId}:sessions -> Set[jti1, jti2, ...]

// Almacenar token
await this.redisService.set(`access:${accessJti}`, userId.toString(), ttl);

// Verificar existencia
const tokenExists = await this.redisService.exists(`access:${payload.jti}`);

// Revocar token
await this.redisService.del(`access:${jti}`);

// Revocar todas las sesiones de un usuario
const sessions = await this.redisService.smembers(`user:${userId}:sessions`);
const deletePromises = sessions.flatMap(jti => [
  this.redisService.del(`access:${jti}`),
  this.redisService.del(`refresh:${jti}`)
]);
```

### 4.4 Estrategia JWT con Passport

#### Implementación de JWT Strategy
```typescript
// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private redisService: RedisService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Bearer token
      ignoreExpiration: false,                    // Validar expiración
      secretOrKey: process.env.JWT_ACCESS_SECRET, // Secret para verificación
    });
  }

  // Validación personalizada después de verificar firma JWT
  async validate(payload: JwtPayload): Promise<UserSession> {
    // Verificar que el token existe en Redis (no revocado)
    const tokenExists = await this.redisService.exists(`access:${payload.jti}`);
    
    if (!tokenExists) {
      throw new UnauthorizedException('Token not found in session store');
    }

    // Retornar datos del usuario para el contexto de request
    return {
      userId: payload.sub,
      role: payload.role,
      jti: payload.jti,
    };
  }
}
```

### 4.5 Guards y Protección de Rutas

#### JWT Auth Guard
```typescript
// Protección automática en controladores
@Controller('campaigns')
@UseGuards(JwtAuthGuard)  // Todas las rutas requieren autenticación
export class CampaignController {
  
  @Get()
  async findAll(@User() user: UserSession) {
    // user contiene datos del token validado
    return this.campaignService.findAll(user.userId);
  }
}
```

#### Decorador de Usuario
```typescript
// src/auth/decorators/user.decorator.ts
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserSession => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Datos del usuario del JWT Strategy
  },
);
```

### 4.6 Flujo Completo de Autenticación

#### 1. Registro/Login
```
Cliente → POST /auth/login → AuthController → AuthService
    ↓
Validar credenciales (bcrypt.compare)
    ↓
Generar JWT tokens (access + refresh)
    ↓
Almacenar en Redis con TTL
    ↓
Retornar tokens al cliente
```

#### 2. Acceso a Recursos Protegidos
```
Cliente → GET /campaigns (Bearer token) → JwtAuthGuard
    ↓
Verificar firma JWT (passport-jwt)
    ↓
Validar existencia en Redis (JwtStrategy)
    ↓
Inyectar datos de usuario en request
    ↓
Ejecutar controlador con contexto de usuario
```

#### 3. Refresh de Tokens
```
Cliente → POST /auth/refresh → AuthService
    ↓
Validar refresh token
    ↓
Revocar tokens anteriores de Redis
    ↓
Generar nuevos tokens
    ↓
Actualizar Redis con nuevos TTL
```

#### 4. Logout/Revocación
```
Cliente → POST /auth/logout → AuthService
    ↓
Eliminar tokens de Redis
    ↓
Remover de lista de sesiones del usuario
    ↓
Token queda invalidado inmediatamente
```

### 4.7 Características de Seguridad

#### Ventajas del Sistema Implementado:
- **Stateless JWT** con **stateful session tracking**
- **Revocación inmediata** de tokens vía Redis
- **Gestión de múltiples sesiones** por usuario
- **Separación de concerns** (auth, autorización, sesiones)
- **TTL automático** para limpieza de tokens expirados
- **Secrets separados** para access y refresh tokens
- **Hashing seguro** con bcrypt y salt rounds
- **Validación a múltiples niveles** (JWT + Redis + Guards)

---

## 🏥 HEALTH MONITORING & OBSERVABILITY

### Sistema de Health Checks Empresarial
Monitoreo integral de la salud del sistema con métricas en tiempo real:

```typescript
// src/health/health.controller.ts - Endpoint de health empresarial
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    @InjectPinoLogger(HealthController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    const startTime = Date.now();
    
    this.logger.info(
      { event: 'HEALTH_CHECK_START', module: 'HealthController' },
      'Starting health check'
    );

    const result = await this.health.check([
      // Base de datos principal
      () => this.db.pingCheck('database', this.prisma),
      
      // Base de datos de campañas  
      () => this.db.pingCheck('campaigns_db', this.campaignPrisma),
      
      // Redis para sesiones
      async () => {
        const redisHealth = await this.checkRedisHealth();
        return redisHealth;
      },
      
      // Memoria y recursos del sistema
      () => this.checkSystemResources(),
    ]);

    const duration = Date.now() - startTime;
    
    this.logger.info(
      { 
        event: 'HEALTH_CHECK_COMPLETE', 
        module: 'HealthController',
        duration,
        status: result.status,
        checks: Object.keys(result.info || {}).length
      },
      'Health check completed'
    );

    return result;
  }

  private async checkRedisHealth() {
    try {
      await this.redisService.ping();
      return {
        redis: {
          status: 'up',
          message: 'Redis connection is healthy'
        }
      };
    } catch (error) {
      this.logger.error(
        { event: 'REDIS_HEALTH_FAIL', module: 'HealthController', error: error.message },
        'Redis health check failed'
      );
      throw new Error('Redis is not responding');
    }
  }

  private async checkSystemResources() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      system: {
        status: 'up',
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        uptime: Math.round(uptime),
        node_version: process.version
      }
    };
  }
}
```

### Configuración del Módulo Health
```typescript
// src/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

### Response de Health Check
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "campaigns_db": {
      "status": "up"
    },
    "redis": {
      "status": "up",
      "message": "Redis connection is healthy"
    },
    "system": {
      "status": "up",
      "memory": {
        "used": 45,
        "total": 128,
        "unit": "MB"
      },
      "uptime": 3600,
      "node_version": "v18.17.0"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "campaigns_db": {
      "status": "up" 
    },
    "redis": {
      "status": "up"
    },
    "system": {
      "status": "up"
    }
  }
}
```

### Integración con Monitoreo Externo
```typescript
// Para integrar con sistemas como DataDog, New Relic, Prometheus:
@Get('metrics')
async getMetrics() {
  return {
    timestamp: new Date().toISOString(),
    service: 'laraigo-api',
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    metrics: {
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      active_connections: this.getActiveConnections(),
      database_pool_size: await this.getDatabasePoolMetrics(),
      redis_connections: await this.getRedisMetrics(),
    }
  };
}
```

---

## ⚙️ CONFIGURACIÓN Y DESPLIEGUE

#### Variables de Ambiente Requeridas:
```env
# 📊 Configuración de Logging
LOG_LEVEL=info                    # debug | info | warn | error
LOG_REQUESTS=true                 # Habilitar logging de requests
NODE_ENV=production               # development | production

# 🗄️ Base de Datos Principal (Usuarios)
DATABASE_URL="postgresql://user:pass@localhost:5432/laraigo"

# 📈 Base de Datos de Campañas  
CAMPAIGN_DATABASE_URL="postgresql://user:pass@localhost:5432/campaigns"

# 🔐 JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# 🏪 Redis para Sesiones
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_URL=redis://localhost:6379

# 🛡️ Rate Limiting
THROTTLE_TTL=60000               # TTL en milisegundos
THROTTLE_LIMIT=100               # Requests por TTL

# 🏥 Health Monitoring
HEALTH_CHECK_ENABLED=true        # Habilitar health checks
```

---

