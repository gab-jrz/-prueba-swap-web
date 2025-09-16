import * as chai from 'chai';
import sinon from 'sinon';

export const expect = chai.expect;
export const sandbox = sinon.createSandbox();

afterEach(() => {
  sandbox.restore();
});