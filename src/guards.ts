import { FastifyRequest, FastifyReply } from 'fastify';
import { GuardFunction } from './types';
import { createErrorResponse } from './utils';

export const executeGuards = async (
  guards: GuardFunction[],
  req: FastifyRequest,
  reply: FastifyReply
): Promise<boolean> => {
  for (const guard of guards) {
    const result = await guard(req, reply);
    if (!result) {
      reply.status(403).send(createErrorResponse('Access denied'));
      return false;
    }
  }
  return true;
};

export const adminGuard: GuardFunction = async (req, reply) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.includes('admin')) {
    return false;
  }
  return true;
};