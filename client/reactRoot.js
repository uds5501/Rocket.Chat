import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';
import { Template } from 'meteor/templating';
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

export const createTemplateFromLazyComponent = (
	factory,
	// eslint-disable-next-line new-cap
	renderContainerView = () => HTML.DIV(),
) => {
	const template = new Blaze.Template(Random.id(), renderContainerView);

	template.onRendered(function() {
		const builder = new ReactiveVar(null);

		Promise.all([
			import('react'),
			import('react-dom'),
			factory(),
		]).then(([{ createElement }, { createPortal }, component]) => {
			if (!this.firstNode) {
				return;
			}

			builder.set((props) => createPortal(createElement(component, props), this.firstNode));
		}, console.error);

		this.autorun(() => {
			const createPortal = builder.get();

			if (!createPortal) {
				return;
			}

			const props = Template.currentData();
			portalsMap.set(this, createPortal(props));
			portalsDep.changed();
		});
	});

	template.onDestroyed(function() {
		portalsMap.delete(this);
		portalsDep.changed();
	});

	return template;
};

export const renderComponentIntoLayout = (name, factory, { renderContainerView, layoutName = name, regions } = {}) => {
	if (!Template[name]) {
		Template[name] = createTemplateFromLazyComponent(factory, renderContainerView);
		Template[name].viewName = name;
	}

	BlazeLayout.render(layoutName, regions);
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
			import('./providers/MeteorProvider'),
		]);

		render(createElement(MeteorProvider, {}, ...portalsMap.values()), rootNode);
	});
});
