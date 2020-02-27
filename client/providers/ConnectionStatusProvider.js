import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import React, { useMemo } from 'react';

import { ConnectionStatusContext } from '../contexts/ConnectionStatusContext';

export function ConnectionStatusProvider({ children }) {
	const value = useMemo(() => ({
		subscription: {
			getCurrentValue: () => Tracker.nonreactive(() => ({ ...Meteor.status() })),
			subscribe: (callback) => {
				const computation = Tracker.autorun(() => {
					Meteor.status();
					callback();
				});

				return () => {
					computation.stop();
				};
			},
		},
		reconnect: Meteor.reconnect,
	}), []);

	return <ConnectionStatusContext.Provider children={children} value={value} />;
}
