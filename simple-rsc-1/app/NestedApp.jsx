'use client';

import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createFromFetch } from 'react-server-dom-webpack/client';

export function NestedApp({ app }) {
	const ref = useRef(null);

	useEffect(() => {
		if (ref.current) {
			const root = createRoot(ref.current);

			createFromFetch(fetch(`/app/${app}`)).then((comp) => {
				root.render(comp);
			});
		}
	}, []);

	return <div ref={ref} />;
}
