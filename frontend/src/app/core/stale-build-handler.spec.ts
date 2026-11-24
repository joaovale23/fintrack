import { isStaleChunkError } from './stale-build-handler';

describe('isStaleChunkError', () => {
  it('reconhece o erro de pedaço que sumiu depois de um deploy (Chrome, Safari e Firefox)', () => {
    expect(
      isStaleChunkError(
        new TypeError('Failed to fetch dynamically imported module: https://x/chunk-abc.js'),
      ),
    ).toBe(true);
    expect(isStaleChunkError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isStaleChunkError(new TypeError('error loading dynamically imported module'))).toBe(
      true,
    );
  });

  it('não confunde com outros erros', () => {
    expect(isStaleChunkError(new Error('Http failure response'))).toBe(false);
    expect(isStaleChunkError(null)).toBe(false);
  });
});
