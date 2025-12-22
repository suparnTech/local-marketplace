import { NextFunction, Request, Response } from 'express';

const cache = new Map<string, { data: any; expires: number }>();

export const cacheMiddleware = (durationSeconds: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = req.originalUrl || req.url;
        const cached = cache.get(key);

        if (cached && cached.expires > Date.now()) {
            return res.json(cached.data);
        }

        // Override res.json to store the result in cache
        const originalJson = res.json;
        res.json = function (data) {
            cache.set(key, {
                data,
                expires: Date.now() + durationSeconds * 1000
            });
            return originalJson.call(this, data);
        };

        next();
    };
};
