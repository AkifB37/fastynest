import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodSchema, ZodType } from 'zod';

declare module 'fastify' {
  interface FastifyRequest {
    isMultipart(): boolean;
    file(): Promise<any>;
    parts(): AsyncIterableIterator<any>;
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type RouteHandler = (req: FastifyRequest, reply: FastifyReply) => Promise<any> | any;
export type GuardFunction = (req: FastifyRequest, reply: FastifyReply) => Promise<boolean> | boolean;

export type FileUploadConfig = {
  single?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
};

export type UploadedFile = {
  filename: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

export interface RouteMetadata {
  method: HttpMethod;
  path: string;
  handler: string;
  bodySchema?: ZodSchema;
  querySchema?: ZodSchema;
  paramsSchema?: ZodSchema;
  guards: GuardFunction[];
  headers: { [key: string]: string | number };
  fileUpload?: FileUploadConfig;
}

export type GlobalHandlerFunction = (req: FastifyRequest, reply: FastifyReply) => Promise<boolean | void> | boolean | void;
export type GlobalHandlerConfig = {
  handler: GlobalHandlerFunction;
  methods?: HttpMethod[];
  paths?: string[];
  skipRoutes?: string[];
  priority?: number;
};

export type ControllerConfig = {
  controller: any;
  prefix?: string;
};

export type ParameterMetadata = {
  type: 'body' | 'query' | 'params' | 'request' | 'response' | 'next' | 'ip';
  index: number;
  schema?: any;
};