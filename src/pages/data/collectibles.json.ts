// /data/collectibles.json: collectible locations, credited to Game Checklists (src/lib/opendata.ts).
import { collectiblesFile, json } from '../../lib/opendata';
export const GET = () => json(collectiblesFile());
