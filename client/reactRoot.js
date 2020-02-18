import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Random } from 'meteor/random';
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

const portalsSet = new Set();
const portalsDep = new Tracker.Dependency();

export const createTemplateForComponent = async (
	component,
	props = {},
	// eslint-disable-next-line new-cap
	renderContainerView = () => HTML.DIV(),
) => {
	const name = component.displayName || component.name || Random.id();

	if (Template[name]) {
		Template[name].props.set(props);
		return name;
	}

	Template[name] = new Blaze.Template(name, renderContainerView);

	Template[name].props = new ReactiveVar(props);

	const { createElement } = await import('react');
	const { createPortal } = await import('react-dom');

	Template[name].onRendered(() => {
		Template.instance().autorun(() => {
			portalsSet.delete(Template.instance().portal);

			Template.instance().portal = createPortal(
				createElement(component, Template[name].props.get()),
				Template.instance().firstNode,
			);

			portalsSet.add(Template.instance().portal);
			portalsDep.changed();
		});
	});

	Template[name].onDestroyed(() => {
		if (Template.instance().portal) {
			portalsSet.delete(Template.instance().portal);
			portalsDep.changed();
		}
	});

	return name;
};

Meteor.startup(() => {
	let pristine = true;
	Tracker.autorun(async () => {
		portalsDep.depend();

		if (portalsSet.size === 0 && pristine) {
			return;
		}

		pristine = false;

		const rootNode = getRootNode();
		const { createElement } = await import('react');
		const { render } = await import('react-dom');
		const { MeteorProvider } = await import('./providers/MeteorProvider');

		render(createElement(MeteorProvider, {}, Array.from(portalsSet)), rootNode);
	});
});
