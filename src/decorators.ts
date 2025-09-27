import { z } from 'zod';
import {
  addClassGuardMetadata,
  addClassHeaderMetadata,
  addFileUploadMetadata,
  addGuardMetadata,
  addHeaderMetadata,
  addParameterMetadata,
  addRouteMetadata,
  addValidationMetadata
} from './metadata';
import { FileUploadConfig, GuardFunction } from './types';

export const Get = (path: string = '/') => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    addRouteMetadata(target.constructor, 'GET', path, propertyKey);
  };
};

export const Post = (path: string = '/') => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    addRouteMetadata(target.constructor, 'POST', path, propertyKey);
  };
};

export const Put = (path: string = '/') => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    addRouteMetadata(target.constructor, 'PUT', path, propertyKey);
  };
};

export const Delete = (path: string = '/') => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    addRouteMetadata(target.constructor, 'DELETE', path, propertyKey);
  };
};

export const Patch = (path: string = '/') => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    addRouteMetadata(target.constructor, 'PATCH', path, propertyKey);
  };
};

export const Body = (schema: z.ZodType<any>) => {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    addValidationMetadata(target.constructor, propertyKey, 'body', schema);
    addParameterMetadata(target.constructor, propertyKey, parameterIndex, 'body', schema);
  };
};

export const Query = (schema: z.ZodType<any>) => {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    addValidationMetadata(target.constructor, propertyKey, 'query', schema);
    addParameterMetadata(target.constructor, propertyKey, parameterIndex, 'query', schema);
  };
};

export const Params = (schema: z.ZodType<any>) => {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    addValidationMetadata(target.constructor, propertyKey, 'params', schema);
    addParameterMetadata(target.constructor, propertyKey, parameterIndex, 'params', schema);
  };
};

export const Request = () => {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    addParameterMetadata(target.constructor, propertyKey, parameterIndex, 'request');
  };
};

export const Response = () => {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    addParameterMetadata(target.constructor, propertyKey, parameterIndex, 'response');
  };
};

export const Next = () => {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    addParameterMetadata(target.constructor, propertyKey, parameterIndex, 'next');
  };
};

export const Ip = () => {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    addParameterMetadata(target.constructor, propertyKey, parameterIndex, 'ip');
  };
};

export const AuthGuard = (guardFn?: GuardFunction) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    const defaultGuard: GuardFunction = async (req, reply) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
      }
      return true;
    };

    const guard = guardFn || defaultGuard;

    if (propertyKey) {
      addGuardMetadata(target.constructor, propertyKey, guard);
    } else {
      addClassGuardMetadata(target, guard);
    }
  };
};

export const UseGuard = (guardFn: GuardFunction) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (propertyKey) {
      addGuardMetadata(target.constructor, propertyKey, guardFn);
    } else {
      addClassGuardMetadata(target, guardFn);
    }
  };
};

export const Header = (key: string, value: string | number) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (propertyKey) {
      addHeaderMetadata(target.constructor, propertyKey, key, value);
    } else {
      addClassHeaderMetadata(target, key, value);
    }
  };
};

export const Headers = (headers: { [key: string]: string | number }) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Object.entries(headers).forEach(([key, value]) => {
      if (propertyKey) {
        addHeaderMetadata(target.constructor, propertyKey, key, value);
      } else {
        addClassHeaderMetadata(target, key, value);
      }
    });
  };
};

export const FileUpload = (config: FileUploadConfig = {}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    addFileUploadMetadata(target.constructor, propertyKey, config);
  };
};

export const SingleFile = (
  fieldName: string = 'file',
  options: {
    maxFileSize?: number;
    allowedMimeTypes?: string[];
  } = {}
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    addFileUploadMetadata(target.constructor, propertyKey, {
      single: fieldName,
      maxFileSize: options.maxFileSize,
      allowedMimeTypes: options.allowedMimeTypes
    } as any);
  };
};

export const MultipleFiles = (
  options: {
    maxFiles?: number;
    maxFileSize?: number;
    allowedMimeTypes?: string[];
  } = {}
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    addFileUploadMetadata(target.constructor, propertyKey, {
      multiple: true,
      maxFiles: options.maxFiles || 10,
      maxFileSize: options.maxFileSize,
      allowedMimeTypes: options.allowedMimeTypes
    } as any);
  };
};
