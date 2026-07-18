import http from 'node:http';

const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 8080;
const BACKEND_PATH = '/api/experiment/knowledge-map';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * SSE proxy for Agent 2 (Knowledge Mapping Agent).
 * Forwards the POST body to the Spring Boot backend and streams
 * SSE events back to the browser without buffering.
 */
export async function POST(request: Request): Promise<Response> {
  const body = await request.text();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const req = http.request(
        {
          hostname: BACKEND_HOST,
          port: BACKEND_PORT,
          path: BACKEND_PATH,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
        },
        (res) => {
          res.on('data', (chunk) => {
            controller.enqueue(new Uint8Array(chunk));
          });
          res.on('end', () => {
            controller.close();
          });
          res.on('error', (err) => {
            controller.error(err);
          });
        }
      );

      req.on('error', (err) => {
        controller.error(err);
      });

      req.write(body);
      req.end();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
