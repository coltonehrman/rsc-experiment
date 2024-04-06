import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createElement } from 'react';
import { serveStatic } from '@hono/node-server/serve-static';
import * as ReactServerDom from 'react-server-dom-webpack/server.browser';
import { build } from './build.js';
import { clientComponentMap } from './component-map.js';

const app = new Hono();

/**
 * Endpoint to serve your index route.
 * Includes the loader `/build/_client.js` to request your server component
 * and stream results into `<div id="root">`
 */
app.get('/', async (c) => {
	return c.html(`
	<!DOCTYPE html>
	<html>
	<head>
		<title>React Server Components from Scratch</title>
		<script src="https://cdn.tailwindcss.com"></script>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/build/_client.js"></script>
	</body>
	</html>
	`);
});

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

app.get('/app/:port', async (c) => {
	const { port } = c.req.param();
	return fetch(`http://localhost:${port}/rsc`);
});

/**
 * Serve your `build/` folder as static assets.
 * Allows you to serve built client components
 * to import from your browser.
 */
app.use('/build/*', serveStatic());

app.use('/build/:app/*', async (c, next) => {
	const appMap = {
		'app-2': 3002,
		'app-3': 3003
	};

	const port = appMap[c.req.param().app];

	if (!port) return next();

	return fetch(`http://localhost:${port}` + c.req.path.replace(c.req.param().app + '/', ''));
});

serve(
	{
		fetch: app.fetch,
		port: 3001
	},
	async (info) => {
		await build();
		console.log(`Listening on http://localhost:${info.port}`);
	}
);
