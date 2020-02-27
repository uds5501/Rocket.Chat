import { Tracker } from 'meteor/tracker';
import { useMemo, useRef, useEffect } from 'react';

import { useMutableCallback } from './useMutableCallback';

export const useReactiveValueAsSubscription = (fn) => {
	const f = useMutableCallback(fn);

	const ref = useRef();

	useEffect(() => {
		ref.current = Tracker.nonreactive(f);
	}, [f]);

	return useMemo(() => ({
		getCurrentValue: () => ref.current,
		subscribe: (callback) => {
			const computation = Tracker.autorun(() => {
				ref.current = f();
				callback();
			});

			return () => {
				computation.stop();
			};
		},
	}), [f]);
};
