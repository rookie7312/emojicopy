import { z } from 'zod';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  emojis: {
    list: {
      method: 'GET' as const,
      path: '/api/emojis' as const,
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
      }).optional(),
      responses: { 200: z.array(z.any()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/emojis/:slug' as const,
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    copy: {
      method: 'POST' as const,
      path: '/api/emojis/:id/copy' as const,
      responses: { 200: z.object({ copyCount: z.number() }) },
    },
    categories: {
      method: 'GET' as const,
      path: '/api/emojis/categories' as const,
      responses: { 200: z.array(z.string()) },
    },
    trending: {
      method: 'GET' as const,
      path: '/api/emojis/trending' as const,
      responses: { 200: z.array(z.any()) },
    },
  },
  pages: {
    list: {
      method: 'GET' as const,
      path: '/api/pages' as const,
      responses: { 200: z.array(z.any()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/pages/:slug' as const,
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/pages/generate' as const,
      input: z.object({ keyword: z.string() }),
      responses: { 201: z.any(), 400: errorSchemas.validation },
    },
    generateBatch: {
      method: 'POST' as const,
      path: '/api/pages/generate-batch' as const,
      input: z.object({ count: z.number().optional() }),
      responses: { 200: z.object({ generated: z.number() }) },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
