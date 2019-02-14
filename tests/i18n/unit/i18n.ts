import has from '../../../src/has/has';
import global from '../../../src/shim/global';
const { registerSuite } = intern.getInterface('object');
const { assert } = intern.getPlugin('chai');
import * as sinon from 'sinon';
import i18n, {
	formatMessage,
	getCachedMessages,
	getMessageFormatter,
	invalidate,
	Messages,
	observeLocale,
	setLocaleMessages,
	switchLocale,
	systemLocale,
	useDefault
} from '../../../src/i18n/i18n';
import bundle from '../support/mocks/common/main';
import partyBundle from '../support/mocks/common/party';

registerSuite('i18n', {
	afterEach() {
		invalidate();
		switchLocale(systemLocale);
	},

	tests: {
		systemLocale() {
			let expected = 'en';

			if (has('host-browser')) {
				const navigator = global.navigator;
				expected = navigator.language || navigator.userLanguage;
			} else if (has('host-node')) {
				expected = process.env.LANG || expected;
			}

			assert.strictEqual(systemLocale, expected.replace(/^([^.]+).*/, '$1').replace(/_/g, '-'));
		},

		formatMessage: {
			'without a locale': {
				'assert message string'() {
					return i18n(partyBundle).then((messages) => {
						let formatted = formatMessage(messages.guestInfo, {
							host: 'Nita',
							guestCount: 0
						});
						assert.strictEqual(formatted, 'Nita does not host a party.');

						formatted = formatMessage(messages.guestInfo, {
							host: 'Nita',
							gender: 'female',
							guestCount: 1,
							guest: 'Bryan'
						});
						assert.strictEqual(formatted, 'Nita invites Bryan to her party.');

						formatted = formatMessage(messages.guestInfo, {
							host: 'Nita',
							gender: 'female',
							guestCount: 2,
							guest: 'Bryan'
						});
						assert.strictEqual(formatted, 'Nita invites Bryan and one other person to her party.');

						formatted = formatMessage(messages.guestInfo, {
							host: 'Nita',
							gender: 'female',
							guestCount: 42,
							guest: 'Bryan'
						});
						assert.strictEqual(formatted, 'Nita invites Bryan and 41 other people to her party.');

						formatted = formatMessage('');
						assert.strictEqual(formatted, '');
					});
				},

				'assert message bundle'() {
					return i18n(partyBundle).then(() => {
						let formatted = formatMessage(partyBundle, 'guestInfo', {
							host: 'Nita',
							guestCount: 0
						});
						assert.strictEqual(formatted, 'Nita does not host a party.');

						formatted = formatMessage(partyBundle, 'guestInfo', {
							host: 'Nita',
							gender: 'female',
							guestCount: 1,
							guest: 'Bryan'
						});
						assert.strictEqual(formatted, 'Nita invites Bryan to her party.');

						formatted = formatMessage(partyBundle, 'guestInfo', {
							host: 'Nita',
							gender: 'female',
							guestCount: 2,
							guest: 'Bryan'
						});
						assert.strictEqual(formatted, 'Nita invites Bryan and one other person to her party.');

						formatted = formatMessage(partyBundle, 'guestInfo', {
							host: 'Nita',
							gender: 'female',
							guestCount: 42,
							guest: 'Bryan'
						});
						assert.strictEqual(formatted, 'Nita invites Bryan and 41 other people to her party.');

						formatted = formatMessage(partyBundle, 'non-existent');
						assert.strictEqual(formatted, '');
					});
				}
			},

			'with a supported locale': {
				'assert message string'() {
					return i18n(bundle, 'ar').then((messages) => {
						assert.strictEqual(formatMessage(messages.hello, {}, 'ar'), 'السلام عليكم');
					});
				},

				'assert message bundle'() {
					return i18n(bundle, 'ar').then(() => {
						assert.strictEqual(formatMessage(bundle, 'hello', {}, 'ar'), 'السلام عليكم');
					});
				}
			},

			'with an unsupported locale': {
				'assert message string'() {
					return i18n(bundle, 'fr').then((messages) => {
						assert.strictEqual(formatMessage(messages.hello, {}, 'fr'), 'Hello');
					});
				},

				'assert message bundle'() {
					return i18n(bundle, 'fr').then(() => {
						assert.strictEqual(formatMessage(bundle, 'hello', {}, 'fr'), 'Hello');
					});
				}
			}
		},

		getCachedMessages: {
			'assert unregistered locale'() {
				assert.isUndefined(getCachedMessages(bundle, 'ar'));
			},

			'assert supported locale'() {
				return i18n(bundle, 'ar').then(() => {
					assert.deepEqual(
						getCachedMessages(bundle, 'ar'),
						{
							hello: 'السلام عليكم',
							helloReply: 'و عليكم السام',
							goodbye: 'مع السلامة'
						},
						'Locale messages can be retrieved with a bundle object.'
					);
				});
			},

			'assert unsupported locale'(this: any) {
				const cached = getCachedMessages(bundle, 'un-SU-pported');
				assert.deepEqual(cached, bundle.messages, 'Default messages returned for unsupported locale.');
			},

			'assert unsupported locale added with `setLocaleMessages`'() {
				const messages = { hello: 'Oy' };
				setLocaleMessages(bundle, messages, 'en-GB');

				const cached = getCachedMessages(bundle, 'en-GB');
				assert.deepEqual(
					cached,
					{ ...bundle.messages, ...messages },
					'Messages added with `setLocaleMessages` are returned.'
				);
			},

			'assert most specific supported locale returned'() {
				return i18n(bundle, 'ar').then(() => {
					const cached = getCachedMessages(bundle, 'ar');
					assert.deepEqual(
						getCachedMessages(bundle, 'ar-IR'),
						cached,
						'Messages are returned for the most specific supported locale.'
					);
				});
			}
		},

		getMessageFormatter: {
			'without a locale': {
				'assert message string'() {
					return i18n(partyBundle).then((messages) => {
						const formatter = getMessageFormatter(messages.guestInfo);
						let formatted = formatter({
							host: 'Nita',
							guestCount: 0
						});
						assert.strictEqual(formatted, 'Nita does not host a party.');

						formatted = formatter({
							host: 'Nita',
							gender: 'female',
							guestCount: 1,
							guest: 'Bryan'
						});
						assert.strictEqual(formatted, 'Nita invites Bryan to her party.');

						formatted = formatter({
							host: 'Nita',
							gender: 'female',
							guestCount: 2,
							guest: 'Bryan'
						});
						assert.strictEqual(formatted, 'Nita invites Bryan and one other person to her party.');

						formatted = formatter({
							host: 'Nita',
							gender: 'female',
							guestCount: 42,
							guest: 'Bryan'
						});
						assert.strictEqual(formatted, 'Nita invites Bryan and 41 other people to her party.');

						assert.strictEqual(getMessageFormatter('')(), '');
					});
				},

				'assert message bundle'() {
					return i18n(partyBundle).then(() => {
						const formatter = getMessageFormatter(partyBundle, 'guestInfo');
						let formatted = formatter({
							host: 'Nita',
							guestCount: 0
						});
						assert.strictEqual(formatted, 'Nita does not host a party.');

						formatted = formatter({
							host: 'Nita',
							gender: 'female',
							guestCount: 1,
							guest: 'Bryan'
						});
						assert.strictEqual(formatted, 'Nita invites Bryan to her party.');

						formatted = formatter({
							host: 'Nita',
							gender: 'female',
							guestCount: 2,
							guest: 'Bryan'
						});
						assert.strictEqual(formatted, 'Nita invites Bryan and one other person to her party.');

						formatted = formatter({
							host: 'Nita',
							gender: 'female',
							guestCount: 42,
							guest: 'Bryan'
						});
						assert.strictEqual(formatted, 'Nita invites Bryan and 41 other people to her party.');

						assert.strictEqual(getMessageFormatter(partyBundle, 'non-existent')(), '');
					});
				}
			},

			'with a supported locale': {
				'assert message string'() {
					return i18n(bundle, 'ar').then((messages) => {
						const formatter = getMessageFormatter(messages.hello, 'ar');
						assert.strictEqual(formatter(), 'السلام عليكم');
					});
				},

				'assert message bundle'() {
					return i18n(bundle, 'ar').then(() => {
						const formatter = getMessageFormatter(bundle, 'hello', 'ar');
						assert.strictEqual(formatter(), 'السلام عليكم');
					});
				}
			},

			'with an unsupported locale': {
				'assert message string'() {
					return i18n(bundle, 'fr').then((messages) => {
						const formatter = getMessageFormatter(messages.hello, 'fr');
						assert.strictEqual(formatter(), 'Hello');
					});
				},

				'assert message bundle'() {
					return i18n(bundle, 'fr').then(() => {
						const formatter = getMessageFormatter(bundle, 'hello', 'fr');
						assert.strictEqual(formatter(), 'Hello');
					});
				}
			}
		},

		i18n: {
			'assert system locale used as default'() {
				return i18n(bundle).then(function(messages: Messages) {
					assert.deepEqual(messages, {
						hello: 'Hello',
						helloReply: 'Hello',
						goodbye: 'Goodbye'
					});
				});
			},

			'assert with string locale'() {
				return i18n(bundle, 'ar').then(function(messages: Messages) {
					assert.deepEqual(
						messages,
						{
							hello: 'السلام عليكم',
							helloReply: 'و عليكم السام',
							goodbye: 'مع السلامة'
						},
						'Locale dictionary is used.'
					);
				});
			},

			'assert with nested locale'() {
				return i18n(bundle, 'ar-JO').then(function(messages: Messages) {
					// ar-JO is missing "goodbye" key
					assert.deepEqual(
						messages,
						{
							hello: 'مرحبا',
							helloReply: 'مرحبتين',
							goodbye: 'مع السلامة'
						},
						'Most specific dictionary is used with fallbacks provided.'
					);
				});
			},

			'assert with invalid locale'() {
				return i18n(bundle, 'ar-JO-').then(function(messages: Messages) {
					assert.deepEqual(
						messages,
						{
							hello: 'مرحبا',
							helloReply: 'مرحبتين',
							goodbye: 'مع السلامة'
						},
						'Only non-empty locale segments are considered.'
					);
				});
			},

			'assert unsupported locale'() {
				return i18n(bundle, 'fr-CA').then(function(messages: Messages) {
					assert.deepEqual(messages, {
						hello: 'Hello',
						helloReply: 'Hello',
						goodbye: 'Goodbye'
					});
				});
			},

			'assert bundle without locales'() {
				const { messages } = bundle;
				const localeless = { messages };

				return i18n(localeless, 'ar').then(function(messages: Messages) {
					assert.deepEqual(
						messages,
						{
							hello: 'Hello',
							helloReply: 'Hello',
							goodbye: 'Goodbye'
						},
						'Default messages returned when bundle provides no locales.'
					);
				});
			},

			'assert messages cached'() {
				return i18n(bundle, 'ar-JO')
					.then(function() {
						return i18n(bundle, 'ar-JO');
					})
					.then((messages: Messages) => {
						const cached = getCachedMessages(bundle, 'ar-JO');

						assert.strictEqual(cached, messages as any, 'Message dictionaries are cached.');
					});
			},

			'assert message dictionaries are frozen'() {
				return i18n(bundle, 'ar-JO').then(function() {
					const cached = getCachedMessages(bundle, 'ar-JO');

					assert.throws(() => {
						cached!.hello = 'Hello';
					});
				});
			}
		},

		invalidate: {
			'assert with a bundle'() {
				return i18n(bundle, 'ar').then((messages: Messages) => {
					invalidate(bundle);
					assert.isUndefined(
						getCachedMessages(bundle, 'ar'),
						'The cache is invalidated for the specified bundle.'
					);
				});
			},

			'assert without a bundle'() {
				return i18n(bundle, 'ar').then((messages: Messages) => {
					invalidate();
					assert.isUndefined(getCachedMessages(bundle, 'ar'), 'The cache is invalidated for all bundles.');
				});
			}
		},

		observeLocale: {
			'assert observer notified of locale change'() {
				const next = sinon.spy();
				const handle = observeLocale(next);

				switchLocale('ar');
				handle.destroy();

				assert.isTrue(next.calledWith('ar'), '`observer.next` called with new locale.');
			}
		},

		setLocaleMessages() {
			const french = { hello: 'Bonjour', goodbye: 'Au revoir' };
			const czech = { hello: 'Ahoj', goodbye: 'Ahoj' };

			setLocaleMessages(bundle, french, 'fr');
			setLocaleMessages(bundle, czech, 'cz');

			assert.deepEqual(
				getCachedMessages(bundle, 'fr'),
				{ ...french, helloReply: 'Hello' },
				'Default messages should be included where not overridden'
			);
			assert.deepEqual(
				getCachedMessages(bundle, 'cz'),
				{ ...czech, helloReply: 'Hello' },
				'Default messages should be included where not overridden'
			);
		},

		switchLocale: {
			'assert root locale updated'() {
				switchLocale('en');
				switchLocale('ar');

				assert.strictEqual(i18n.locale, 'ar');
			},

			'assert observers not updated when locale remains the same'() {
				const next = sinon.spy();
				observeLocale(next);

				switchLocale('ar');
				switchLocale('ar');

				assert.isFalse(next.calledTwice);
			}
		},

		locale: {
			'assert defaults to system locale'() {
				assert.strictEqual(i18n.locale, systemLocale, '`i18n.locale` defaults to the system locale.');
			},

			'assert reflects current locale'() {
				switchLocale('fr');
				assert.strictEqual(i18n.locale, 'fr', '`i18n.locale` is the current locale.');
			}
		},

		useDefault: {
			'single es6 module'() {
				assert.strictEqual(
					useDefault({
						__esModule: true,
						default: 42
					}),
					42,
					'The default export should be returned.'
				);
			},

			'single non-es6 module'() {
				const module = { value: 42 };
				assert.deepEqual(useDefault(module), module, 'The module itself should be returned.');
			},

			'all es6 modules'() {
				const modules = [42, 43].map((value: number) => {
					return { __esModule: true, default: value };
				});
				assert.sameMembers(
					useDefault(modules),
					[42, 43],
					'The default export should be returned for all modules.'
				);
			},

			'mixed module types'() {
				const modules: any[] = [42, 43].map((value: number) => {
					return { __esModule: true, default: value };
				});
				modules.push({ value: 44 });
				assert.sameDeepMembers(useDefault(modules), [42, 43, { value: 44 }]);
			}
		}
	}
});
