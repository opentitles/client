import { JSDOM } from 'jsdom';
import { getIdForMedium } from '../../src/util/getIdForMedium';
import { mediumWithIdInUrl, mediumWithIdInVar } from '../fixtures/objects/TestMedia';


describe('getIdForMedium', () => {
  describe('with id in url', () => {
    beforeEach((done) => {
      JSDOM.fromFile('test/fixtures/pages/article.html', {
        url: `https://${mediumWithIdInUrl.match_domains[0]}/articles/1234567`,
        pretendToBeVisual: true,
        resources: 'usable'
      }).then(dom => {
        global.document = dom.window.document
        global.window = dom.window as unknown as (Window & typeof globalThis)
      }).then(() => {
        done();
      });
    });

    it('should find the right id', async () => {
      const id = await getIdForMedium(mediumWithIdInUrl);
      expect(id).toEqual('1234567');
    });
  });

  describe('with id in var', () => {
    beforeEach((done) => {
      JSDOM.fromFile('test/fixtures/pages/article.html', {
        url: `https://${mediumWithIdInVar.match_domains[0]}/articles/some-url-that-might-change`,
        pretendToBeVisual: true,
        resources: 'usable',
        runScripts: 'dangerously'
      }).then(dom => {
        // Inject article ID
        dom.window.analytics = {
          meta: {
            articleid: '1234567'
          }
        };

        global.document = dom.window.document
        global.window = dom.window as unknown as (Window & typeof globalThis)
      }).then(() => {
        done();
      });
    });

    it('should find the right id', async () => {
      const id = await getIdForMedium(mediumWithIdInVar);
      expect(id).toEqual('1234567');
    });
  });
});