import { HTML } from 'meteor/htmljs';
import { Template } from 'meteor/templating';

import { createTemplateFromLazyComponent } from '../../../../client/reactRoot';

Template.Blocks = createTemplateFromLazyComponent(async () => {
	const { MessageBlock } = await import('./MessageBlock');
	return MessageBlock;
}, () => HTML.DIV.call(null, { class: 'rc-ui-kit js-block-wrapper' }));

Template.Blocks.onRendered(function() {
	this.firstNode.dispatchEvent(new Event('rendered'));
});
