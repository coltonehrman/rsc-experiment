import { Suspense } from 'react';
import { Albums } from './Albums.jsx';

export default function Page() {
	return (
		<>
			<h1 className="text-3xl mb-3">App 2</h1>
			<Suspense fallback={<h1>Getting albums</h1>}>
				{/* @ts-expect-error 'Promise<Element>' is not a valid JSX element. */}
				<Albums />
			</Suspense>
		</>
	);
}
