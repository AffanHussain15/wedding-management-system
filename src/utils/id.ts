/**
 * Client-side id generator for records that exist only on the device (seating
 * tables, local reminders). Server records always carry a UUID from the API,
 * so these are prefixed to make the origin obvious in logs and to guarantee
 * they can never collide with a server id.
 */

let counter = 0;

export const nextId = (): string => `local-${(counter += 1)}`;

/** True for an id from `nextId`, i.e. a record never persisted server-side. */
export const isLocalId = (id: string): boolean => id.startsWith('local-');
