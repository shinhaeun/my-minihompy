import { Hono } from 'hono';
import type { Env } from './types';
import { sessionRoute } from './routes/session';
import { ownerRoute } from './routes/owner';
import { profileRoute } from './routes/profile';
import { guestbookRoute } from './routes/guestbook';
import { diaryRoute } from './routes/diary';
import { visitsRoute } from './routes/visits';
import { favoritesRoute } from './routes/favorites';

const app = new Hono<{ Bindings: Env }>();

app.route('/api/session', sessionRoute);
app.route('/api/owner', ownerRoute);
app.route('/api/profile', profileRoute);
app.route('/api/guestbook', guestbookRoute);
app.route('/api/diary', diaryRoute);
app.route('/api/visits', visitsRoute);
app.route('/api/favorites', favoritesRoute);

export default app;
