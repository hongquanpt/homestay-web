import { EventEmitter } from 'events';

// In development, Next.js clears the module cache often,
// so we store the emitter in the global object to prevent losing listeners.

declare global {
 var _eventEmitter: EventEmitter | undefined;
}

const eventEmitter = global._eventEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
 global._eventEmitter = eventEmitter;
}

export default eventEmitter;
