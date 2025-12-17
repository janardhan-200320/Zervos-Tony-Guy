import fs from 'fs';
import path from 'path';
import type { NextFunction, Request, Response } from 'express';
import { FileEncryption } from '../encryption';
import { logger } from '../logger';
import express from 'express';

export function uploadsMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const filePath = path.join(process.cwd(), 'uploads', req.path.slice(1));

    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
    } catch {
      return next();
    }

    if (await FileEncryption.isFileEncrypted(filePath)) {
      try {
        res.type(filePath);
        await FileEncryption.decryptFileToStream(filePath, res);
      } catch (error) {
        logger.error('File streaming decrypt failed:', { error, filePath });
        return res.status(500).send('Error decrypting file');
      }
    } else {
      return express.static('uploads')(req, res, next);
    }
  };
}
