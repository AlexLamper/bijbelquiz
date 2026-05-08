import assert from 'node:assert/strict';
import test from 'node:test';
import { isGoogleAudienceValid } from '@/lib/auth/google-id-token';

const allowedAudiences = [
  '1036826851129-kqmervpgfkkjndr4egbrdm1l2gac94to.apps.googleusercontent.com', // iOS
  '1036826851129-ptdjlk6vc9id1s4pkl7gks9k2bghb57i.apps.googleusercontent.com', // Android
  '1036826851129-29bsvr0f17j6bj4g9hsrhhbotsasp4tu.apps.googleusercontent.com', // Web
];

test('accepts token payload with iOS audience', () => {
  const isValid = isGoogleAudienceValid(
    '1036826851129-kqmervpgfkkjndr4egbrdm1l2gac94to.apps.googleusercontent.com',
    allowedAudiences,
  );
  assert.equal(isValid, true);
});

test('rejects token payload with unknown audience', () => {
  const isValid = isGoogleAudienceValid(
    'unknown-client-id.apps.googleusercontent.com',
    allowedAudiences,
  );
  assert.equal(isValid, false);
});
