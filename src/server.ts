import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import {PostHog} from 'posthog-node';
import {environment} from './environments/environment';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();


/**
 * Extract distinct ID from PostHog cookie
 */
function getDistinctIdFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;

  const cookieMatch = cookieHeader.match(`ph_${environment.posthogKey}_posthog=([^;]+)`);
  if (cookieMatch) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookieMatch[1]));
      return parsed?.distinct_id || null;
    } catch (error) {
      console.error('Error parsing PostHog cookie:', error);
      return null;
    }
  }
  return null;
}

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use(async (req, res, next) => {

  const { protocol, originalUrl, baseUrl, headers } = req;

  const distinctId = getDistinctIdFromCookie(headers.cookie);
  const client = new PostHog(
    environment.posthogKey,
    { host: environment.posthogHost }
  )

  if (distinctId) {
    client.capture({
      distinctId: distinctId,
      event: 'test_ssr_event',
      properties: {
        message: 'Hello from Angular SSR!'
      }
    })
  }


  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);

  await client.shutdown()
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
