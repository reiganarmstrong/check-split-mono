const assert = require('node:assert/strict')
const { beforeEach, afterEach, test, mock } = require('node:test')
const { SSMClient } = require('@aws-sdk/client-ssm')
const { receiptDraftResponseJsonSchema } = require('../dist/schema')
const { IMAGE_PROMPT, SYSTEM_PROMPT } = require('../dist/prompts')

let handler, fetchMock, secretMock
const originalEnv = { ...process.env }

function draft(overrides = {}) {
  return {
    createReceiptInputDraft: {
      allocationPolicy: 'EVEN', capturedAt: null, currencyCode: 'USD',
      discountCents: null, feeCents: null, locationAddress: null,
      locationLat: null, locationLng: null, locationName: null,
      merchantName: 'Receipt Shop', receiptOccurredAt: null,
      subtotalCents: 2000, taxCents: 160, tipCents: null, totalCents: 2160,
    },
    upsertReceiptItemInputDrafts: [{
      category: null, description: 'Lunch', discountCents: 0,
      lineSubtotalCents: 2000, quantity: 2, scanConfidence: 0.99,
      sourceLineNumber: 1, unitPriceCents: 1000,
    }],
    issues: [], needsReview: false, ...overrides,
  }
}

function completed(value = draft()) {
  return {
    status: 'completed',
    output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }],
    usage: { input_tokens: 100, output_tokens: 80,
      input_tokens_details: { cached_tokens: 20 }, output_tokens_details: { reasoning_tokens: 10 } },
  }
}

function event(overrides = {}) {
  return {
    body: Buffer.from('receipt image').toString('base64'), isBase64Encoded: true,
    headers: { 'content-type': 'image/jpeg', origin: 'https://app.example.com' },
    requestContext: { authorizer: { jwt: { claims: { sub: 'user', token_use: 'access' } } } },
    ...overrides,
  }
}

beforeEach(() => {
  process.env = { ...originalEnv, OPENAI_API_KEY_PARAMETER_NAME: '/test/openai/api-key',
    RECEIPT_PARSE_ALLOWED_ORIGINS: '["https://app.example.com"]' }
  delete process.env.OPENAI_MODEL_ID
  delete process.env.MAX_UPLOAD_BYTES
  secretMock = mock.method(SSMClient.prototype, 'send', async () => ({ Parameter: { Value: 'test-key' } }))
  fetchMock = mock.method(globalThis, 'fetch', async () => Response.json(completed()))
  mock.method(console, 'error', () => {})
  delete require.cache[require.resolve('../dist/index')]
  handler = require('../dist/index').handler
})
afterEach(() => { process.env = originalEnv; mock.restoreAll(); mock.timers.reset() })

test('extracts a draft using Luna with strict receipt output and an SSM secret', async () => {
  const result = await handler(event())
  assert.equal(result.statusCode, 200)
  const payload = JSON.parse(result.body)
  assert.deepEqual(payload, { ...draft(), parser: {
    modelId: 'gpt-6-luna', provider: 'openai-responses-api', inputTokens: 100, outputTokens: 80,
  } })
  assert.equal(result.headers['access-control-allow-origin'], 'https://app.example.com')
  assert.deepEqual(secretMock.mock.calls[0].arguments[0].input,
    { Name: '/test/openai/api-key', WithDecryption: true })
  const [url, request] = fetchMock.mock.calls[0].arguments
  assert.equal(url, 'https://api.openai.com/v1/responses')
  assert.equal(request.method, 'POST')
  assert.equal(request.headers.authorization, 'Bearer test-key')
  assert.deepEqual(JSON.parse(request.body), {
    model: 'gpt-6-luna', store: false, service_tier: 'default', reasoning: { effort: 'none' },
    max_output_tokens: 8192, instructions: SYSTEM_PROMPT,
    input: [{ role: 'user', content: [{ type: 'input_text', text: IMAGE_PROMPT },
      { type: 'input_image', image_url: `data:image/jpeg;base64,${event().body}`, detail: 'high' }] }],
    text: { format: { type: 'json_schema', name: 'receipt_draft', strict: true, schema: receiptDraftResponseJsonSchema } },
  })
  await handler(event())
  assert.equal(secretMock.mock.callCount(), 1, 'reuse decrypted secret on warm invocations')
})

test('supports PNG uploads and explicit model configuration', async () => {
  process.env.OPENAI_MODEL_ID = 'configured-luna-model'
  const result = await handler(event({ body: 'png bytes', isBase64Encoded: false,
    headers: { 'Content-Type': 'image/png; charset=binary' } }))
  assert.equal(result.statusCode, 200)
  const request = JSON.parse(fetchMock.mock.calls[0].arguments[1].body)
  assert.equal(request.model, 'configured-luna-model')
  assert.equal(request.input[0].content[1].image_url, `data:image/png;base64,${Buffer.from('png bytes').toString('base64')}`)
})

test('keeps review normalization for issues and low-confidence items', async () => {
  for (const value of [draft({ issues: ['Check printed total.'] }),
    draft({ upsertReceiptItemInputDrafts: [{ ...draft().upsertReceiptItemInputDrafts[0], scanConfidence: 0.7 }] })]) {
    fetchMock.mock.mockImplementation(async () => Response.json(completed(value)))
    const result = await handler(event())
    assert.equal(result.statusCode, 200)
    assert.equal(JSON.parse(result.body).needsReview, true)
  }
})

test('reads message text after reasoning output without double-counting output tokens', async () => {
  const response = completed()
  response.output.unshift({ type: 'reasoning', summary: [] })
  fetchMock.mock.mockImplementation(async () => Response.json(response))
  const result = await handler(event())
  assert.equal(result.statusCode, 200)
  assert.equal(JSON.parse(result.body).parser.outputTokens, 80)
})

for (const status of ['incomplete', 'failed', 'cancelled', 'in_progress']) {
  test(`rejects ${status} responses even when partial text looks valid`, async () => {
    fetchMock.mock.mockImplementation(async () => Response.json({ ...completed(), status }))
    assert.equal((await handler(event())).statusCode, 502)
  })
}

test('rejects refusal output without returning or logging provider text', async () => {
  const response = completed()
  response.output[0].content.push({ type: 'refusal', refusal: 'private provider details' })
  fetchMock.mock.mockImplementation(async () => Response.json(response))
  const result = await handler(event())
  assert.equal(result.statusCode, 502)
  assert.equal(result.body.includes('private provider details'), false)
  assert.equal(JSON.stringify(console.error.mock.calls).includes('private provider details'), false)
})

for (const value of [null, {}, { status: 'completed', output: [] },
  { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'invalid private json' }] }] },
  completed({ ...draft(), needsReview: 'no' })]) {
  test(`rejects malformed provider output: ${JSON.stringify(value).slice(0, 60)}`, async () => {
    fetchMock.mock.mockImplementation(async () => Response.json(value))
    const result = await handler(event())
    assert.equal(result.statusCode, 502)
    assert.equal(JSON.stringify(console.error.mock.calls).includes('invalid private json'), false)
  })
}

test('returns 422 for an empty draft without an explanation', async () => {
  const value = draft({ upsertReceiptItemInputDrafts: [] })
  Object.keys(value.createReceiptInputDraft).forEach(key => {
    if (key !== 'allocationPolicy') value.createReceiptInputDraft[key] = null
  })
  fetchMock.mock.mockImplementation(async () => Response.json(completed(value)))
  assert.equal((await handler(event())).statusCode, 422)
})

for (const status of [401, 429, 500]) {
  test(`returns 502 on provider HTTP ${status} without retries or upstream body`, async () => {
    fetchMock.mock.mockImplementation(async () => new Response('private upstream details', { status }))
    const result = await handler(event())
    assert.equal(result.statusCode, 502)
    assert.equal(result.body.includes('private upstream details'), false)
    assert.equal(fetchMock.mock.callCount(), 1)
  })
}

test('aborts the provider request after 20 seconds and returns 504', async () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  fetchMock.mock.mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
  }))
  const pending = handler(event())
  // Allow the SSM promise to resolve and the request deadline to start.
  await new Promise(resolve => setImmediate(resolve))
  mock.timers.tick(20000)
  const result = await pending
  assert.equal(result.statusCode, 504)
  assert.equal(JSON.parse(result.body).message, 'OpenAI request timed out.')
})

for (const [name, overrides, expected] of [
  ['ID token', { requestContext: { authorizer: { jwt: { claims: { sub: 'user', token_use: 'id' } } } } }, 401],
  ['unsupported MIME', { headers: { 'content-type': 'application/pdf' } }, 415],
  ['missing body', { body: null }, 400],
  ['oversized body', { body: Buffer.alloc(4194305).toString('base64') }, 413],
]) {
  test(`rejects ${name} before any external call`, async () => {
    assert.equal((await handler(event(overrides))).statusCode, expected)
    assert.equal(fetchMock.mock.callCount(), 0)
    assert.equal(secretMock.mock.callCount(), 0)
  })
}

test('requires the OpenAI parameter setting without falling back to Gemini credentials', async () => {
  delete process.env.OPENAI_API_KEY_PARAMETER_NAME
  process.env.GEMINI_API_KEY_PARAMETER_NAME = '/legacy/gemini/api-key'
  const result = await handler(event())
  assert.equal(result.statusCode, 502)
  assert.equal(secretMock.mock.callCount(), 0)
  assert.equal(fetchMock.mock.callCount(), 0)
})

test('does not call OpenAI if SSM cannot retrieve the key', async () => {
  secretMock.mock.mockImplementation(async () => { throw new Error('ParameterNotFound') })
  const result = await handler(event())
  assert.equal(result.statusCode, 502)
  assert.equal(fetchMock.mock.callCount(), 0)
})
