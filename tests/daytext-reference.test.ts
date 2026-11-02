import test from 'node:test';
import assert from 'node:assert/strict';

import { dutchReference, dutchReferenceString } from '@/lib/daytext-reference';

test('the day text reference is shown with the Dutch book name', () => {
  assert.equal(dutchReference({ book: 'Proverbs', chapter: '30', verse: '5', verseEnd: '5' }), 'Spreuken 30:5');
  assert.equal(dutchReferenceString('Psalms 23:1-3'), 'Psalm 23:1-3');
  assert.equal(dutchReferenceString('1 Corinthians 13:4'), '1 Korintiërs 13:4');
  assert.equal(dutchReferenceString('Revelation 21:4'), 'Openbaring 21:4');
  // Already Dutch, or unknown: left alone.
  assert.equal(dutchReferenceString('Spreuken 3:5'), 'Spreuken 3:5');
  assert.equal(dutchReferenceString('Dagtekst'), 'Dagtekst');
});
