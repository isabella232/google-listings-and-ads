/**
 * External dependencies
 */
import { useState } from '@wordpress/element';
import { recordEvent } from '@woocommerce/tracks';

/**
 * Internal dependencies
 */
import useActiveIssueType from '.~/hooks/useActiveIssueType';
import ReviewRequestModal from './review-request-modal';
import ReviewRequestNotice from './review-request-notice';
import { ISSUE_TYPE_ACCOUNT, REQUEST_REVIEW } from '.~/constants';
import REVIEW_STATUSES from './review-request-statuses';
import './index.scss';

const showNotice = ( status ) => !! REVIEW_STATUSES[ status ]?.title;

const ReviewRequest = ( { account = {} } ) => {
	const [ modalActive, setModalActive ] = useState( false );
	const activeIssueType = useActiveIssueType();
	const { data: accountData, hasFinishedResolution } = account;

	if (
		! hasFinishedResolution ||
		! showNotice( accountData.status ) ||
		activeIssueType !== ISSUE_TYPE_ACCOUNT
	) {
		return null;
	}

	const handleNoticeClick = () => {
		setModalActive( true );
		recordEvent( 'gla_modal_open', { context: REQUEST_REVIEW } );
	};

	const handleModalClose = ( action ) => {
		setModalActive( false );
		recordEvent( 'gla_modal_closed', {
			context: REQUEST_REVIEW,
			action,
		} );
	};

	const handleReviewRequest = () => {
		handleModalClose( 'confirm-request-review' );
		recordEvent( 'gla_request_review' );
		// TODO: Implement call to Review Request API
	};

	return (
		<div className="gla-review-request">
			<ReviewRequestModal
				issues={ accountData?.issues }
				isActive={ modalActive }
				onClose={ handleModalClose }
				onSendRequest={ handleReviewRequest }
			/>
			<ReviewRequestNotice
				account={ accountData }
				onRequestReviewClick={ handleNoticeClick }
			/>
		</div>
	);
};

export default ReviewRequest;
