/**
 * External dependencies
 */
import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import GridiconPlusSmall from 'gridicons/dist/plus-small';

/**
 * Internal dependencies
 */
import Section from '.~/wcdl/section';
import VerticalGapLayout from '.~/components/vertical-gap-layout';
import useStoreCurrency from '.~/hooks/useStoreCurrency';
import groupShippingRatesByMethodCurrencyRate from './groupShippingRatesByMethodCurrencyRate';
import ShippingRateInputControl from './shipping-rate-input-control';
import EditRateFormModal from './edit-rate-form-modal';
import { SHIPPING_RATE_METHOD } from '.~/constants';
import isNonFreeFlatShippingRate from '.~/utils/isNonFreeFlatShippingRate';

/**
 * @typedef { import(".~/data/actions").ShippingRate } ShippingRate
 * @typedef { import(".~/data/actions").CountryCode } CountryCode
 * @typedef { import("./typedefs").ShippingRateGroup } ShippingRateGroup
 */

const defaultShippingRate = {
	method: SHIPPING_RATE_METHOD.FLAT_RATE,
	options: {},
};

/**
 * Partial form to provide shipping rates for individual countries,
 * with an UI, that allows to aggregate countries with the same rate.
 *
 * @param {Object} props
 * @param {Array<ShippingRate>} props.value Array of individual shipping rates to be used as the initial values of the form.
 * @param {Array<CountryCode>} props.audienceCountries Array of country codes of all audience countries.
 * @param {(newValue: Array<ShippingRate>) => void} props.onChange Callback called with new data once shipping rates are changed.
 */
export default function EstimatedShippingRatesCard( {
	audienceCountries,
	value,
	onChange,
} ) {
	const { code: currencyCode } = useStoreCurrency();
	const [ modalProps, setModalProps ] = useState( null );

	/**
	 * Get the `onChange` event handler for shipping rate group.
	 *
	 * @param {ShippingRateGroup} oldGroup Old shipping rate group.
	 */
	const getChangeHandler = ( oldGroup ) => {
		/**
		 * @param {ShippingRateGroup} newGroup New shipping rate group from `onChange` event.
		 */
		const handleChange = ( newGroup ) => {
			/*
			 * Create new shipping rates value by filtering out deleted countries first.
			 *
			 * A country is deleted when it exists in `oldGroup` and not exists in `newGroup`.
			 */
			const newValue = value.filter( ( shippingRate ) => {
				const isDeleted =
					oldGroup.countries.includes( shippingRate.country ) &&
					! newGroup.countries.includes( shippingRate.country );
				return ! isDeleted;
			} );

			/*
			 * Upsert shipping rates in `newValue` by looping through `newGroup.countries`.
			 */
			newGroup.countries.forEach( ( country ) => {
				const existingIndex = newValue.findIndex(
					( shippingRate ) => shippingRate.country === country
				);
				const oldShippingRate = newValue[ existingIndex ];
				const newShippingRate = {
					...defaultShippingRate,
					...oldShippingRate,
					country,
					method: newGroup.method,
					currency: newGroup.currency,
					rate: newGroup.rate,
				};

				/*
				 * If the shipping rate is free,
				 * we remove the free_shipping_threshold.
				 */
				if ( ! isNonFreeFlatShippingRate( newShippingRate ) ) {
					newShippingRate.options.free_shipping_threshold = undefined;
				}

				if ( existingIndex >= 0 ) {
					newValue[ existingIndex ] = newShippingRate;
				} else {
					newValue.push( newShippingRate );
				}
			} );

			onChange( newValue );
		};

		return handleChange;
	};

	/**
	 * Get the `onDelete` event handler for shipping rate group.
	 *
	 * @param {ShippingRateGroup} oldGroup Shipping rate group.
	 */
	const getDeleteHandler = ( oldGroup ) => () => {
		const newValue = value.filter(
			( shippingRate ) =>
				! oldGroup.countries.includes( shippingRate.country )
		);
		onChange( newValue );
	};

	/**
	 * Function to render the groups.
	 *
	 * If there is no group, we render a `ShippingRateInputControl`
	 * with a pre-filled group, so that users can straight away
	 * key in shipping rate for all countries immediately.
	 *
	 * If there are groups, we render `ShippingRateInputControl` for each group,
	 * and render an "Add rate button" if there are remaining countries.
	 */
	const renderGroups = () => {
		const groups = groupShippingRatesByMethodCurrencyRate( value );

		/**
		 * The remaining countries that do not have a shipping rate value yet.
		 */
		const remainingCountries = audienceCountries.filter( ( country ) => {
			const exist = value.some(
				( shippingRate ) =>
					shippingRate.country === country &&
					shippingRate.method === SHIPPING_RATE_METHOD.FLAT_RATE
			);

			return ! exist;
		} );

		let shouldRenderRemaining = remainingCountries.length >= 1;

		if ( groups.length === 0 ) {
			groups.push( {
				countries: audienceCountries,
				method: SHIPPING_RATE_METHOD.FLAT_RATE,
				currency: currencyCode,
				rate: undefined,
			} );

			if ( shouldRenderRemaining ) {
				shouldRenderRemaining = false;
			}
		}

		return (
			<>
				{ groups.map( ( group ) => {
					return (
						<ShippingRateInputControl
							key={ group.countries.join( '-' ) }
							countryOptions={ audienceCountries }
							value={ group }
							onChange={ getChangeHandler( group ) }
							onEditClick={ () => {
								setModalProps( {
									isEdit: true,
									countryOptions: audienceCountries,
									initialValues: group,
									onSubmit: getChangeHandler( group ),
									onDelete: getDeleteHandler( group ),
								} );
							} }
						/>
					);
				} ) }
				{ shouldRenderRemaining && (
					<div>
						<Button
							isSecondary
							icon={ <GridiconPlusSmall /> }
							onClick={ () => {
								const group = {
									countries: remainingCountries,
									method: SHIPPING_RATE_METHOD.FLAT_RATE,
									currency: currencyCode,
									rate: 0,
								};
								setModalProps( {
									countryOptions: remainingCountries,
									initialValues: group,
									onSubmit: getChangeHandler( {
										...group,
										countries: [],
									} ),
								} );
							} }
						>
							{ __(
								'Add another rate',
								'google-listings-and-ads'
							) }
						</Button>
					</div>
				) }
			</>
		);
	};

	return (
		<Section.Card>
			<Section.Card.Body>
				{ modalProps && (
					<EditRateFormModal
						{ ...modalProps }
						onRequestClose={ () => setModalProps( null ) }
					/>
				) }
				<Section.Card.Title>
					{ __(
						'Estimated shipping rates',
						'google-listings-and-ads'
					) }
				</Section.Card.Title>
				<VerticalGapLayout size="large">
					{ renderGroups() }
				</VerticalGapLayout>
			</Section.Card.Body>
		</Section.Card>
	);
}
