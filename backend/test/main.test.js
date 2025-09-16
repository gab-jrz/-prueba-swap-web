import request from 'supertest';
import app from '../src/index.js';
import { expect } from './helpers/testHelper.js';

describe('Health endpoint', () => {
  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).to.have.property('status', 'ok');
  });
});