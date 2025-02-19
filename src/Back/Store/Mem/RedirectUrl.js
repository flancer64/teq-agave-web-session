/**
 * @typedef {Object} StoredItem
 * @property {string} redirectUrl - The URL to redirect to after authentication.
 * @property {number} expiresAt - Expiration timestamp (UNIX time in milliseconds).
 */

/**
 * Class for in-memory storage of redirect URLs with expiration support.
 * @implements TeqFw_Core_Shared_Api_Store_Memory
 */
export default class Fl64_Web_Session_Back_Store_Mem_RedirectUrl {
    /**
     * @param {TeqFw_Core_Shared_Api_Logger} logger
     */
    constructor(
        {
            TeqFw_Core_Shared_Api_Logger$$: logger,
        }
    ) {
        // VARS
        /**
         * @type {Map<string, StoredItem>}
         */
        const store = new Map(); // Storage for redirect URLs with expiration

        // FUNCS

        // MAIN
        /**
         * Saves a redirect URL for a given key with optional expiration time.
         * @param {Object} params
         * @param {string|number} params.key - Key to store/retrieve data.
         * @param {string} params.redirectUrl - Redirect URL.
         * @param {number} [params.expiresAt] - Expiration timestamp. Defaults to 1 hour from now.
         * @param {number} [params.lifetime] - Lifetime in milliseconds from now. Takes precedence over `expiresAt`.
         */
        this.set = function ({key, redirectUrl, expiresAt, lifetime}) {
            if (!expiresAt && lifetime) {
                expiresAt = Date.now() + lifetime; // Calculate expiration if only lifetime is provided
            }
            if (!expiresAt) expiresAt = Date.now() + 3600 * 1000; // Default to 1 hour from now if no expiration is provided
            store.set(key, {redirectUrl, expiresAt});
        };

        /**
         * Retrieves the redirect URL by key.
         * @param {Object} params
         * @param {string} params.key - Key to store/retrieve data.
         * @returns {string|null} - Redirect URL or null if not found or expired.
         */
        this.get = function ({key}) {
            let result = null;
            const entry = store.get(key);
            if (entry) {
                if (entry.expiresAt > Date.now()) {
                    result = entry.redirectUrl;
                } else {
                    store.delete(key);
                    logger.info(`Data is expired for key: ${key}`);
                }
            }
            return result;
        };

        /**
         * Deletes a redirect URL entry by key.
         * @param {Object} params
         * @param {string} params.key - Key to store/retrieve data.
         */
        this.delete = function ({key}) {
            return store.delete(key);
        };

        /**
         * Cleans up expired redirect URLs from the store.
         */
        this.cleanup = function () {
            const now = Date.now();
            let removedCount = 0;

            for (const [key, {expiresAt}] of store.entries()) {
                if (expiresAt <= now) {
                    store.delete(key);
                    removedCount++;
                }
            }

            if (removedCount > 0) {
                logger.info(`Cleaned up ${removedCount} expired redirect URLs.`);
            }
        };

        /**
         * Checks if a redirect URL exists and is not expired for the given session key.
         * @param {Object} params
         * @param {string} params.key - Key to store/retrieve data.
         * @returns {boolean} - True if the redirect URL exists and is not expired, false otherwise.
         */
        this.has = function ({key}) {
            const entry = store.get(key);
            return !!(entry && entry.expiresAt > Date.now());
        };
    }
}
