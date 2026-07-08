import { NextRequest } from 'next/server';
import eventEmitter from '@/lib/event-emitter';

// This must be a dynamic route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
 const responseStream = new TransformStream();
 const writer = responseStream.writable.getWriter();
 const encoder = new TextEncoder();

 // Helper to send messages
 const sendEvent = (data: any) => {
 writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
 };

 // Listener function
 const onNewBooking = (booking: any) => {
 sendEvent({ type: 'NEW_BOOKING', payload: booking });
 };

 // Subscribe to the event
 eventEmitter.on('NEW_BOOKING', onNewBooking);

 // Send an initial heartbeat to establish the connection
 sendEvent({ type: 'HEARTBEAT', payload: 'connected' });

 // Handle client disconnect
 req.signal.addEventListener('abort', () => {
 eventEmitter.off('NEW_BOOKING', onNewBooking);
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
