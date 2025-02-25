<?php
declare( strict_types=1 );

namespace Automattic\WooCommerce\GoogleListingsAndAds\Tests\Tools\HelperTrait;

use Automattic\WooCommerce\GoogleListingsAndAds\Vendor\GuzzleHttp\Client;
use Automattic\WooCommerce\GoogleListingsAndAds\Vendor\GuzzleHttp\Exception\BadResponseException;
use Automattic\WooCommerce\GoogleListingsAndAds\Vendor\GuzzleHttp\Exception\RequestException;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\StreamInterface;

/**
 * Trait GuzzleClient
 *
 * @property MockObject|Client $client
 *
 * @package Automattic\WooCommerce\GoogleListingsAndAds\Tests\Tools\HelperTrait
 */
trait GuzzleClientTrait {

	protected $client;

	/**
	 * Generate a mocked GuzzleClient.
	 */
	protected function guzzle_client_setup() {
		$this->client = $this->createMock( Client::class );
		$this->container->share( Client::class, $this->client );
		$this->container->share( 'connect_server_root', 'https://connect-server.test/' );
	}

	/**
	 * Generates a mocked request (default get).
	 *
	 * @param mixed  $response Response data.
	 * @param string $type     Request type get|post.
	 * @param int    $code     Status code.
	 */
	protected function generate_request_mock( $response, string $type = 'get', int $code = 200 ) {
		$body = $this->createMock( StreamInterface::class );
		$body->method( 'getContents' )->willReturn( json_encode( $response ) );

		$result = $this->createMock( ResponseInterface::class );
		$result->method( 'getBody' )->willReturn( $body );
		$result->method( 'getStatusCode' )->willReturn( $code );

		$this->client->method( $type )->willReturn( $result );
	}

	/**
	 * Generates two mocked request for when we create an account.
	 * 1. Accept TOS
	 * 3. Created account
	 *
	 * @param mixed $response
	 */
	protected function generate_create_account_mock( $response ) {
		$body = $this->createMock( StreamInterface::class );
		$body->method( 'getContents' )
			->will(
				$this->onConsecutiveCalls(
					json_encode( [ 'status' => 'accepted' ] ),
					json_encode( $response )
				)
			);

		$result = $this->createMock( ResponseInterface::class );
		$result->method( 'getBody' )->willReturn( $body );
		$result->method( 'getStatusCode' )->willReturn( 200 );

		$this->client->method( 'post' )->willReturn( $result );
	}

	/**
	 * Generates three mocked request for when we create an account.
	 * 1. Accept TOS
	 * 2. Exception with error message
	 * 3. Created account (only repeated when InvalidTerm is caught)
	 *
	 * @param string $error
	 * @param mixed  $response
	 */
	protected function generate_create_account_exception_mock( string $error, $response = false ) {
		$body = $this->createMock( StreamInterface::class );
		$body->method( 'getContents' )
			->will(
				$this->onConsecutiveCalls(
					json_encode( [ 'status' => 'accepted' ] ),
					json_encode( $response )
				)
			);

		$result = $this->createMock( ResponseInterface::class );
		$result->method( 'getBody' )->willReturn( $body );
		$result->method( 'getStatusCode' )->willReturn( 200 );

		$exception = $this->generate_exception_mock( $error, 400 );

		$this->client->method( 'post' )
			->will(
				$this->onConsecutiveCalls(
					$result,
					$this->throwException( $exception ),
					$result
				)
			);
	}

	/**
	 * Generates a mocked exception when a get_request is sent.
	 *
	 * @param string $message Error message.
	 * @param string $type    Request type get|post.
	 * @param int    $code    Status code.
	 */
	protected function generate_request_mock_exception( string $message, string $type = 'get', int $code = 400 ) {
		$request  = $this->createMock( RequestInterface::class );
		$response = $this->createMock( ResponseInterface::class );
		$response->method( 'getStatusCode' )->willReturn( $code );

		$exception = new RequestException( $message, $request, $response );
		$this->client->method( $type )->willThrowException( $exception );
	}

	/**
	 * Generates a mocked BadResponseException to be used in a response.
	 *
	 * @param string $message
	 * @param int    $code
	 */
	protected function generate_exception_mock( string $message, int $code ): BadResponseException {
		$body = $this->createMock( StreamInterface::class );
		$body->method( 'getContents' )->willReturn( json_encode( [ 'message' => $message ] ) );

		$request  = $this->createMock( RequestInterface::class );
		$response = $this->createMock( ResponseInterface::class );
		$response->method( 'getBody' )->willReturn( $body );
		$response->method( 'getStatusCode' )->willReturn( $code );

		return new BadResponseException( 'Error', $request, $response );
	}

	protected function generate_tos_accepted_mock() {
		$this->generate_request_mock(
			[ 'status' => 'accepted' ],
			'post'
		);
	}

	protected function generate_tos_failed_mock() {
		$this->generate_request_mock(
			[ 'status' => 'failed' ],
			'post',
			400
		);
	}
}
