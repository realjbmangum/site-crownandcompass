import { defineMiddleware } from 'astro:middleware';
import { blogTrailingSlashTarget } from './lib/blog-canonical';

export const onRequest = defineMiddleware((context, next) => {
  const target = blogTrailingSlashTarget(context.url.pathname, context.url.search);
  if (target) return context.redirect(target, 308);
  return next();
});
