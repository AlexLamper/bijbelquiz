import { NextRequest, NextResponse } from 'next/server';

interface AppleCallbackPayload {
  code?: string;
  idToken?: string;
  state?: string;
  user?: string;
  error?: string;
}

const APPLE_DEEP_LINK_CALLBACK = 'signinwithapple://callback';

function toOptionalString(value: string | null) {
  return value === null ? undefined : value;
}

function parsePayload(searchParams: URLSearchParams): AppleCallbackPayload {
  return {
    code: toOptionalString(searchParams.get('code')),
    idToken: toOptionalString(searchParams.get('id_token')),
    state: toOptionalString(searchParams.get('state')),
    user: toOptionalString(searchParams.get('user')),
    error: toOptionalString(searchParams.get('error')),
  };
}

function pickValue(primary?: string, secondary?: string) {
  return primary ?? secondary;
}

function mergePayload(primary: AppleCallbackPayload, secondary: AppleCallbackPayload): AppleCallbackPayload {
  return {
    code: pickValue(primary.code, secondary.code),
    idToken: pickValue(primary.idToken, secondary.idToken),
    state: pickValue(primary.state, secondary.state),
    user: pickValue(primary.user, secondary.user),
    error: pickValue(primary.error, secondary.error),
  };
}

function buildDeepLink(payload: AppleCallbackPayload) {
  const params = new URLSearchParams();

  if (payload.error) {
    params.set('error', payload.error);
    if (payload.state !== undefined) {
      params.set('state', payload.state);
    }
  } else {
    if (payload.code !== undefined) {
      params.set('code', payload.code);
    }
    if (payload.idToken !== undefined) {
      params.set('id_token', payload.idToken);
    }
    if (payload.state !== undefined) {
      params.set('state', payload.state);
    }
    if (payload.user !== undefined) {
      params.set('user', payload.user);
    }
  }

  const query = params.toString();
  return query ? `${APPLE_DEEP_LINK_CALLBACK}?${query}` : APPLE_DEEP_LINK_CALLBACK;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildRedirectResponse(deepLink: string) {
  const escapedDeepLink = escapeHtml(deepLink);
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Returning to app</title>
  </head>
  <body>
    <script>
      window.location.href = ${JSON.stringify(deepLink)};
    </script>
    <p>You can close this window and return to the app.</p>
    <p><a href="${escapedDeepLink}">Open the app</a></p>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 303,
    headers: {
      Location: deepLink,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

async function parsePostPayload(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/x-www-form-urlencoded')) {
    return {};
  }

  const body = await req.text();
  const bodyParams = new URLSearchParams(body);
  return parsePayload(bodyParams);
}

function getPayloadFromRequest(req: NextRequest, postPayload?: AppleCallbackPayload) {
  const queryPayload = parsePayload(new URL(req.url).searchParams);
  if (!postPayload) {
    return queryPayload;
  }
  return mergePayload(postPayload, queryPayload);
}

function resolveRedirectPayload(payload: AppleCallbackPayload): AppleCallbackPayload {
  if (payload.error) {
    return {
      error: payload.error,
      state: payload.state,
    };
  }

  if (payload.code || payload.idToken) {
    return payload;
  }

  return {
    error: 'invalid_callback_payload',
    state: payload.state,
  };
}

export async function GET(req: NextRequest) {
  const incomingPayload = getPayloadFromRequest(req);
  const redirectPayload = resolveRedirectPayload(incomingPayload);
  const deepLink = buildDeepLink(redirectPayload);
  return buildRedirectResponse(deepLink);
}

export async function POST(req: NextRequest) {
  const postPayload = await parsePostPayload(req);
  const incomingPayload = getPayloadFromRequest(req, postPayload);
  const redirectPayload = resolveRedirectPayload(incomingPayload);
  const deepLink = buildDeepLink(redirectPayload);
  return buildRedirectResponse(deepLink);
}
