import { createContext, useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

export const RouterContext = createContext({
	navigateTo: () => {},
	replaceWith: () => {},
	subscribeToRouteParameter: () => ({ getCurrentValue: () => null, subscribe: () => () => {} }),
	subscribeToQueryStringParameter: () => ({ getCurrentValue: () => null, subscribe: () => () => {} }),
});

export const useRoute = (pathDefinition) => {
	const { navigateTo, replaceWith } = useContext(RouterContext);

	return useMemo(() => {
		const navigate = (...args) => navigateTo(pathDefinition, ...args);
		navigate.replacingState = (...args) => replaceWith(pathDefinition, ...args);
		return navigate;
	}, [pathDefinition, navigateTo, replaceWith]);
};

export const useRouteParameter = (name) => {
	const { subscribeToRouteParameter } = useContext(RouterContext);
	const subscription = useMemo(() => subscribeToRouteParameter(name), [subscribeToRouteParameter, name]);
	return useSubscription(subscription);
};

export const useQueryStringParameter = (name) => {
	const { subscribeToQueryStringParameter } = useContext(RouterContext);
	const subscription = useMemo(() => subscribeToQueryStringParameter(name), [subscribeToQueryStringParameter, name]);
	return useSubscription(subscription);
};
