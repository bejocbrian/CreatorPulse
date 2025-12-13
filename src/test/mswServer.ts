import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const token = 'test-token';

export const handlers = [
  http.post('/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (body.email === 'user@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        token,
        user: { id: 'u1', email: body.email, name: 'Test User', role: 'user' },
      });
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  http.post('/auth/signup', async ({ request }) => {
    const body = (await request.json()) as { email?: string; name?: string };
    return HttpResponse.json({
      token,
      user: { id: 'u1', email: body.email ?? 'new@example.com', name: body.name ?? 'New', role: 'user' },
    });
  }),

  http.get('/auth/me', ({ request }) => {
    const auth = request.headers.get('authorization');
    if (auth === `Bearer ${token}`) {
      return HttpResponse.json({ id: 'u1', email: 'user@example.com', name: 'Test User', role: 'user' });
    }
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }),
];

export const server = setupServer(...handlers);
