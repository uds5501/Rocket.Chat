import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';
import { Template } from 'meteor/templating';

import { registerPortal, unregisterPortal } from '../startup/reactRoot';

export const createTemplateFromLazyComponent = (
	factory,
	renderContainerView = () => HTML.DIV.call(null),
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
			registerPortal(this, createPortal(props));
		});
	});

	template.onDestroyed(function() {
		unregisterPortal(this);
	});

	return template;
};
