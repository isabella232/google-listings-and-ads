const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const WooCommerceDependencyExtractionWebpackPlugin = require( '@woocommerce/dependency-extraction-webpack-plugin' );
const path = require( 'path' );

const requestToExternal = ( request ) => {
	// The following default externals are bundled for compatibility with older versions of WP
	// Note CSS for specific components is bundled via admin/assets/src/index.scss
	// WP 5.4 is the min version for <Card* />, <TabPanel />
	const bundled = [
		'@wordpress/compose',
		'@wordpress/components',
		'@wordpress/primitives',
	];
	if ( bundled.includes( request ) ) {
		return false;
	}
};

const exceptSVGRule = ( rule ) => {
	return ! rule.test.toString().match( /svg/i );
};

const webpackConfig = {
	...defaultConfig,
	module: {
		...defaultConfig.module,
		// Expose image assets as files.
		// In Webpack 5 we would use Asset Modules and `asset/resource`
		rules: [
			// Remove `@wordpress/` rules for SVGs.
			...defaultConfig.module.rules.filter( exceptSVGRule ),
			{
				test: /\.(svg|png|jpe?g|gif)$/i,
				use: {
					loader: 'file-loader',
					options: {
						name: 'images/[path]/[contenthash].[name].[ext]',
					},
				},
				// Prevent Webpack 5 from procesing files again.
				type: 'javascript/auto',
			},
		],
	},
	resolve: {
		...defaultConfig.resolve,
		alias: {
			'.~': path.resolve( process.cwd(), 'js/src/' ),
		},
		// Resolve jsx/tsx files for `@woocommerce/data`...`/with-plugins-hydration`
		extensions: [ '.ts', '.tsx', '.js', '.jsx', '.json' ],
	},
	plugins: [
		// Replace the default `@wordpress/DependencyExtractionWebpackPlugin` with the `@woocommerce` one.
		...defaultConfig.plugins.filter(
			( plugin ) =>
				plugin.constructor.name !== 'DependencyExtractionWebpackPlugin'
		),
		new WooCommerceDependencyExtractionWebpackPlugin( {
			injectPolyfill: true,
			requestToExternal,
		} ),
	],
	entry: {
		index: path.resolve( process.cwd(), 'js/src', 'index.js' ),
		'task-complete-setup': path.resolve(
			process.cwd(),
			'js/src/tasks/complete-setup',
			'index.js'
		),
		'custom-inputs': path.resolve(
			process.cwd(),
			'js/src/custom-inputs',
			'index.js'
		),
		'product-attributes': path.resolve(
			process.cwd(),
			'js/src/product-attributes',
			'index.js'
		),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve( process.cwd(), 'js/build' ),
	},
};

const sassTest = /\.(sc|sa)ss$/;
const updatedSassOptions = {
	sourceMap: process.env.NODE_ENV === 'production',
	sassOptions: {
		includePaths: [ 'js/src/css/abstracts' ],
	},
	prependData:
		'@import "_colors"; ' +
		'@import "_variables"; ' +
		'@import "_mixins"; ' +
		'@import "_breakpoints"; ',
};

// Update sass-loader config to prepend imports automatically
// like wc-admin, without rebuilding entire Rule config
webpackConfig.module.rules.forEach( ( { test, use }, ruleIndex ) => {
	if ( test.toString() === sassTest.toString() ) {
		use.forEach( ( { loader }, loaderIndex ) => {
			if ( loader === require.resolve( 'sass-loader' ) ) {
				webpackConfig.module.rules[ ruleIndex ].use[
					loaderIndex
				].options = updatedSassOptions;
			}
		} );
	}
} );

module.exports = webpackConfig;
