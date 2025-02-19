import {container} from '@teqfw/test';
import assert from 'assert';

// GET OBJECTS FROM CONTAINER
/** @type {Fl64_Web_Session_Back_Store_Mem_RedirectUrl} */
const redirectUrlStore = await container.get('Fl64_Web_Session_Back_Store_Mem_RedirectUrl$');

/** @type {TeqFw_Core_Shared_Api_Logger} */
const logger = await container.get('TeqFw_Core_Shared_Api_Logger$');

describe('Fl64_Web_Session_Back_Store_Mem_RedirectUrl', () => {
    const key = 'sessionKey';
    const redirectUrl = 'https://example.com';
    const expiresAt = Date.now() + 3600 * 1000; // 1 hour from now

    it('should store a redirect URL with an expiration time', () => {
        redirectUrlStore.set({key, redirectUrl, expiresAt});

        const storedUrl = redirectUrlStore.get({key});
        assert.strictEqual(storedUrl, redirectUrl, 'The stored redirect URL should be the same as the input');
    });

    it('should delete a redirect URL entry', () => {
        redirectUrlStore.set({key, redirectUrl, expiresAt});

        redirectUrlStore.delete({key});
        const storedUrlAfterDelete = redirectUrlStore.get({key});

        assert.strictEqual(storedUrlAfterDelete, null, 'The redirect URL should be null after deletion');
    });

    it('should clean up expired redirect URLs', () => {
        const expiredKey = 'expiredKey';
        const expiredRedirectUrl = 'https://expired.com';
        const expiredExpiresAt = Date.now() - 3600 * 1000; // 1 hour ago

        // Store expired URL
        redirectUrlStore.set({key: expiredKey, redirectUrl: expiredRedirectUrl, expiresAt: expiredExpiresAt});

        // Run cleanup
        redirectUrlStore.cleanup();

        // The expired entry should have been removed
        const expiredUrl = redirectUrlStore.get({key: expiredKey});
        assert.strictEqual(expiredUrl, null, 'Expired redirect URL should be cleaned up');
    });

    it('should return false for expired redirect URLs in has()', () => {
        redirectUrlStore.set({key, redirectUrl, expiresAt: Date.now() - 3600 * 1000});

        const hasExpired = redirectUrlStore.has({key});
        assert.strictEqual(hasExpired, false, 'has() should return false for expired URLs');
    });

    it('should return true for valid redirect URLs in has()', () => {
        redirectUrlStore.set({key, redirectUrl, expiresAt});

        const hasValid = redirectUrlStore.has({key});
        assert.strictEqual(hasValid, true, 'has() should return true for valid URLs');
    });
});
