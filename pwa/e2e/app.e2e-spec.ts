import { Kng2CorePage } from './app.po';

describe('kng2-core App', () => {
  let page: Kng2CorePage;

  beforeEach(() => {
    page = new Kng2CorePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
