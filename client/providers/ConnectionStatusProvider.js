import { Meteor } from 'meteor/meteor';
import React, { useMemo } from 'react';

import { ConnectionStatusContext } from '../contexts/ConnectionStatusContext';
import { useReactiveValueAsSubscription } from '../hooks/useReactiveValueAsSubscription';

export function ConnectionStatusProvider({ children }) {
	const subscription = useReactiveValueAsSubscription(() => ({ ...Meteor.status() }));

	const value = useMemo(() => ({
		...subscription,
		reconnect: Meteor.reconnect,
	}), [subscription]);

	return <ConnectionStatusContext.Provider children={children} value={value} />;
}
