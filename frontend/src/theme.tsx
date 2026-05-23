/* eslint-disable */
import { createSystem, defaultConfig, defineRecipe, defineSlotRecipe } from '@chakra-ui/react';

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

        recipes: {
            heading: defineRecipe({
                className: 'chakra-heading',
                base: {
                    fontFamily: 'heading',
                    fontWeight: 'bold',
                },
                variants: {
                    size: {
                        xs: { fontSize: 'sm', lineHeight: 'short' },
                        sm: { fontSize: 'md', lineHeight: 'short' },
                        md: { fontSize: 'xl', lineHeight: 'short' },
                        lg: { fontSize: '2xl', lineHeight: 'shorter' },
                        xl: { fontSize: '3xl', lineHeight: '1.2' },
                        '2xl': { fontSize: '4xl', lineHeight: '1.2' },
                        '3xl': { fontSize: '5xl', lineHeight: '1' },
                        '4xl': { fontSize: '6xl', lineHeight: '1' },
                    },
                },
                defaultVariants: {
                    size: 'xl',
                },
            }),
        },

        slotRecipes: {
            toast: defineSlotRecipe({
                className: 'chakra-toast',
                slots: ['root', 'title', 'description', 'indicator', 'closeTrigger', 'actionTrigger'],
                base: {
                    root: {
                        bg: '#e56e03',
                        color: '#ffffff',
                        '&[data-type=success]': {
                            bg: '#e56e03',
                            color: '#ffffff',
                        },
                        '&[data-type=error]': {
                            bg: '#e56e03',
                            color: '#ffffff',
                        },
                        '&[data-type=warning]': {
                            bg: '#e56e03',
                            color: '#ffffff',
                        },
                        '&[data-type=info]': {
                            bg: '#e56e03',
                            color: '#ffffff',
                        },
                    },
                },
            }),
        },
    },

});
