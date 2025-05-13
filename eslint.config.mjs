import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
	{ files: ['**/*.{js,mjs,cjs,ts}'] },
	{ languageOptions: { globals: globals.node } },
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		rules: {
			// Set warning for unused variables
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					// Optional: ignore variables that start with underscore
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					// Optional: also ignore destructuring patterns
					ignoreRestSiblings: true
				}
			],

			// Disable the base eslint no-unused-vars rule as it can conflict with the TypeScript one
			'no-unused-vars': 'off'
		}
	}
]
