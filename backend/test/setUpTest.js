import dotenv from 'dotenv';
import { connect, closeDatabase, clearDatabase } from './config/testDb.js';

process.env.NODE_ENV = 'test';
dotenv.config({ path: '.env.test' });

// Use Mocha Root Hooks (ESM) to avoid relying on global before/after symbols
export const mochaHooks = {
  async beforeAll() {
    await connect();
  },
  async afterAll() {
    await closeDatabase();
  },
  async beforeEach() {
    await clearDatabase();
  }
};