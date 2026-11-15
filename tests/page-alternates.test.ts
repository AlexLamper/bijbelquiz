import test from 'node:test';
import assert from 'node:assert/strict';

test('NL: canonical only, no hreflang', async () => {
  delete process.env.SITE;
  delete process.env.NEXT_PUBLIC_SITE;
  const { pageAlternates } = await import('../src/config/routes');
  assert.deepEqual(pageAlternates('/hulp'), { canonical: '/hulp' });
});
