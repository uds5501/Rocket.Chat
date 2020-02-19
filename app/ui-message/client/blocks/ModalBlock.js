import { HTML } from 'meteor/htmljs';
import { Template } from 'meteor/templating';

import { createTemplateFromLazyComponent } from '../../../../client/lib/createTemplateFromLazyComponent';

Template.ModalBlock = createTemplateFromLazyComponent(async () => {
	const { ModalBlock } = await import('./MessageBlock');
	return ModalBlock;
}, () => HTML.DIV.call(null, { class: 'js-modal-block' }));
