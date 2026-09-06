import app from '../../server/app';
import type { Env } from '../../server/types';

export const onRequest: PagesFunction<Env> = (context) => {
  return app.fetch(context.request, context.env, context as unknown as ExecutionContext);
};
