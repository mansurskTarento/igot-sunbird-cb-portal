import { NumberShortenerPipe } from './number-shortener.pipe';

describe('NumberShortenerPipe', () => {
  it('create an instance', () => {
    const pipe = new NumberShortenerPipe();
    expect(pipe).toBeTruthy();
  });
});
