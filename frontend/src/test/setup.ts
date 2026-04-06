import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// @zag-js/focus-visible patches HTMLElement.prototype.focus; that throws in Vitest's jsdom.
// vite.config `test.server.deps.inline` must include this package so the mock applies.
vi.mock('@zag-js/focus-visible', () => ({
    trackFocusVisible: (fn: (isFocusVisible: boolean) => void) => {
        fn(true);
        return () => {};
    },
}));

// Chakra UI Menu scrolls the list on open; jsdom elements have no scrollTo.
if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollToPolyfill() {
        /* noop */
    };
}

afterEach(() => {
    cleanup();
});
