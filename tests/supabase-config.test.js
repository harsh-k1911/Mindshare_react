import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSupabaseConfig } from '../src/lib/supabase/config.js';
const url = 'https://example.supabase.co';
const publishableKey = 'sb_publishable_example_public_key';
const legacyKey = role => `header.${Buffer.from(JSON.stringify({role})).toString('base64url')}.signature`;

test('missing and partial configuration return actionable errors', () => {
  assert.equal(validateSupabaseConfig({}).status, 'missing');
  assert.equal(validateSupabaseConfig({url}).status, 'invalid');
  assert.equal(validateSupabaseConfig({publishableKey}).status, 'invalid');
});
test('normalizes the project URL and accepts a public key', () => {
  assert.deepEqual(validateSupabaseConfig({url: `${url}/`, publishableKey}), {status:'ready', url, publishableKey});
});
test('rejects dashboard URLs, insecure URLs, and embedded credentials', () => {
  for (const badUrl of ['not a URL', 'http://example.supabase.co', 'https://supabase.com/dashboard/project/example', 'https://user:password@example.supabase.co', `${url}?token=secret`, `${url}#auth`]) {
    assert.equal(validateSupabaseConfig({url:badUrl,publishableKey}).status, 'invalid');
  }
});
test('rejects secret, service-role, malformed, and incomplete keys', () => {
  for (const key of ['sb_secret_private', legacyKey('service_role'), 'invalid', 'sb_publishable_']) {
    const result = validateSupabaseConfig({url,publishableKey:key});
    assert.equal(result.status, 'invalid');
    assert.ok(!result.message.includes(key));
  }
});
test('accepts legacy anon keys without treating client validation as authorization', () => {
  assert.equal(validateSupabaseConfig({url,publishableKey:legacyKey('anon')}).status,'ready');
});
