import { useCallback, useRef } from 'react';

export const useMutableCallback = (callback) => {
	const ref = useRef();
	ref.current = callback;

	return useCallback((...args) => (0, ref.current)(...args), [ref]);
};
