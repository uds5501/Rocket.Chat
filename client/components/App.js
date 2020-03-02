import React from 'react';

import { MeteorProvider } from '../providers/MeteorProvider';
import { useReactiveValue } from '../hooks/useReactiveValue';

export function App({ getPortals }) {
	const portals = useReactiveValue(getPortals);

	return <MeteorProvider>
		<div id='alert-anchor' />
		{portals}
	</MeteorProvider>;
}
