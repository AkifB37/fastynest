import { FastifyReply, FastifyRequest } from 'fastify';
import { FileUploadConfig, UploadedFile } from './types';
import { createErrorResponse } from './utils';

export const processFileUploads = async (
  req: FastifyRequest,
  reply: FastifyReply,
  config: FileUploadConfig
): Promise<boolean> => {
  try {
    if (!req.isMultipart()) {
      reply.status(400).send(createErrorResponse('Request must be multipart/form-data'));
      return false;
    }

    if (config.single) {
      const file = await req.file();
      if (!file) {
        reply.status(400).send(createErrorResponse(`File field '${config.single}' is required`));
        return false;
      }

      if (config.maxFileSize && file.file.truncated) {
        reply.status(413).send(createErrorResponse(`File size exceeds limit of ${config.maxFileSize} bytes`));
        return false;
      }

      if (config.allowedMimeTypes && !config.allowedMimeTypes.includes(file.mimetype)) {
        reply.status(400).send(createErrorResponse(
          `File type ${file.mimetype} not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`
        ));
        return false;
      }

      const buffer = await file.toBuffer();
      const uploadedFile: UploadedFile = {
        filename: file.filename,
        encoding: file.encoding,
        mimetype: file.mimetype,
        buffer,
        size: buffer.length
      };

      (req as any).file = uploadedFile;
      (req as any).body = file.fields;

    } else if (config.multiple) {
      const files: UploadedFile[] = [];
      const parts = req.parts();
      let fileCount = 0;
      const fields: any = {};

      for await (const part of parts) {
        if (part.type === 'file') {
          fileCount++;

          if (config.maxFiles && fileCount > config.maxFiles) {
            reply.status(400).send(createErrorResponse(`Maximum ${config.maxFiles} files allowed`));
            return false;
          }

          if (config.allowedMimeTypes && !config.allowedMimeTypes.includes(part.mimetype)) {
            reply.status(400).send(createErrorResponse(
              `File type ${part.mimetype} not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`
            ));
            return false;
          }

          const buffer = await part.toBuffer();

          if (config.maxFileSize && buffer.length > config.maxFileSize) {
            reply.status(413).send(createErrorResponse(`File size exceeds limit of ${config.maxFileSize} bytes`));
            return false;
          }

          const uploadedFile: UploadedFile = {
            filename: part.filename,
            encoding: part.encoding,
            mimetype: part.mimetype,
            buffer,
            size: buffer.length
          };

          files.push(uploadedFile);
        } else {
          fields[part.fieldname] = part.value;
        }
      }

      (req as any).files = files;
      (req as any).body = fields;
    }

    return true;
  } catch (error) {
    console.error('File upload error:', error);
    reply.status(500).send(createErrorResponse('File upload processing failed'));
    return false;
  }
};
