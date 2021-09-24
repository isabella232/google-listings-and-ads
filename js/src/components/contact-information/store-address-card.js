/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { CardDivider } from '@wordpress/components';
import { Spinner } from '@woocommerce/components';
import { external as externalIcon, Icon, warning } from '@wordpress/icons';
import GridiconRefresh from 'gridicons/dist/refresh';
import { getPath, getQuery } from '@woocommerce/navigation';

/**
 * Internal dependencies
 */
import useStoreAddress from '.~/hooks/useStoreAddress';
import Section from '.~/wcdl/section';
import Subsection from '.~/wcdl/subsection';
import AccountCard, { APPEARANCE } from '.~/components/account-card';
import AppButton from '.~/components/app-button';
import './store-address-card.scss';

/**
 * "Edit MC store address" Tracking event
 *
 * @event gla_edit_mc_store_address
 * @type {Object} TrackingEvent
 * @property {string} path A page from which the link was clicked.
 * @property {string|undefined} [subpath] A subpage from which the link was clicked.
 */

/**
 * Renders a component with a given store address.
 *
 * @fires gla_edit_mc_store_address Whenever "Edit in Settings" is clicked.
 *
 * @return {JSX.Element} Filled AccountCard component.
 */
export default function StoreAddressCard() {
	const { loaded, data, refetch } = useStoreAddress();
	const { subpath } = getQuery();
	const editButton = (
		<AppButton
			isSecondary
			icon={ externalIcon }
			iconSize={ 16 }
			iconPosition="right"
			target="_blank"
			href="admin.php?page=wc-settings"
			text={ __( 'Edit in Settings', 'google-listings-and-ads' ) }
			eventName="gla_edit_mc_store_address"
			eventProps={ { path: getPath(), subpath } }
		/>
	);

	let addressContent;
	let description = '';

	description = __(
		'Please confirm your store address for verification.',
		'google-listings-and-ads'
	);

	if ( loaded ) {
		const { address, address2, city, state, country, postcode } = data;
		const stateAndCountry = state ? `${ state } - ${ country }` : country;

		const rest = [ city, stateAndCountry, postcode ]
			.filter( Boolean )
			.join( ', ' );

		addressContent = (
			<div>
				<div>{ address }</div>
				{ address2 && <div>{ address2 }</div> }
				<div>{ rest }</div>
			</div>
		);
	} else {
		addressContent = <Spinner />;
	}

	return (
		<AccountCard
			appearance={ APPEARANCE.ADDRESS }
			description={ description }
			indicator={ editButton }
		>
			<CardDivider />
			<Section.Card.Body>
				<Subsection.Title>
					{ __( 'Store address', 'google-listings-and-ads' ) }
					<AppButton
						className="gla-store-address__refresh-button"
						icon={ GridiconRefresh }
						iconSize={ 16 }
						onClick={ refetch }
						disabled={ ! loaded }
					/>
				</Subsection.Title>
				{ addressContent }
			</Section.Card.Body>
		</AccountCard>
	);
}

/**
 * Renders a component with a given store address.
 * In preview mode, meaning there will be no refresh button, just the edit link.
 *
 * @fires gla_edit_mc_store_address Whenever "Edit" is clicked.
 *
 * @param {Object} props React props
 * @param {string} props.href URL where Edit button should point to.
 * @param {JSX.Element} props.learnMore Link to be shown at the end of missing data message.
 * @return {JSX.Element} Filled AccountCard component.
 */
export function StoreAddressCardPreview( { href, learnMore } ) {
	const { loaded, data } = useStoreAddress();
	const { subpath } = getQuery();
	const editButton = (
		<AppButton
			isSecondary
			iconSize={ 16 }
			iconPosition="right"
			href={ href }
			text={ __( 'Edit', 'google-listings-and-ads' ) }
			eventName="gla_edit_mc_store_address"
			eventProps={ { path: getPath(), subpath } }
		/>
	);
	let description = '';
	let appearance = APPEARANCE.ADDRESS;

	if ( loaded ) {
		const {
			isAddressFilled,
			address,
			address2,
			city,
			state,
			country,
			postcode,
		} = data;
		const stateAndCountry = state ? `${ state } - ${ country }` : country;

		if ( isAddressFilled ) {
			description = [ address, address2, city, stateAndCountry, postcode ]
				.filter( Boolean )
				.join( ', ' );
		} else {
			appearance = {
				title: (
					<>
						{ /* <GridiconNotice className="gla-store-address__notice-icon" /> */ }
						<Icon
							icon={ warning }
							size={ 24 }
							className="gla-store-address__notice-icon"
						/>
						{ __(
							'Please add your store address',
							'google-listings-and-ads'
						) }
					</>
				),
			};
			description = (
				<span className="gla-store-address__notice-details">
					{ __(
						'Google requires the store address for all stores using Google Merchant Center. ',
						'google-listings-and-ads'
					) }
					{ learnMore }
				</span>
			);
		}
	} else {
		description = <span className="gla-store-address__placeholder"></span>;
	}

	return (
		<AccountCard
			appearance={ appearance }
			className="gla-store-address"
			description={ description }
			hideIcon
			indicator={ editButton }
		></AccountCard>
	);
}
