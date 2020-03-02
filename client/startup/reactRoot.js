import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import React from 'react';
import { render } from 'react-dom';

import { App } from '../components/App';

const getRootNode = () => {
	let rootNode = document.getElementById('react-root');

	if (rootNode) {
		return rootNode;
	}

	rootNode = document.createElement('div');
	rootNode.id = 'react-root';
	document.body.appendChild(rootNode);
	return rootNode;
};

const portalsMap = new Map();
const portalsDep = new Tracker.Dependency();

export const registerPortal = (key, portal) => {
	portalsMap.set(key, portal);
	portalsDep.changed();
};

export const unregisterPortal = (key) => {
	portalsMap.delete(key);
	portalsDep.changed();
};

Meteor.startup(() => {
	const rootNode = getRootNode();
	const getPortals = () => {
		portalsDep.depend();
		return Array.from(portalsMap.values());
	};

	render(<App getPortals={getPortals} />, rootNode);
});
