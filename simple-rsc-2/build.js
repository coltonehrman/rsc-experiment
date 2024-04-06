import { build as esbuild } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'es-module-lexer';
import { relative, resolve } from 'node:path';
import { clientComponentMap } from './component-map.js';

const appDir = new URL('./app/', import.meta.url);
const buildDir = new URL('./build/', import.meta.url);
const reactComponentRegex = /\.jsx$/;
const namespace = 'app-2';

/**
 * Build both server and client components with esbuild
 */
export async function build() {
	const clientEntryPoints = new Set();

	/** Build the server component tree */
	await esbuild({
		bundle: true,
		format: 'esm',
		logLevel: 'error',
		entryPoints: [resolveApp('page.jsx')],
		outdir: resolveBuild(),
		// avoid bundling npm packages for server-side components
		packages: 'external',
		plugins: [
			{
				name: 'resolve-client-imports',
				setup(build) {
					// Intercept component imports to check for 'use client'
					build.onResolve({ filter: reactComponentRegex }, async ({ path: relativePath }) => {
						const path = resolveApp(relativePath);
						const contents = await readFile(path, 'utf-8');

						if (contents.startsWith("'use client'")) {
							clientEntryPoints.add(path);
							return {
								// Avoid bundling client components into the server build.
								external: true,
								// Resolve the client import to the built `.js` file
								// created by the client `esbuild` process below.
								path: relativePath.replace(reactComponentRegex, '.js')
							};
						}
					});
				}
			}
		]
	});

	/** Build client components */
	const { outputFiles } = await esbuild({
		bundle: true,
		format: 'esm',
		logLevel: 'error',
		entryPoints: [resolveApp('_client.jsx'), ...clientEntryPoints],
		outdir: resolveBuild(),
		splitting: true,
		write: false
	});

	outputFiles.forEach(async (file) => {
		// Parse file export names
		const [, exports] = parse(file.text);
		let newContents = file.text;

		for (const exp of exports) {
			// Create a unique lookup key for each exported component.
			// Could be any identifier!
			// We'll choose the file path + export name for simplicity.
			const key = file.path + exp.n;

			clientComponentMap[key] = {
				// Have the browser import your component from your server
				// at `/build/[component].js`
				id: `/build/${namespace}/${relative(resolveBuild(), file.path)}`,
				// Use the detected export name
				name: exp.n,
				// Turn off chunks. This is webpack-specific
				chunks: [],
				// Use an async import for the built resource in the browser
				async: true
			};

			// Tag each component export with a special `react.client.reference` type
			// and the map key to look up import information.
			// This tells your stream renderer to avoid rendering the
			// client component server-side. Instead, import the built component
			// client-side at `clientComponentMap[key].id`
			newContents += `
${exp.ln}.$$id = ${JSON.stringify(key)};
${exp.ln}.$$typeof = Symbol.for("react.client.reference");
			`;
		}
		await writeFile(file.path, newContents);
	});
}

function resolveApp(path = '') {
	return fileURLToPath(new URL(path, appDir));
}

function resolveBuild(path = '') {
	return fileURLToPath(new URL(path, buildDir));
}

const pathToThisFile = resolve(fileURLToPath(import.meta.url));
const pathPassedToNode = resolve(process.argv[1]);

if (pathToThisFile === pathPassedToNode) {
	await build();
}
