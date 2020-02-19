import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { memo, useRef, useLayoutEffect, createElement, forwardRef } from 'react';

export const createComponentFromTemplate = (
	template,
	renderContainerElement = (ref) => createElement('div', { ref }),
) => {
	const component = memo(forwardRef(function(props, ref) {
		const stateRef = useRef(new ReactiveVar(props));
		const wrapperRef = useRef();
		const mergedRef = useMergedRefs(ref, wrapperRef);

		useLayoutEffect(() => {
			stateRef.current.set(props);
		});

		useLayoutEffect(() => {
			const view = Blaze.renderWithData(template, () => stateRef.current.get(), wrapperRef.current);

			return () => {
				Blaze.remove(view);
			};
		}, []);

		return renderContainerElement(mergedRef);
	}));

	component.displayName = template.viewName;

	return component;
};
