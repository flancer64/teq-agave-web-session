/**
 * @typedef {Object} StoredItem
 * @property {[Fl64_Web_Session_Back_Store_RDb_Schema_Session.Dto, Object]} data
 * @property {number} expiresAt Expiration timestamp (unix time).
 */

/**
 * Class for in-memory storage of user sessions with automatic cleanup.
 * @implements TeqFw_Core_Shared_Api_Store_Memory
 */
export default class Fl64_Web_Session_Back_Store_Mem_Session {
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
        const store = new Map(); // Internal session storage

        // FUNCS

        // MAIN
        /**
         * Saves a session with a unique UUID and expiration time.
         * @param {Object} params
         * @param {string|number} params.key - Session UUID.
         * @param {[Fl64_Web_Session_Back_Store_RDb_Schema_Session.Dto, Object]} params.data - Session details.
         * @param {number} [params.expiresAt] - Expiration timestamp. Defaults to 1 hour from now.
         */
        this.set = function ({key, data, expiresAt}) {
            if (!expiresAt) expiresAt = Date.now() + 3600 * 1000; // Default 1 hour
            store.set(key, {data, expiresAt});
        };

        /**
         * Retrieves session details by UUID.
         * @param {Object} params
         * @param {string} params.key - Session UUID.
         * @returns {Object|null} - Session details or null if not found/expired.
         */
        this.get = function ({key}) {
            let result = null;
            const entry = store.get(key);
            if (entry) {
                if (entry.expiresAt > Date.now()) {
                    result = entry.data;
                } else {
                    store.delete(key);
                    logger.info(`Session is expired for UUID: ${key}`);
                }
            }
            return result;
        };

        /**
         * Deletes a session by UUID.
         * @param {Object} params
         * @param {string} params.key - Session UUID.
         */
        this.delete = function ({key}) {
            const res = store.delete(key);
            if (res) {
                logger.info(`Session removed for UUID: ${key}`);
            } else {
                logger.info(`Session not found for removal: ${key}`);
            }
            return res;
        };

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
                logger.info(`Cleaned up ${removedCount} expired in-memory sessions.`);
            }
        };

        this.has = function ({key}) {
            const entry = store.get(key);
            return !!(entry && entry.expiresAt > Date.now());
        };
    }

}
