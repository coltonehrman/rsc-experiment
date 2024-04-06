import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createElement } from 'react';
import { serveStatic } from '@hono/node-server/serve-static';
import * as ReactServerDom from 'react-server-dom-webpack/server.browser';
import { build } from './build.js';
import { clientComponentMap } from './component-map.js';

const app = new Hono();

/**
 * Endpoint to render your server component to a stream.
 * This uses `react-server-dom-webpack` to parse React elements
 * into encoded virtual DOM elements for the client to read.
 */
app.get('/rsc', async (c) => {
	// Note This will raise a type error until you build with `npm run dev`
	const Page = await import('./build/page.js');
	const Comp = createElement(Page.default);

	const stream = ReactServerDom.renderToReadableStream(Comp, clientComponentMap);
	return new Response(stream);
});

/**
 * Serve your `build/` folder as static assets.
 * Allows you to serve built client components
 * to import from your browser.
 */
app.use('/build/*', serveStatic());

serve({
	fetch: app.fetch,
	port: 3003
}, async (info) => {
	await build();
	console.log(`Listening on http://localhost:${info.port}`);
});