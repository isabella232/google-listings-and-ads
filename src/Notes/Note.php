<?php
declare( strict_types=1 );

namespace Automattic\WooCommerce\GoogleListingsAndAds\Notes;

use Automattic\WooCommerce\Admin\Notes\DataStore;
use Automattic\WooCommerce\Admin\Notes\Notes;
use Automattic\WooCommerce\GoogleListingsAndAds\Infrastructure\Deactivateable;
use Automattic\WooCommerce\GoogleListingsAndAds\Infrastructure\Registerable;
use Automattic\WooCommerce\GoogleListingsAndAds\Infrastructure\Service;
use WC_Data_Store;

defined( 'ABSPATH' ) || exit;

/**
 * Note base class.
 *
 * @since x.x.x
 *
 * @package Automattic\WooCommerce\GoogleListingsAndAds\Notes
 */
abstract class Note implements Service, Registerable, Deactivateable {

	/**
	 * Get the note's unique name.
	 *
	 * @return string
	 */
	abstract protected function get_note_name(): string;

	/**
	 * Possibly add the note
	 */
	abstract public function possibly_add_note(): void;

	/**
	 * Register a service.
	 */
	public function register(): void {
		add_action(
			'admin_init',
			function() {
				$this->possibly_add_note();
			}
		);
	}

	/**
	 * Deactivate the service.
	 */
	public function deactivate(): void {
		if ( ! class_exists( Notes::class ) ) {
			return;
		}

		Notes::delete_notes_with_name( $this->get_note_name() );
	}

	/**
	 * Get note data store.
	 *
	 * @return DataStore
	 */
	protected function get_data_store(): DataStore {
		return WC_Data_Store::load( 'admin-note' );
	}

	/**
	 * Check if the note has already been added.
	 *
	 * @return bool
	 */
	protected function has_been_added(): bool {
		$note_ids = $this->get_data_store()->get_notes_with_name( $this->get_note_name() );

		return ! empty( $note_ids );
	}

}
