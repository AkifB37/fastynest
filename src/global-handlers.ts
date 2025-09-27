import { FastifyRequest, FastifyReply } from 'fastify';
import { GlobalHandlerConfig, HttpMethod } from './types';
import { createErrorResponse } from './utils';

const globalHandlers = new Map<string, GlobalHandlerConfig>();

export const registerGlobalHandler = (name: string, config: GlobalHandlerConfig) => {
  globalHandlers.set(name, {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    paths: ['*'],
    skipRoutes: [],
    priority: 0,
    ...config
  });
  console.log(`Registered global handler: ${name}`);
};

export const removeGlobalHandler = (name: string) => {
  const removed = globalHandlers.delete(name);
  if (removed) {
    console.log(`Removed global handler: ${name}`);
  }
  return removed;
};

export const executeGlobalHandlers = async (
  req: FastifyRequest,
  reply: FastifyReply,
  method: HttpMethod,
  path: string
): Promise<boolean> => {
  const sortedHandlers = Array.from(globalHandlers.entries())
    .sort(([, a], [, b]) => (b.priority || 0) - (a.priority || 0));

  for (const [name, config] of sortedHandlers) {
    if (config.methods && !config.methods.includes(method)) {
      continue;
    }

    if (config.paths && !config.paths.includes('*')) {
      const shouldExecute = config.paths.some(pattern => {
        if (pattern === path) return true;
        if (pattern.endsWith('*')) {
          const prefix = pattern.slice(0, -1);
          return path.startsWith(prefix);
        }
        return false;
      });
      if (!shouldExecute) continue;
    }

    if (config.skipRoutes && config.skipRoutes.some(skip =>
      skip === path || (skip.endsWith('*') && path.startsWith(skip.slice(0, -1)))
    )) {
      continue;
    }

    try {
      const result = await config.handler(req, reply);

      if (result === false) {
        return false;
      }

      if (reply.sent) {
        return false;
      }
    } catch (error) {
      console.error(`Global handler '${name}' error:`, error);
      if (!reply.sent) {
        reply.status(500).send(createErrorResponse('Internal server error'));
      }
      return false;
    }
  }

  return true;
};