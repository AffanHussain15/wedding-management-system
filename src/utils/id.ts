/**
 * Client-side id generator. Starts above the seed-record id range (1–12) so
 * generated ids never collide. Kept out of the reducer to keep it pure.
 */

let counter = 1000;

export const nextId = (): number => (counter += 1);
