<?php
declare( strict_types=1 );

namespace Automattic\WooCommerce\GoogleListingsAndAds\API\Google;

use Automattic\WooCommerce\GoogleListingsAndAds\Value\PositiveInteger;
use Google_Service_ShoppingContent as ShoppingService;
use Google_Service_ShoppingContent_Account as MC_Account;
use Google_Service_ShoppingContent_AccountAdsLink as MC_Account_Ads_Link;
use Google_Service_ShoppingContent_AccountStatus as MC_Account_Status;
use Google_Service_ShoppingContent_Product as Product;
use Google\Exception as GoogleException;
use Exception;

defined( 'ABSPATH' ) || exit;

/**
 * Class Merchant
 *
 * @package Automattic\WooCommerce\GoogleListingsAndAds\API\Google
 */
class Merchant {

	/**
	 * The shopping service.
	 *
	 * @var ShoppingService
	 */
	protected $service;

	/**
	 * The merchant ID.
	 *
	 * @var PositiveInteger
	 */
	protected $id;

	/**
	 * Merchant constructor.
	 *
	 * @param ShoppingService $service
	 * @param PositiveInteger $id
	 */
	public function __construct( ShoppingService $service, PositiveInteger $id ) {
		$this->service = $service;
		$this->id      = $id;
	}

	/**
	 * Get the ID.
	 *
	 * @return int
	 */
	public function get_id(): int {
		return $this->id->get();
	}

	/**
	 * Set the ID.
	 *
	 * @param int $id
	 */
	public function set_id( int $id ): void {
		$this->id = new PositiveInteger( $id );
	}

	/**
	 * @return Product[]
	 */
	public function get_products(): array {
		$products = $this->service->products->listProducts( $this->get_id() );
		$return   = [];

		while ( ! empty( $products->getResources() ) ) {

			foreach ( $products->getResources() as $product ) {
				$return[] = $product;
			}

			if ( empty( $products->getNextPageToken() ) ) {
				break;
			}

			$products = $this->service->products->listProducts(
				$this->get_id(),
				[ 'pageToken' => $products->getNextPageToken() ]
			);
		}

		return $return;
	}


	/**
	 * Claim a website for the user's Merchant Center account.
	 *
	 * @param bool $overwrite Whether to include the overwrite directive.
	 * @return bool
	 * @throws Exception If the website claim fails.
	 */
	public function claimwebsite( bool $overwrite = false ): bool {
		try {
			$params = $overwrite ? [ 'overwrite' => true ] : [];
			$this->service->accounts->claimwebsite( $this->get_id(), $this->get_id(), $params );
		} catch ( GoogleException $e ) {
			do_action( 'gla_mc_client_exception', $e, __METHOD__ );
			$error_message = __( 'Unable to claim website.', 'google-listings-and-ads' );
			if ( 403 === $e->getCode() ) {
				$error_message = __( 'Website already claimed, use overwrite to complete the process.', 'google-listings-and-ads' );
			}
			throw new Exception( $error_message, $e->getCode() );

		}
		return true;
	}

	/**
	 * Retrieve the user's Merchant Center account information.
	 *
	 * @param int $id Optional - the Merchant Center account to retrieve
	 * @return MC_Account The user's Merchant Center account.
	 * @throws Exception If the account can't be retrieved.
	 */
	public function get_account( int $id = 0 ): MC_Account {
		$id = $id ?: $this->get_id();

		try {
			$mc_account = $this->service->accounts->get( $id, $id );
		} catch ( GoogleException $e ) {
			do_action( 'gla_mc_client_exception', $e, __METHOD__ );
			throw new Exception( __( 'Unable to retrieve merchant center account.', 'google-listings-and-ads' ), $e->getCode() );
		}
		return $mc_account;
	}

	/**
	 * Retrieve the user's Merchant Center account information.
	 *
	 * @param int $id Optional - the Merchant Center account to retrieve
	 * @return MC_Account_Status The user's Merchant Center account.
	 * @throws Exception If the account can't be retrieved.
	 */
	public function get_accountstatus( int $id = 0 ): MC_Account_Status {
		$id = $id ?: $this->get_id();

		try {
			$mc_account_status = $this->service->accountstatuses->get( $id, $id );
		} catch ( GoogleException $e ) {
			do_action( 'gla_mc_client_exception', $e, __METHOD__ );
			throw new Exception( __( 'Unable to retrieve merchant center account status.', 'google-listings-and-ads' ), $e->getCode() );
		}
		return $mc_account_status;
	}

	/**
	 * Update the provided Merchant Center account information.
	 *
	 * @param MC_Account $mc_account The Account data to update.
	 *
	 * @return MC_Account The user's Merchant Center account.
	 * @throws Exception If the account can't be retrieved.
	 */
	public function update_account( MC_Account $mc_account ): MC_Account {
		try {
			$mc_account = $this->service->accounts->update( $mc_account->getId(), $mc_account->getId(), $mc_account );
		} catch ( GoogleException $e ) {
			do_action( 'gla_mc_client_exception', $e, __METHOD__ );
			throw new Exception( __( 'Unable to update merchant center account.', 'google-listings-and-ads' ), $e->getCode() );
		}
		return $mc_account;
	}

	/**
	 * Link a Google Ads ID to this Merchant account.
	 *
	 * @param int $ads_id Google Ads ID to link.
	 *
	 * @return bool
	 * @throws Exception When unable to retrieve or update account data.
	 */
	public function link_ads_id( int $ads_id ): bool {
		$account   = $this->get_account();
		$ads_links = $account->getAdsLinks();

		// Stop early if we already have a link setup.
		foreach ( $ads_links as $link ) {
			if ( $ads_id === absint( $link->getAdsId() ) ) {
				return false;
			}
		}

		$link = new MC_Account_Ads_Link();
		$link->setAdsId( $ads_id );
		$link->setStatus( 'active' );
		$account->setAdsLinks( array_merge( $ads_links, [ $link ] ) );
		$this->update_account( $account );

		return true;
	}

	/**
	 * Check whether the default (or provided) Merchant Center account has product/data feeds.
	 *
	 * @param int $id Optional - the MC account to check for feeds.
	 *
	 * @return bool True if the MC account has existing product feeds.
	 */
	public function has_product_feeds( int $id = 0 ): bool {
		$id    = $id ?: $this->get_id();
		$feeds = $this->service->datafeeds->listDatafeeds( $id );
		return ! empty( $feeds->getResources() );
	}
}
