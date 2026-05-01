const upstreamUrl = 'http://etecapi.atwebpages.com/api/classes';

export const config = {
  api: {
    bodyParser: false,
  },
};

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', reject);
  });
}

function buildUpstreamHeaders(req) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) {
      continue;
    }

    const lowerKey = key.toLowerCase();

    if (['host', 'connection', 'content-length', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-port', 'x-forwarded-proto'].includes(lowerKey)) {
      continue;
    }

    if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
      continue;
    }

    headers.set(key, value);
  }

  return headers;
}

export default async function handler(req, res) {
  const headers = buildUpstreamHeaders(req);
  const method = req.method || 'GET';
  const hasBody = !['GET', 'HEAD'].includes(method);

  try {
    const body = hasBody ? await readRequestBody(req) : undefined;
    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers,
      body: hasBody && body.length > 0 ? body : undefined,
      redirect: 'manual',
    });

    res.status(upstreamResponse.status);

    upstreamResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'transfer-encoding') {
        return;
      }

      res.setHeader(key, value);
    });

    const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
    res.send(responseBuffer);
  } catch (error) {
    res.status(502).json({
      message: 'Proxy request failed.',
      details: error instanceof Error ? error.message : 'Unknown error',
      targetUrl: upstreamUrl,
    });
  }
}
