import { Suspense } from 'react';
import { Albums } from './Albums.jsx';
import { NestedApp } from './NestedApp.jsx';

export default function Page() {
	return (
		<>
			<h1 className="text-3xl mb-3">App 1</h1>
			<Suspense fallback={<h1>Loading</h1>}>
				<NestedApp app={3002} />
			</Suspense>
			<NestedApp app={3003} />
		</>
	);
}
