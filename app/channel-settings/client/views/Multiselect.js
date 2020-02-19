import { HTML } from 'meteor/htmljs';
import { Template } from 'meteor/templating';

import { createTemplateFromLazyComponent } from '../../../../client/lib/createTemplateFromLazyComponent';

Template.Multiselect = createTemplateFromLazyComponent(async () => {
	const {
		MultiSelectSettingInput,
	} = await import('../../../../client/components/admin/settings/inputs/MultiSelectSettingInput');
	return MultiSelectSettingInput;
}, () => HTML.DIV.call(null, { class: 'rc-multiselect', style: 'display: flex;' }));
