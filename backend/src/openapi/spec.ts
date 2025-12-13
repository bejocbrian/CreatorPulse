import type { OpenAPIObject } from 'openapi-types';

export function buildOpenApiSpec(params: { title: string; version: string }): OpenAPIObject {
  return {
    openapi: '3.0.3',
    info: {
      title: params.title,
      version: params.version
    },
    paths: {
      '/auth/signup': {
        post: {
          summary: 'Create a user account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    name: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Created',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            }
          }
        }
      },
      '/auth/login': {
        post: {
          summary: 'Login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'OK' }
          }
        }
      },
      '/auth/logout': {
        post: {
          summary: 'Logout (revoke refresh token)',
          responses: {
            '204': { description: 'No Content' }
          }
        }
      },
      '/auth/refresh': {
        post: {
          summary: 'Rotate refresh token and return new access token',
          responses: {
            '200': { description: 'OK' },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/auth/verify-email': {
        post: {
          summary: 'Verify email address',
          parameters: [
            {
              name: 'token',
              in: 'query',
              required: false,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '204': { description: 'No Content' }
          }
        }
      },
      '/auth/request-password-reset': {
        post: {
          summary: 'Request password reset',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: { email: { type: 'string', format: 'email' } }
                }
              }
            }
          },
          responses: {
            '200': { description: 'OK' }
          }
        }
      },
      '/auth/reset-password': {
        post: {
          summary: 'Reset password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'newPassword'],
                  properties: {
                    token: { type: 'string' },
                    newPassword: { type: 'string', minLength: 8 }
                  }
                }
              }
            }
          },
          responses: {
            '204': { description: 'No Content' }
          }
        }
      }
    }
  };
}
