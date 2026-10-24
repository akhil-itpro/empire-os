// Everything a student can be given: the 120 base missions plus the 40 pack missions.
// The plan engine only picks pack missions for students who turned that pack on.
import { MISSIONS, type Mission } from "./missions";
import { PACK_MISSIONS } from "./packs";

export const LIBRARY: Mission[] = [...MISSIONS, ...PACK_MISSIONS];

export const LIBRARY_BY_ID = new Map(LIBRARY.map((m) => [m.id, m]));
