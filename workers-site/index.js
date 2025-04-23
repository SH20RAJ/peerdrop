import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { RoomDurableObject } from './signaling-worker';

/**
 * The DEBUG flag will do two things:
 * 1. We will skip caching on the edge, which makes it easier to debug
 * 2. We will return an error message on exception in your Response rather than the default 404.html page
 */
const DEBUG = false;

export { RoomDurableObject };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let options = {};

    try {
      if (DEBUG) {
        options.cacheControl = {
          bypassCache: true,
        };
      }

      // Check if the request is for the signaling server
      if (url.pathname.startsWith('/signal/')) {
        const roomId = url.pathname.split('/').pop();

        // Get or create a Durable Object for this room
        const roomObjectId = env.ROOMS.idFromName(roomId);
        const roomObject = env.ROOMS.get(roomObjectId);

        return roomObject.fetch(request);
      }

      // Serve static assets
      return await getAssetFromKV({
        request,
        waitUntil: ctx.waitUntil.bind(ctx),
      }, options);
    } catch (e) {
      // If an error is thrown try to serve the asset at 404.html
      if (!DEBUG) {
        try {
          let notFoundResponse = await getAssetFromKV({
            request,
            waitUntil: ctx.waitUntil.bind(ctx),
          }, {
            mapRequestToAsset: (req) => new Request(`${new URL(req.url).origin}/404.html`, req),
          });

          return new Response(notFoundResponse.body, {
            ...notFoundResponse,
            status: 404,
          });
        } catch (e) {}
      }

      return new Response(e.message || e.toString(), { status: 500 });
    }
  }
};
