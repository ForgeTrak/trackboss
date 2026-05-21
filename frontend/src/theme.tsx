/* eslint-disable */
import { createSystem, defaultConfig } from '@chakra-ui/react';

export default createSystem(defaultConfig, {
    globalCss: {
        body: {
            bg: 'gray.50',
        },
    },

    theme: {
        tokens: {
            colors: {
                transparent: { value: 'transparent' },
                white: { value: '#ffffff' },
                black: { value: '#000000' },
                orange: {
                    50: {
                        value: '#fff1dc',
                    },
                    100: {
                        value: '#ffd6af',
                    },
                    200: {
                        value: '#ffbd7f',
                    },
                    300: {
                        value: '#ffa24d',
                    },
                    400: {
                        value: '#fe881c',
                    },
                    500: {
                        value: '#e56e03',
                    },
                    600: {
                        value: '#b35600',
                    },
                    700: {
                        value: '#803d00',
                    },
                    800: {
                        value: '#4e2400',
                    },
                    900: {
                        value: '#1f0a00',
                    },
                },
                gray: {
                    50: {
                        value: '#F9F9F9',
                    },
                    100: {
                        value: '#BCBCBC',
                    },
                    200: {
                        value: '#ACACAC',
                    },
                    300: {
                        value: '#C4C4C4',
                    },
                    400: {
                        value: '#626262',
                    },
                },
                red: { value: '#EE6439' },
                green: { value: '#76CE6F' },
                blue: { value: '#68A4FF' },
                yellow: { value: '#FFEB50' },
            },

            fonts: {
                heading: {
                    value: 'Russo One, sans-serif',
                },
                body: {
                    value: 'Roboto, sans-serif',
                },
            },
        },
    },

});
