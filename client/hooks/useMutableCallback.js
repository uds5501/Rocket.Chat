import { useCallback, useEffect, useRef } from 'react';

export const useMutableCallback = (callback) => {
	const ref = useRef(callback);

	useEffect(() => {
		ref.current = callback;
	});

	return useCallback((...args) => (0, ref.current)(...args), [ref]);
};
