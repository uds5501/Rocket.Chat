import { Box, Field, Flex, Icon } from '@rocket.chat/fuselage';
import { Template } from 'meteor/templating';
import React, { useRef, useEffect, useLayoutEffect } from 'react';

import { ResetSettingButton } from '../ResetSettingButton';
import { createComponentFromTemplate } from '../../../../lib/createComponentFromTemplate';

const InputAutocomplete = createComponentFromTemplate(
	Template.inputAutocomplete,
	(ref) => <div style={{ position: 'relative' }} ref={ref} />,
);

export function RoomPickSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}) {
	value = value || [];

	const wrapperRef = useRef();
	const valueRef = useRef(value);

	const handleRemoveRoomButtonClick = (rid) => () => {
		onChangeValue(value.filter(({ _id }) => _id !== rid));
	};

	useLayoutEffect(() => {
		valueRef.current = value;
	});

	useEffect(() => {
		$('.autocomplete', wrapperRef.current).on('autocompleteselect', (event, doc) => {
			const { current: value } = valueRef;
			onChangeValue([...value.filter(({ _id }) => _id !== doc._id), doc]);
			event.currentTarget.value = '';
			event.currentTarget.focus();
		});
	}, []);

	return <>
		<Flex.Container>
			<Box>
				<Field.Label htmlFor={_id} title={_id}>{label}</Field.Label>
				{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
			</Box>
		</Flex.Container>
		<InputAutocomplete
			ref={wrapperRef}
			id={_id}
			name={_id}
			class='search autocomplete rc-input__element'
			autocomplete={autocomplete === false ? 'off' : undefined}
			readOnly={readonly}
			placeholder={placeholder}
			disabled={disabled}
			settings={{
				limit: 10,
				// inputDelay: 300
				rules: [
					{
						// @TODO maybe change this 'collection' and/or template
						collection: 'CachedChannelList',
						endpoint: 'rooms.autocomplete.channelAndPrivate',
						field: 'name',
						template: Template.roomSearch,
						noMatchTemplate: Template.roomSearchEmpty,
						matchAll: true,
						selector: (match) => ({ name: match }),
						sort: 'name',
					},
				],
			}}
		/>
		<ul className='selected-rooms'>
			{value.map(({ _id, name }) =>
				<li key={_id} className='remove-room' onClick={handleRemoveRoomButtonClick(_id)}>
					{name} <Icon name='cross' />
				</li>,
			)}
		</ul>
	</>;
}
