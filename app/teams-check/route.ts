// Open /teams-check on your site: if you see this text, the Teams update is live on the server.
export const dynamic = 'force-dynamic';
export function GET() { return new Response('Teams update v2 is live.', { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } }); }
