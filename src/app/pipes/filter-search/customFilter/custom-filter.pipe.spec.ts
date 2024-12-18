import { CustomFilterPipe } from './costum-filter.pipe';

describe('CostumFilterPipe', () => {
  it('create an instance', () => {
    const pipe = new CustomFilterPipe();
    expect(pipe).toBeTruthy();
  });
});
