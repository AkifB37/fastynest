import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodType } from 'zod';
import { createErrorResponse } from './utils';

export const validateRequest = async (
  req: FastifyRequest,
  reply: FastifyReply,
  schemas: { body?: ZodType<any>; query?: ZodType<any>; params?: ZodType<any> }
) => {
  try {
    if (schemas.body && req.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        reply.status(400).send(createErrorResponse(
          'Body validation failed',
          result.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        ));
        return false;
      }
      req.body = result.data;
    }

    if (schemas.query && req.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        reply.status(400).send(createErrorResponse(
          'Query validation failed',
          result.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        ));
        return false;
      }
      req.query = result.data;
    }

    if (schemas.params && req.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        reply.status(400).send(createErrorResponse(
          'Params validation failed',
          result.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        ));
        return false;
      }
      req.params = result.data;
    }

    return true;
  } catch (error) {
    reply.status(500).send(createErrorResponse('Internal validation error'));
    return false;
  }
};
