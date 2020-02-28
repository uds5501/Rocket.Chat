import { FlowRouter } from 'meteor/kadira:flow-router';
import React from 'react';
import { Tracker } from 'meteor/tracker';

import { RouterContext } from '../contexts/RouterContext';

const navigateTo = (pathDefinition, parameters, queryStringParameters) => {
	FlowRouter.go(pathDefinition, parameters, queryStringParameters);
};

const replaceWith = (pathDefinition, parameters, queryStringParameters) => {
	FlowRouter.withReplaceState(() => {
		FlowRouter.go(pathDefinition, parameters, queryStringParameters);
	});
};

const subscribeToRouteParameter = (name) => {
	const fn = () => FlowRouter.getParam(name);

	let currentValue = Tracker.nonreactive(fn);

	const getCurrentValue = () => currentValue;
	const subscribe = (callback) => {
		const computation = Tracker.autorun(() => {
			currentValue = fn();
			callback();
		});

		return () => {
			computation.stop();
		};
	};

	return { getCurrentValue, subscribe };
};

const subscribeToQueryStringParameter = (name) => {
	const fn = () => FlowRouter.getQueryParam(name);

	let currentValue = Tracker.nonreactive(fn);

	const getCurrentValue = () => currentValue;
	const subscribe = (callback) => {
		const computation = Tracker.autorun(() => {
			currentValue = fn();
			callback();
		});

		return () => {
			computation.stop();
		};
	};

	return { getCurrentValue, subscribe };
};

const contextValue = {
	navigateTo,
	replaceWith,
	subscribeToRouteParameter,
	subscribeToQueryStringParameter,
};

export function RouterProvider({ children }) {
	return <RouterContext.Provider children={children} value={contextValue} />;
}
