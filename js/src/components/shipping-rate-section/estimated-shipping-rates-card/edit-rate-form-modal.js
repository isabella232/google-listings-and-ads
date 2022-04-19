/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Form } from '@woocommerce/components';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import AppModal from '.~/components/app-modal';
import AppInputPriceControl from '.~/components/app-input-price-control';
import VerticalGapLayout from '.~/components/vertical-gap-layout';
import AppCountrySelect from '.~/components/app-country-select';

/**
 * @typedef { import(".~/data/actions").CountryCode } CountryCode
 * @typedef { import("./typedefs.js").ShippingRateGroup } ShippingRateGroup
 */

/**
 * Form modal to edit or delete shipping rate group.
 *
 * @param {Object} props
 * @param {boolean} [props.isEdit=false] Indicates the model is for adding or editing.
 * @param {Array<CountryCode>} props.countryOptions Array of country codes, to be used as options in AppCountrySelect.
 * @param {ShippingRateGroup} props.initialValues Initial values for the form.
 * @param {(newGroup: ShippingRateGroup) => void} props.onSubmit Called when the shipping rate group is submitted.
 * @param {() => void} [props.onDelete] Called when users clicked on the Delete button.
 * @param {() => void} props.onRequestClose Callback to close the modal.
 */
const EditRateFormModal = ( {
	isEdit = false,
	countryOptions,
	initialValues,
	onDelete = noop,
	onSubmit = noop,
	onRequestClose = noop,
} ) => {
	/**
	 * @param {ShippingRateGroup} values
	 */
	const handleValidate = ( values ) => {
		const errors = {};

		if ( values.countries.length === 0 ) {
			errors.countries = __(
				'Please specify at least one country.',
				'google-listings-and-ads'
			);
		}

		if ( values.rate < 0 ) {
			errors.rate = __(
				'The estimated shipping rate cannot be less than 0.',
				'google-listings-and-ads'
			);
		}

		return errors;
	};

	/**
	 * @param {ShippingRateGroup} newGroup
	 */
	const handleSubmitCallback = ( newGroup ) => {
		onRequestClose();
		onSubmit( newGroup );
	};

	const renderButtons = ( { isValidForm, handleSubmit } ) => {
		const buttons = [
			<Button
				key="save"
				isPrimary
				disabled={ ! isValidForm }
				onClick={ handleSubmit }
			>
				{ isEdit
					? __( 'Update shipping rate', 'google-listings-and-ads' )
					: __( 'Add shipping rate', 'google-listings-and-ads' ) }
			</Button>,
		];

		if ( isEdit ) {
			const handleDeleteClick = () => {
				onRequestClose();
				onDelete();
			};

			buttons.unshift(
				<Button
					key="delete"
					isTertiary
					isDestructive
					onClick={ handleDeleteClick }
				>
					{ __( 'Delete', 'google-listings-and-ads' ) }
				</Button>
			);
		}
		return buttons;
	};

	return (
		<Form
			initialValues={ initialValues }
			validate={ handleValidate }
			onSubmit={ handleSubmitCallback }
		>
			{ ( formProps ) => {
				const { getInputProps, values } = formProps;

				return (
					<AppModal
						title={ __(
							'Estimate a shipping rate',
							'google-listings-and-ads'
						) }
						buttons={ renderButtons( formProps ) }
						onRequestClose={ onRequestClose }
					>
						<VerticalGapLayout>
							<AppCountrySelect
								label={ __(
									'If customer is in',
									'google-listings-and-ads'
								) }
								options={ countryOptions }
								multiple
								{ ...getInputProps( 'countries' ) }
							/>
							<AppInputPriceControl
								label={ __(
									'Then the estimated shipping rate displayed in the product listing is',
									'google-listings-and-ads'
								) }
								suffix={ values.currency }
								{ ...getInputProps( 'rate' ) }
							/>
						</VerticalGapLayout>
					</AppModal>
				);
			} }
		</Form>
	);
};

export default EditRateFormModal;
