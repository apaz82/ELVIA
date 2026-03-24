const request = require('supertest');
const express = require('express');
const chatRoutes = require('../routes/chat');

// Mock req.user directly in the auth middleware for testing
jest.mock('../middleware/auth', () => (req, res, next) => {
  if (req.headers.authorization === 'Bearer valid-token') {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    return next();
  }
  return res.status(401).json({ error: 'No autorizado' });
});

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => {
    return {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ text: 'Mocked AI response' }]
        })
      }
    };
  });
});

const app = express();
app.use(express.json());
app.use('/api/chat', chatRoutes);

describe('POST /api/chat', () => {
  it('should return 401 if no valid token is provided', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hola' });
    expect(res.status).toBe(401);
  });

  it('should return 400 if message is missing', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer valid-token')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return a valid AI response when given a message', async () => {
    // This will initially fail because the controller logic isn't written yet
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', 'Bearer valid-token')
      .send({ message: 'Hola', history: [] });
    
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Mocked AI response');
  });
});
