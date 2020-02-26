import React from 'react';

import { MeteorProvider } from '../providers/MeteorProvider';

export function App({ portals }) {
	return <MeteorProvider>
		{portals}
	</MeteorProvider>;
}
