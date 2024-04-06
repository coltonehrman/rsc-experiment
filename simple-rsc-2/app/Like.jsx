'use client';

export default function Like() {
	// @ts-ignore
	const [likes, setLikes] = React.useState(0);
	return <button onClick={() => setLikes(likes + 1)}>♥ {likes}</button>;
}
