const request = require('supertest');
const express = require('express');

// Mock auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => {
  if (req.headers.authorization === 'Bearer valid-token') {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    return next();
  }
  return res.status(401).json({ error: 'No autorizado' });
});

// Mock deepseekService a nivel de módulo para evitar inicialización con API key ausente
jest.mock('../services/deepseekService', () => ({
  generateChatResponse: jest.fn().mockResolvedValue('Mocked AI response'),
  generarPreguntasEntrevista: jest.fn(),
  extraerDatosInfografia: jest.fn(),
  extraerDatosLinkedin: jest.fn(),
  analizarLinkedin: jest.fn(),
  corregirProyectoLaboral: jest.fn(),
  extractProfileFromCV: jest.fn(),
  optimizarResumen: jest.fn(),
  fusionarResumen: jest.fn(),
  optimizarDescripcionExp: jest.fn(),
  generarCarta: jest.fn(),
  evaluarEntrevista: jest.fn(),
  optimizeCV: jest.fn(),
  matchCVtoJob: jest.fn(),
}));

const chatRoutes = require('../routes/chat');

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
