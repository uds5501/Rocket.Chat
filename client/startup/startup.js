import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { TimeSync } from 'meteor/mizzao:timesync';
import { UserPresence } from 'meteor/konecty:user-presence';
import { Accounts } from 'meteor/accounts-base';
import toastr from 'toastr';
import s from 'underscore.string';

import { t, getUserPreference } from '../../app/utils/client';
import { chatMessages } from '../../app/ui';
import { Layout, modal, popover, fireGlobalEvent, RoomManager } from '../../app/ui-utils';
import { toolbarSearch } from '../../app/ui-sidenav';
import { ChatSubscription } from '../../app/models';
import hljs from '../../app/markdown/lib/hljs';
import 'highlight.js/styles/github.css';
import { syncUserdata } from '../lib/userData';

hljs.initHighlightingOnLoad();

if (window.DISABLE_ANIMATION) {
	toastr.options.timeOut = 1;
	toastr.options.showDuration = 0;
	toastr.options.hideDuration = 0;
	toastr.options.extendedTimeOut = 0;
}

Meteor.startup(function() {
	Accounts.onLogout(() => Session.set('openedRoom', null));

	TimeSync.loggingEnabled = false;

	Session.setDefault('AvatarRandom', 0);

	window.lastMessageWindow = {};
	window.lastMessageWindowHistory = {};

	let status = undefined;
	Tracker.autorun(async function() {
		const uid = Meteor.userId();
		if (!uid) {
			return;
		}
		if (!Meteor.status().connected) {
			return;
		}

		const user = await syncUserdata(uid);
		if (!user) {
			return;
		}

		if (getUserPreference(user, 'enableAutoAway')) {
			const idleTimeLimit = getUserPreference(user, 'idleTimeLimit') || 300;
			UserPresence.awayTime = idleTimeLimit * 1000;
		} else {
			delete UserPresence.awayTime;
			UserPresence.stopTimer();
		}

		UserPresence.start();

		if (user.status !== status) {
			status = user.status;
			fireGlobalEvent('status-changed', status);
		}
	});
});

Meteor.startup(() => {
	$(document.body).on('keydown', function(e) {
		if ((e.keyCode === 80 || e.keyCode === 75) && (e.ctrlKey === true || e.metaKey === true) && e.shiftKey === false) {
			e.preventDefault();
			e.stopPropagation();
			toolbarSearch.show(true);
		}
		const unread = Session.get('unread');
		if (e.keyCode === 27 && (e.shiftKey === true || e.ctrlKey === true) && unread && unread !== '') {
			e.preventDefault();
			e.stopPropagation();
			modal.open({
				title: t('Clear_all_unreads_question'),
				type: 'warning',
				confirmButtonText: t('Yes_clear_all'),
				showCancelButton: true,
				cancelButtonText: t('Cancel'),
				confirmButtonColor: '#DD6B55',
			}, function() {
				const subscriptions = ChatSubscription.find({
					open: true,
				}, {
					fields: {
						unread: 1,
						alert: 1,
						rid: 1,
						t: 1,
						name: 1,
						ls: 1,
					},
				});

				subscriptions.forEach((subscription) => {
					if (subscription.alert || subscription.unread > 0) {
						Meteor.call('readMessages', subscription.rid);
					}
				});
			});
		}
	});

	$(document.body).on('keydown', function(e) {
		const { target } = e;
		if (e.ctrlKey === true || e.metaKey === true) {
			popover.close();
			return;
		}
		if (!((e.keyCode > 45 && e.keyCode < 91) || e.keyCode === 8)) {
			return;
		}

		if (/input|textarea|select/i.test(target.tagName)) {
			return;
		}
		if (target.id === 'pswp') {
			return;
		}

		popover.close();

		if (document.querySelector('.rc-modal-wrapper dialog[open]')) {
			return;
		}

		const inputMessage = chatMessages[RoomManager.openedRoom] && chatMessages[RoomManager.openedRoom].input;
		if (!inputMessage) {
			return;
		}
		inputMessage.focus();
	});

	const handleMessageLinkClick = (event) => {
		const link = event.currentTarget;
		if (link.origin === s.rtrim(Meteor.absoluteUrl(), '/') && /msg=([a-zA-Z0-9]+)/.test(link.search)) {
			fireGlobalEvent('click-message-link', { link: link.pathname + link.search });
		}
	};

	Tracker.autorun(() => {
		if (Layout.isEmbedded()) {
			$(document.body).on('click', 'a', handleMessageLinkClick);
		} else {
			$(document.body).off('click', 'a', handleMessageLinkClick);
		}
	});
});

Meteor.startup(function() {
	return fireGlobalEvent('startup', true);
});
