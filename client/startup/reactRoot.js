import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

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
	let pristine = true;
	Tracker.autorun(async () => {
		portalsDep.depend();

		if (portalsMap.size === 0 && pristine) {
			return;
		}

		pristine = false;

		const rootNode = getRootNode();
		const [
			{ createElement },
			{ render },
			{ MeteorProvider },
		] = await Promise.all([
			import('react'),
			import('react-dom'),
			import('../providers/MeteorProvider'),
		]);

		render(createElement(MeteorProvider, {}, ...portalsMap.values()), rootNode);
	});
});
