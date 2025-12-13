import jwt from 'jsonwebtoken';

export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export function signAccessToken(params: {
  userId: string;
  email: string;
  secret: string;
  expiresInSeconds: number;
}): string {
  const payload: AccessTokenPayload = { sub: params.userId, email: params.email };
  return jwt.sign(payload, params.secret, {
    algorithm: 'HS256',
    expiresIn: params.expiresInSeconds
  });
}

export function verifyAccessToken(token: string, secret: string): AccessTokenPayload {
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  if (typeof decoded !== 'object' || decoded == null) {
    throw new Error('Invalid token payload');
  }
  const sub = (decoded as any).sub;
  const email = (decoded as any).email;
  if (typeof sub !== 'string' || typeof email !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { sub, email };
}
