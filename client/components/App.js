import React, { useLayoutEffect } from 'react';

import { MeteorProvider } from '../providers/MeteorProvider';
import { useReactiveValue } from '../hooks/useReactiveValue';

export function App({ getPortals }) {
	const portals = useReactiveValue(getPortals);

	useLayoutEffect(() => {
		document.body.classList.add('global-font-family', 'color-primary-font-color');

		return () => {
			document.body.classList.remove('global-font-family', 'color-primary-font-color');
		};
	}, []);

	useLayoutEffect(() => {
		const initialPageLoadingElement = document.getElementById('initial-page-loading');

		if (!initialPageLoadingElement) {
			return;
		}

		initialPageLoadingElement.style.display = 'none';

		return () => {
			initialPageLoadingElement.style.display = 'flex';
		};
	}, []);

	return <MeteorProvider>
		<div id='alert-anchor' />
		{portals}
	</MeteorProvider>;
}
