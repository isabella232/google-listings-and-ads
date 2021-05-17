<?php
declare( strict_types=1 );

namespace Automattic\WooCommerce\GoogleListingsAndAds\API\Site\Controllers\MerchantCenter;

use Automattic\WooCommerce\GoogleListingsAndAds\API\Site\Controllers\BaseOptionsController;
use Automattic\WooCommerce\GoogleListingsAndAds\API\TransportMethods;
use Automattic\WooCommerce\GoogleListingsAndAds\MerchantCenter\MerchantStatuses;
use WP_REST_Response as Response;
use WP_REST_Request as Request;
use Automattic\WooCommerce\GoogleListingsAndAds\Proxies\RESTServer;
use Exception;

defined( 'ABSPATH' ) || exit;

/**
 * Class ProductStatisticsController
 *
 * @package Automattic\WooCommerce\GoogleListingsAndAds\API\Site\Controllers\MerchantCenter
 */
class ProductStatisticsController extends BaseOptionsController {

	/**
	 * The MerchantProducts object.
	 *
	 * @var MerchantStatuses
	 */
	protected $merchant_statuses;


	/**
	 * ProductStatisticsController constructor.
	 *
	 * @param RESTServer       $server
	 * @param MerchantStatuses $merchant_statuses
	 */
	public function __construct( RESTServer $server, MerchantStatuses $merchant_statuses ) {
		parent::__construct( $server );
		$this->merchant_statuses = $merchant_statuses;
	}

	/**
	 * Register rest routes with WordPress.
	 */
	public function register_routes(): void {
		$this->register_route(
			'mc/product-statistics',
			[
				[
					'methods'             => TransportMethods::READABLE,
					'callback'            => $this->get_product_statistics_read_callback(),
					'permission_callback' => $this->get_permission_callback(),
				],
				'schema' => $this->get_api_response_schema_callback(),
			],
		);
		$this->register_route(
			'mc/product-statistics/refresh',
			[
				[
					'methods'             => TransportMethods::READABLE,
					'callback'            => $this->get_product_statistics_refresh_callback(),
					'permission_callback' => $this->get_permission_callback(),
				],
				'schema' => $this->get_api_response_schema_callback(),
			],
		);
	}

	/**
	 * Get the callback function for returning product statistics.
	 *
	 * @return callable
	 */
	protected function get_product_statistics_read_callback(): callable {
		return function( Request $request ) {
			return $this->get_product_status_stats( $request );
		};
	}
	/**
	 * Get the callback function for getting re-calculated product statistics.
	 *
	 * @return callable
	 */
	protected function get_product_statistics_refresh_callback(): callable {
		return function( Request $request ) {
			return $this->get_product_status_stats( $request, true );
		};
	}

	/**
	 * Get the overall product status statistics array.
	 *
	 * @param Request $request
	 * @param bool    $force_refresh True to force a refresh of the product status statistics.
	 *
	 * @return Response
	 */
	protected function get_product_status_stats( Request $request, bool $force_refresh = false ): Response {
		try {
			return $this->prepare_item_for_response(
				$this->merchant_statuses->get_product_statistics( $force_refresh ),
				$request
			);
		} catch ( Exception $e ) {
			return new Response( [ 'message' => $e->getMessage() ], $e->getCode() ?: 400 );
		}
	}

	/**
	 * Get the item schema properties for the controller.
	 *
	 * @return array
	 */
	protected function get_schema_properties(): array {
		return [
			'timestamp'  => [
				'type'        => 'number',
				'description' => __( 'Timestamp reflecting when the product status statistics were last generated.', 'google-listings-and-ads' ),
				'context'     => [ 'view' ],
				'readonly'    => true,
			],
			'statistics' => [
				'type'        => 'object',
				'description' => __( 'Merchant Center product status statistics.', 'google-listings-and-ads' ),
				'context'     => [ 'view' ],
				'readonly'    => true,
				'properties'  => [
					'active'      => [
						'type'        => 'integer',
						'description' => __( 'Active products.', 'google-listings-and-ads' ),
						'context'     => [ 'view' ],
					],
					'expiring'    => [
						'type'        => 'integer',
						'description' => __( 'Expiring products.', 'google-listings-and-ads' ),
						'context'     => [ 'view' ],
					],
					'pending'     => [
						'type'        => 'number',
						'description' => __( 'Pending products.', 'google-listings-and-ads' ),
						'context'     => [ 'view' ],
					],
					'disapproved' => [
						'type'        => 'number',
						'description' => __( 'Disapproved products.', 'google-listings-and-ads' ),
						'context'     => [ 'view' ],
					],
					'not_synced'  => [
						'type'        => 'number',
						'description' => __( 'Products not uploaded.', 'google-listings-and-ads' ),
						'context'     => [ 'view' ],
					],
				],
			],
		];
	}

	/**
	 * Get the item schema name for the controller.
	 *
	 * Used for building the API response schema.
	 *
	 * @return string
	 */
	protected function get_schema_title(): string {
		return 'product_statistics';
	}
}
