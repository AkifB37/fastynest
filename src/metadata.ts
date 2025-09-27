import { ZodType } from 'zod';
import { RouteMetadata, GuardFunction, HttpMethod, FileUploadConfig, ParameterMetadata } from './types';

export const routeMetadata = new Map<any, RouteMetadata[]>();
export const guardMetadata = new Map<any, GuardFunction[]>();
export const classHeaderMetadata = new Map<any, { [key: string]: string | number }>();
export const parameterMetadata = new Map<string, ParameterMetadata[]>();

export function addRouteMetadata(target: any, method: HttpMethod, path: string, handler: string) {
  if (!routeMetadata.has(target)) {
    routeMetadata.set(target, []);
  }
  const routes = routeMetadata.get(target)!;
  let route = routes.find(r => r.handler === handler);
  if (!route) {
    const newRoute: RouteMetadata = { method, path, handler, guards: [], headers: {} };
    routes.push(newRoute);
  } else {
    route.method = method;
    route.path = path;
  }
}

export function addValidationMetadata(target: any, handler: string, type: 'body' | 'query' | 'params', schema: ZodType<any>) {
  if (!routeMetadata.has(target)) {
    routeMetadata.set(target, []);
  }
  const routes = routeMetadata.get(target)!;
  let route = routes.find(r => r.handler === handler);
  if (!route) {
    const newRoute: RouteMetadata = { method: 'GET' as HttpMethod, path: '/', handler, guards: [], headers: {} };
    routes.push(newRoute);
    route = newRoute;
  }

  if (type === 'body') route.bodySchema = schema;
  if (type === 'query') route.querySchema = schema;
  if (type === 'params') route.paramsSchema = schema;
}

export function addGuardMetadata(target: any, handler: string, guard: GuardFunction) {
  if (!routeMetadata.has(target)) {
    routeMetadata.set(target, []);
  }
  const routes = routeMetadata.get(target)!;
  let route = routes.find(r => r.handler === handler);
  if (!route) {
    const newRoute: RouteMetadata = { method: 'GET' as HttpMethod, path: '/', handler, guards: [], headers: {} };
    routes.push(newRoute);
    route = newRoute;
  }
  route.guards.push(guard);
}

export function addClassGuardMetadata(target: any, guard: GuardFunction) {
  if (!guardMetadata.has(target)) {
    guardMetadata.set(target, []);
  }
  guardMetadata.get(target)!.push(guard);
}

export function addHeaderMetadata(target: any, handler: string, key: string, value: string | number) {
  if (!routeMetadata.has(target)) {
    routeMetadata.set(target, []);
  }
  const routes = routeMetadata.get(target)!;
  let route = routes.find(r => r.handler === handler);
  if (!route) {
    const newRoute: RouteMetadata = { method: 'GET' as HttpMethod, path: '/', handler, guards: [], headers: {} };
    routes.push(newRoute);
    route = newRoute;
  }
  route.headers[key] = value;
}

export function addClassHeaderMetadata(target: any, key: string, value: string | number) {
  if (!classHeaderMetadata.has(target)) {
    classHeaderMetadata.set(target, {});
  }
  classHeaderMetadata.get(target)![key] = value;
}

export function addFileUploadMetadata(target: any, handler: string, config: FileUploadConfig) {
  if (!routeMetadata.has(target)) {
    routeMetadata.set(target, []);
  }
  const routes = routeMetadata.get(target)!;
  let route = routes.find(r => r.handler === handler);
  if (!route) {
    const newRoute: RouteMetadata = { method: 'GET' as HttpMethod, path: '/', handler, guards: [], headers: {} };
    routes.push(newRoute);
    route = newRoute;
  }
  route.fileUpload = config;
}

export function addParameterMetadata(target: any, propertyKey: string, parameterIndex: number, type: ParameterMetadata['type'], schema?: any) {
  const key = `${target.name}.${propertyKey}`;
  if (!parameterMetadata.has(key)) {
    parameterMetadata.set(key, []);
  }
  const params = parameterMetadata.get(key)!;
  params.push({ type, index: parameterIndex, schema });
}