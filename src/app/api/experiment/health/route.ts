/**
 * Next.js API Route — 健康检查代理
 *
 * 将健康检查请求转发到后端, 避免跨域问题。
 * 生产环境 (output: 'export') 不会打包此路由。
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  try {
    const backendResponse = await fetch('http://localhost:8080/api/experiment/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    const text = await backendResponse.text();
    return new Response(text, {
      status: backendResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response('{"status":"unavailable"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
