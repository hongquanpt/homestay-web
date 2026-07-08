import { NextRequest } from 'next/server';
import eventEmitter from '@/lib/event-emitter';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const bookingId = params.id;
  
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = (data: any) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  const onBookingUpdated = (booking: any) => {
    if (booking.id === bookingId) {
      sendEvent({ type: 'BOOKING_UPDATED', payload: booking });
    }
  };

  eventEmitter.on('BOOKING_UPDATED', onBookingUpdated);

  sendEvent({ type: 'HEARTBEAT', payload: 'connected' });

  req.signal.addEventListener('abort', () => {
    eventEmitter.off('BOOKING_UPDATED', onBookingUpdated);
    writer.close();
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
