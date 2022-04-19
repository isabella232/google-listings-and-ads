/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Pill } from '@woocommerce/components';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import AppButton from '.~/components/app-button';
import AppInputPriceControl from '.~/components/app-input-price-control';
import './shipping-rate-input-control.scss';
import ShippingRateInputControlLabelText from './shipping-rate-input-control-label-text';

/**
 * @typedef { import("./typedefs").ShippingRateGroup } ShippingRateGroup
 * @typedef { import(".~/data/actions").CountryCode } CountryCode
 */

/**
 * Input control to edit a shipping rate group.
 * Consists of a simple input field to adjust the rate
 * and with a modal with a more advanced form to select countries.
 *
 * @param {Object} props
 * @param {ShippingRateGroup} props.value Aggregate, rat: Array object to be used as the initial value.
 * @param {(newGroup: ShippingRateGroup) => void} props.onChange Called when shipping rate group changes.
 * @param {() => void} props.onEditClick Called when users clicked on the "Edit" text.
 */
const ShippingRateInputControl = ( {
	value,
	onChange = noop,
	onEditClick,
} ) => {
	const { countries, currency, rate } = value;

	const handleBlur = ( event, numberValue ) => {
		if ( rate === numberValue ) {
			return;
		}

		onChange( {
			...value,
			rate: numberValue,
		} );
	};

	return (
		<div className="gla-shipping-rate-input-control">
			<AppInputPriceControl
				label={
					<div className="label">
						<ShippingRateInputControlLabelText
							countries={ countries }
						/>
						<AppButton
							className="gla-shipping-rate-input-control__edit-button"
							isTertiary
							onClick={ onEditClick }
						>
							{ __( 'Edit', 'google-listings-and-ads' ) }
						</AppButton>
					</div>
				}
				suffix={ currency }
				value={ rate }
				onBlur={ handleBlur }
			/>
			{ rate === 0 && (
				<div className="gla-input-pill-div">
					<Pill>
						{ __(
							'Free shipping for all orders',
							'google-listings-and-ads'
						) }
					</Pill>
				</div>
			) }
		</div>
	);
};

export default ShippingRateInputControl;
