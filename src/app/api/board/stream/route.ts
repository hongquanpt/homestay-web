import { NextRequest } from 'next/server';
import eventEmitter from '@/lib/event-emitter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`));

      // Handle new bookings
      const onBoardUpdate = () => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'UPDATE' })}\n\n`));
      };

      // Listen to both NEW_BOOKING (db booking) and TEMP_BOOKING (payos hold)
      eventEmitter.on('NEW_BOOKING', onBoardUpdate);
      eventEmitter.on('TEMP_BOOKING', onBoardUpdate);

      // Keep connection alive
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch (e) {
          clearInterval(keepAlive);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        eventEmitter.off('NEW_BOOKING', onBoardUpdate);
        eventEmitter.off('TEMP_BOOKING', onBoardUpdate);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in Nginx
    },
  });
}
