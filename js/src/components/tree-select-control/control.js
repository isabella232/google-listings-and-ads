/**
 * External dependencies
 */
import classnames from 'classnames';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Tags from './tags';
import { BACKSPACE } from './constants';

/**
 * The Control Component renders a search input and also the Tags.
 * It also triggers the setExpand for expanding the options tree on click.
 *
 * @param {Object} props Component props
 * @param {Array} props.tags Array of tags
 * @param {string} props.instanceId Id of the component
 * @param {string} props.placeholder Placeholder of the search input
 * @param {boolean} props.isExpanded True if the tree is expanded
 * @param {boolean} props.disabled True if the component is disabled
 * @param {number} props.maxVisibleTags The maximum number of tags to show. Undefined, 0 or less than 0 evaluates to "Show All".
 * @param {Function} props.onFocus On Focus Callback
 * @param {Function} props.onTagsChange Callback when the Tags change
 * @param {Function} props.onInputChange Callback when the Input value changes
 * @return {JSX.Element} The rendered component
 */
const Control = ( {
	tags = [],
	instanceId,
	placeholder,
	isExpanded,
	disabled,
	maxVisibleTags,
	onFocus = () => {},
	onTagsChange = () => {},
	onInputChange = () => {},
} ) => {
	const hasTags = tags.length > 0;
	const showPlaceholder = ! hasTags && ! isExpanded;
	const inputRef = useRef();

	const handleKeydown = ( event ) => {
		if ( BACKSPACE === event.key ) {
			if ( inputRef.current.value ) return;
			onTagsChange( tags.slice( 0, -1 ) );
			event.preventDefault();
		}
	};

	return (
		/**
		 * ESLint Disable reason
		 * https://github.com/woocommerce/woocommerce-admin/blob/main/packages/components/src/select-control/control.js#L200
		 */
		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
		<div
			className={ classnames(
				'components-base-control',
				'woocommerce-tree-select-control__control',
				{
					'is-disabled': disabled,
					'has-tags': hasTags,
				}
			) }
			onClick={ () => {
				inputRef.current.focus();
			} }
		>
			{ hasTags && (
				<Tags
					disabled={ disabled }
					tags={ tags }
					maxVisibleTags={ maxVisibleTags }
					onChange={ onTagsChange }
				/>
			) }

			<div className="components-base-control__field">
				<input
					ref={ inputRef }
					id={ `woocommerce-tree-select-control-${ instanceId }__control-input` }
					type="search"
					placeholder={ showPlaceholder ? placeholder : '' }
					autoComplete="off"
					className="woocommerce-tree-select-control__control-input"
					role="combobox"
					aria-autocomplete="list"
					aria-expanded={ isExpanded }
					disabled={ disabled }
					onFocus={ onFocus }
					onChange={ onInputChange }
					onKeyDown={ handleKeydown }
				/>
			</div>
		</div>
	);
};

export default Control;
