/**
 * Next.js API Route — SSE 流式代理 (使用 Node.js http 模块)
 *
 * Node.js 的 fetch API 会缓冲响应体, 导致 SSE 事件无法实时到达浏览器。
 * 本路由使用底层 http 模块直接建立到后端的连接, 并通过管道将每个 SSE 事件
 * 逐块写入响应, 确保前端能实时显示 ReAct 推理步骤。
 */

import http from 'node:http';

const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 8080;
const BACKEND_PATH = '/api/experiment/generate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
            'Accept': 'text/event-stream',
          },
        },
        (res) => {
          res.on('data', (chunk: Buffer) => {
            controller.enqueue(new Uint8Array(chunk));
          });
          res.on('end', () => {
            controller.close();
          });
          res.on('error', (err: Error) => {
            controller.error(err);
          });
        }
      );

      req.on('error', (err: Error) => {
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
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
