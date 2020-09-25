import { JSDOM } from 'jsdom';
import { getTitleElement } from '../../src/util/getTitleElement';
import { mediumWithIdInUrl, mediumWithInvalidTitleQuery, mediumWithoutTitle } from '../fixtures/objects/TestMedia';

describe('getTitleElement', () => {
  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
  })

  beforeEach((done) => {
    JSDOM.fromFile('test/fixtures/pages/article.html').then(dom => {
      global.document = dom.window.document
      global.window = dom.window as unknown as (Window & typeof globalThis)
    }).then(() => {
      done();
    });
  });

  it('should find the title with a valid selector', (done) => {
    getTitleElement(mediumWithIdInUrl).then((element) => {
      expect(element?.innerHTML).toEqual('This is a test title');
      done();
    });
  });

  // it('should throw invalid selectors', () => {
  //   setTimeout(() => {
  //     expect(() => {
  //       getTitleElement(mediumWithInvalidTitleQuery);
  //     }).toThrowError('\'[]\' is not a valid selector')
  //   }, 1000)
  // });

  it('should return null for selector with no results', async (done) => {
    setTimeout(() => {
      getTitleElement(mediumWithoutTitle).then((element) => {
        expect(element).toBeNull();
        done();
      });
    }, 3000);
  });
});