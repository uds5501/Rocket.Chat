import { createContext, useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

export const ConnectionStatusContext = createContext({
	connected: true,
	retryCount: 0,
	retryTime: 0,
	status: 'connected',
	reconnect: () => {},
});

export const useConnectionStatus = () => {
	const value = useContext(ConnectionStatusContext);

	const subscription = useMemo(() => {
		if (value.getCurrentValue && value.subscribe) {
			return {
				getCurrentValue: value.getCurrentValue,
				subscribe: value.subscribe,
			};
		}

		return {
			getCurrentValue: () => value,
			subscribe: () => () => {},
		};
	}, [value]);

	return {
		...useSubscription(subscription),
		reconnect: value.reconnect,
	};
};
