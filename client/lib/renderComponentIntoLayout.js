import { Meteor } from 'meteor/meteor';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Template } from 'meteor/templating';

import { createTemplateFromLazyComponent } from './createTemplateFromLazyComponent';

export const renderComponentIntoLayout = (name, factory, { renderContainerView, layoutName = name, regions } = {}) => {
	if (!Template[name]) {
		Template[name] = createTemplateFromLazyComponent(factory, renderContainerView);
		Template[name].viewName = name;
	}

	BlazeLayout.render(layoutName, regions);
};
