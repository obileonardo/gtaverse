// The map's collectible pins as one static file, built ahead of time (content/collectibles.json).
// The map fetches it only when a collectible layer is turned on, so the map page stays light.
import collectiblesJson from '../../content/collectibles.json';
import type { MapCollectible } from '../components/map/types';

export function GET() {
  const items: MapCollectible[] = collectiblesJson.items.map((i) => ({
    id: i.id, layer: i.layer, number: i.number, x: i.pin.x, y: i.pin.y, label: i.label, note: i.notes, url: i.source.url,
  }));
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
