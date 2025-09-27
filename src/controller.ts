import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { processFileUploads } from './file-upload';
import { executeGlobalHandlers } from './global-handlers';
import { executeGuards } from './guards';
import { classHeaderMetadata, guardMetadata, parameterMetadata, routeMetadata } from './metadata';
import { ControllerConfig } from './types';
import { createErrorResponse } from './utils';
import { validateRequest } from './validation';

export const registerController = (app: FastifyInstance | any, controllerClass: any, prefix: string = '') => {
  const instance = new controllerClass();
  const routes = routeMetadata.get(controllerClass) || [];
  const classGuards = guardMetadata.get(controllerClass) || [];
  const classHeaders = classHeaderMetadata.get(controllerClass) || {};

  routes.forEach(route => {
    const fullPath = prefix + route.path;
    const allGuards = [...classGuards, ...route.guards];
    const allHeaders = { ...classHeaders, ...route.headers };

    const handler = async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        Object.entries(allHeaders).forEach(([key, value]) => {
          reply.header(key, value);
        });

        const globalHandlersPassed = await executeGlobalHandlers(req, reply, route.method, fullPath);
        if (!globalHandlersPassed || reply.sent) return;

        if (route.fileUpload) {
          const fileProcessed = await processFileUploads(req, reply, route.fileUpload);
          if (!fileProcessed || reply.sent) return;
        }

        if (allGuards.length > 0) {
          const guardsPassed = await executeGuards(allGuards, req, reply);
          if (!guardsPassed) return;
        }

        const isValid = await validateRequest(req, reply, {
          body: route.fileUpload ? undefined : route.bodySchema,
          query: route.querySchema,
          params: route.paramsSchema
        } as any);
        if (!isValid) return;

        const paramKey = `${controllerClass.name}.${route.handler}`;
        const params = parameterMetadata.get(paramKey) || [];

        const args: any[] = [];
        params.sort((a, b) => a.index - b.index);

        for (const param of params) {
          switch (param.type) {
            case 'body':
              args[param.index] = req.body;
              break;
            case 'query':
              args[param.index] = req.query;
              break;
            case 'params':
              args[param.index] = req.params;
              break;
            case 'request':
              args[param.index] = req;
              break;
            case 'response':
              args[param.index] = reply;
              break;
            case 'next':
              args[param.index] = () => {};
              break;
            case 'ip':
              args[param.index] = req.ip;
              break;
          }
        }

        const result = await instance[route.handler](...args);

        if (!reply.sent) {
          reply.send(result);
        }
      } catch (error) {
        console.error('Route handler error:', error);
        if (!reply.sent) {
          reply.status(500).send(createErrorResponse('Internal server error'));
        }
      }
    };

    app.route({
      method: route.method,
      url: fullPath,
      handler
    });

    console.log(`Registered ${route.method} ${fullPath}`);
  });
};

export const registerControllers = (app: FastifyInstance | any, configs: ControllerConfig[]) => {
  configs.forEach(config => {
    registerController(app, config.controller, config.prefix || '');
  });
};

// Example usage:
// registerControllers(app, [
//   { controller: UserController, prefix: '/api/users' },
// ]);
