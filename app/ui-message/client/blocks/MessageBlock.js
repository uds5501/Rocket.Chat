import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { UiKitMessage as uiKitMessage, kitContext, UiKitModal as uiKitModal, messageParser, modalParser, UiKitComponent } from '@rocket.chat/fuselage-ui-kit';
import { uiKitText } from '@rocket.chat/ui-kit';
import { Modal, AnimatedVisibility, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';

import { renderMessageBody } from '../../../ui-utils/client';
import { getURL } from '../../../utils/lib/getURL';
import { useReactiveValue } from '../../../../client/hooks/useReactiveValue';
import * as ActionManager from '../ActionManager';

const focusableElementsString =	'a[href]:not([tabindex="-1"]), area[href]:not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';

const focusableElementsStringInvalid =	'a[href]:not([tabindex="-1"]):invalid, area[href]:not([tabindex="-1"]):invalid, input:not([disabled]):not([tabindex="-1"]):invalid, select:not([disabled]):not([tabindex="-1"]):invalid, textarea:not([disabled]):not([tabindex="-1"]):invalid, button:not([disabled]):not([tabindex="-1"]):invalid, iframe:invalid, object:invalid, embed:invalid, [tabindex]:not([tabindex="-1"]):invalid, [contenteditable]:invalid';

messageParser.text = ({ text, type } = {}) => {
	if (type !== 'mrkdwn') {
		return text;
	}

	return <span dangerouslySetInnerHTML={{ __html: renderMessageBody({ msg: text }) }} />;
};

modalParser.text = messageParser.text;

export const messageBlockWithContext = (context) => ({ data }) => (
	<kitContext.Provider value={context}>
		{uiKitMessage(data.blocks)}
	</kitContext.Provider>
);

const textParser = uiKitText(new class {
	plain_text({ text }) {
		return text;
	}

	text({ text }) {
		return text;
	}
}());

// https://www.w3.org/TR/wai-aria-practices/examples/dialog-modal/dialog.html

export const modalBlockWithContext = ({
	onSubmit,
	onClose,
	onCancel,
	...context
}) => (props) => {
	const id = `modal_id_${ useUniqueId() }`;

	const { view, ...data } = useReactiveValue(props.data);
	const values = useReactiveValue(props.values);
	const ref = useRef();

	// Auto focus
	useEffect(() => {
		if (!ref.current) {
			return;
		}

		if (data.errors && Object.keys(data.errors).length) {
			const element = ref.current.querySelector(focusableElementsStringInvalid);
			element && element.focus();
		} else {
			const element = ref.current.querySelector(focusableElementsString);
			element && element.focus();
		}
	}, [ref.current, data.errors]);
	// save focus to restore after close
	const previousFocus = useMemo(() => document.activeElement, []);
	// restore the focus after the component unmount
	useEffect(() => () => previousFocus && previousFocus.focus(), []);
	// Handle Tab, Shift + Tab, Enter and Escape
	const handleKeyDown = useCallback((event) => {
		if (event.keyCode === 13) { // ENTER
			return onSubmit(event);
		}

		if (event.keyCode === 27) { // ESC
			event.stopPropagation();
			event.preventDefault();
			onClose();
			return false;
		}

		if (event.keyCode === 9) { // TAB
			const elements = Array.from(ref.current.querySelectorAll(focusableElementsString));
			const [first] = elements;
			const last = elements.pop();

			if (!ref.current.contains(document.activeElement)) {
				return first.focus();
			}

			if (event.shiftKey) {
				if (!first || first === document.activeElement) {
					last.focus();
					event.stopPropagation();
					event.preventDefault();
				}
				return;
			}

			if (!last || last === document.activeElement) {
				first.focus();
				event.stopPropagation();
				event.preventDefault();
			}
		}
	}, [onSubmit]);
	// Clean the events
	useEffect(() => {
		const element = document.querySelector('.rc-modal-wrapper');
		const container = element.querySelector('.rcx-modal__content');
		const close = (e) => {
			if (e.target !== element) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			onClose();
			return false;
		};

		const ignoreIfnotContains = (e) => {
			if (!container.contains(e.target)) {
				return;
			}
			return handleKeyDown(e);
		};

		document.addEventListener('keydown', ignoreIfnotContains);
		element.addEventListener('click', close);
		return () => {
			document.removeEventListener('keydown', ignoreIfnotContains);
			element.removeEventListener('click', close);
		};
	}, handleKeyDown);

	return (
		<kitContext.Provider value={{ ...context, ...data, values }}>
			<AnimatedVisibility visibility={AnimatedVisibility.UNHIDING}>
				<Modal open id={id} ref={ref}>
					<Modal.Header>
						<Modal.Thumb url={getURL(`/api/apps/${ data.appId }/icon`)} />
						<Modal.Title>{textParser([view.title])}</Modal.Title>
						<Modal.Close tabIndex={-1} onClick={onClose} />
					</Modal.Header>
					<Modal.Content>
						<Box
							is='form'
							method='post'
							action='#'
							onSubmit={onSubmit}
						>
							<UiKitComponent render={uiKitModal} blocks={view.blocks} />
						</Box>
					</Modal.Content>
					<Modal.Footer>
						<ButtonGroup align='end'>
							{ view.close && <Button onClick={onCancel}>{textParser([view.close.text])}</Button>}
							{ view.submit && <Button primary onClick={onSubmit}>{textParser([view.submit.text])}</Button>}
						</ButtonGroup>
					</Modal.Footer>
				</Modal>
			</AnimatedVisibility>
		</kitContext.Provider>
	);
};

export const MessageBlock = (props) => {
	const context = {
		action: (options) => {
			const { actionId, value, blockId, mid = props.mid } = options;
			ActionManager.triggerBlockAction({
				blockId,
				actionId,
				value,
				mid,
				rid: props.rid,
				appId: props.blocks[0].appId,
				container: {
					type: UIKitIncomingInteractionContainerType.MESSAGE,
					id: mid,
				},
			});
		},
		// state: alert,
		appId: props.appId,
		rid: props.rid,
	};

	return <kitContext.Provider value={context}>
		{uiKitMessage(props.blocks)}
	</kitContext.Provider>;
};

export function ModalBlock({ errors: initialErrors, ...initialBlockState }) {
	const { viewId, appId } = initialBlockState;

	const [state] = React.useState(() => new ReactiveVar(initialBlockState));
	const [errors] = React.useState(() => new ReactiveVar(initialErrors));

	const filterInputFields = ({ element, elements = [] }) => {
		if (element && element.initialValue) {
			return true;
		}
		if (elements.length && elements.map((element) => ({ element })).filter(filterInputFields).length) {
			return true;
		}
	};

	const mapElementToState = ({ element, blockId, elements = [] }) => {
		if (elements.length) {
			return elements.map((element) => ({ element, blockId })).filter(filterInputFields).map(mapElementToState);
		}
		return [element.actionId, { value: element.initialValue, blockId }];
	};

	const groupStateByBlockIdMap = (obj, [key, { blockId, value }]) => {
		obj[blockId] = obj[blockId] || {};
		obj[blockId][key] = value;
		return obj;
	};

	const groupStateByBlockId = (obj) => Object.entries(obj).reduce(groupStateByBlockIdMap, {});

	const [formState] = React.useState(() => new ReactiveDict(
		initialBlockState.view.blocks
			.filter(filterInputFields)
			.map(mapElementToState)
			.reduce((obj, el) => {
				if (Array.isArray(el[0])) {
					return { ...obj, ...Object.fromEntries(el) };
				}
				return { ...obj, [el[0]]: el[1] };
			}, {})));

	React.useEffect(() => {
		const handleUpdate = ({ type, ...blockState }) => {
			if (type === 'errors') {
				errors.set(blockState.errors);
				return;
			}

			return state.set(blockState);
		};

		ActionManager.on(viewId, handleUpdate);

		return () => {
			ActionManager.off(viewId, handleUpdate);
		};
	}, []);

	const prevent = (e) => {
		if (e) {
			(e.nativeEvent || e).stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();
		}
	};

	return React.createElement(
		modalBlockWithContext({
			onCancel: (e) => {
				prevent(e);
				return ActionManager.triggerCancel({
					appId,
					viewId,
					view: {
						...state.get().view,
						id: viewId,
						state: groupStateByBlockId(formState.all()),
					},
				});
			},
			onClose: (e) => {
				prevent(e);
				return ActionManager.triggerCancel({
					appId,
					viewId,
					view: {
						...state.get().view,
						id: viewId,
						state: groupStateByBlockId(formState.all()),
					},
					isCleared: true,
				});
			},
			onSubmit: (e) => {
				prevent(e);
				ActionManager.triggerSubmitView({
					viewId,
					appId,
					payload: {
						view: {
							...state.get().view,
							id: viewId,
							state: groupStateByBlockId(formState.all()),
						},
					},
				});
			},
			action: ({ actionId, appId, value, blockId, mid = initialBlockState.mid }) => ActionManager.triggerBlockAction({
				container: {
					type: UIKitIncomingInteractionContainerType.VIEW,
					id: viewId,
				},
				actionId,
				appId,
				value,
				blockId,
				mid,
			}),
			state: ({ actionId, value, /* ,appId, */ blockId = 'default' }) => {
				formState.set(actionId, {
					blockId,
					value,
				});
			},
			...initialBlockState,
		}),
		{
			data: () => ({ ...state.get(), errors: errors.get() }),
			values: () => formState.all(),
		},
	);
}
