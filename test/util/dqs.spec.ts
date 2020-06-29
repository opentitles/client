import { JSDOM } from 'jsdom';
import { dqs } from '../../src/util/dqs';

describe('DQS (Document QuerySelector)', () => {
  beforeEach((done) => {
    JSDOM.fromFile('test/fixtures/pages/dqs.html').then(dom => {
      global.document = dom.window.document
      global.window = dom.window as unknown as (Window & typeof globalThis)
    }).then(() => {
      done();
    });
  });

  it('should find the first element by default', () => {
    const element = dqs('p.findme');
    expect(element.innerHTML).toEqual('First');
  });

  it('should throw an error with invalid queries', () => {
    expect(() => {
      // Very invalid selector
      dqs('[]');
    }).toThrowError('\'[]\' is not a valid selector');
  });

  it('should return null for queries with no results', () => {
    const element = dqs('p.findmo');
    expect(element).toBeNull();
  })
});