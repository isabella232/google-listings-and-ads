<?php
/**
 * Plugin Name: Google Listings and Ads
 * Plugin URL: https://wordpress.org/plugins/google-listings-and-ads/
 * Description: Native integration with Google that allows merchants to easily display their products across Google’s network.
 * Version: 1.11.1
 * Author: WooCommerce
 * Author URI: https://woocommerce.com/
 * Text Domain: google-listings-and-ads
 * Requires at least: 5.6
 * Tested up to: 5.9
 * Requires PHP: 7.3
 *
 * WC requires at least: 5.8
 * WC tested up to: 6.1
 * Woo:
 *
 * @package WooCommerce\Admin
 */

use Automattic\Jetpack\Config;
use Automattic\WooCommerce\GoogleListingsAndAds\Container;
use Automattic\WooCommerce\GoogleListingsAndAds\Autoloader;
use Automattic\WooCommerce\GoogleListingsAndAds\PluginFactory;
use Automattic\WooCommerce\GoogleListingsAndAds\Internal\Requirements\VersionValidator;
use Psr\Container\ContainerInterface;

defined( 'ABSPATH' ) || exit;

define( 'WC_GLA_VERSION', '1.11.1' ); // WRCS: DEFINED_VERSION.
define( 'WC_GLA_MIN_PHP_VER', '7.3' );
define( 'WC_GLA_MIN_WC_VER', '5.8' );

// Load and initialize the autoloader.
require_once __DIR__ . '/src/Autoloader.php';
if ( ! Autoloader::init() ) {
	return;
}

// Validate the required versions of everything our plugin depends on.
if ( ! VersionValidator::instance()->validate() ) {
	return;
}

// Register activation hook
register_activation_hook(
	__FILE__,
	function () {
		PluginFactory::instance()->activate();
	}
);

// Hook much of our plugin after WooCommerce is loaded.
add_action(
	'woocommerce_loaded',
	function () {
		PluginFactory::instance()->register();
	},
	1
);

// Register deactivation hook
register_deactivation_hook(
	__FILE__,
	function () {
		PluginFactory::instance()->deactivate();
	}
);

/**
 * Remove our plugin if WooCommerce is deactivated.
 *
 * @param string $plugin
 *   Path to the plugin file relative to the plugins directory.
 * @param bool   $network_activation
 *  Whether the plugin is being activated for all sites in the network
 */
function detect_wc_deactivation( string $plugin, bool $network_activation ): void {
	if ( $plugin === 'woocommerce/woocommerce.php' ) {
		if ( ! $network_activation ) {
			if ( is_plugin_active( plugin_basename( __FILE__ ) ) ) {
				add_action( 'update_option_active_plugins', 'force_deactivate_gla_plugin' );
			}
		}
	}

}

add_action( 'deactivated_plugin', 'detect_wc_deactivation', 10, 2 );

/**
 * Deactivate plugin.
 */
function force_deactivate_gla_plugin(): void {
	deactivate_plugins( plugin_basename( __FILE__ ) );
}

/**
 * Get our main container object.
 *
 * @return ContainerInterface
 */
function woogle_get_container(): ContainerInterface {
	static $container = null;
	if ( null === $container ) {
		$container = new Container();
	}

	return $container;
}

/**
 * Jetpack-config will initialize the modules on "plugins_loaded" with priority 2,
 * so this code needs to be run before that.
 */
add_action(
	'plugins_loaded',
	function() {
		woogle_get_container()->get( Config::class );
	},
	1
);
