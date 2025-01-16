/**
 * Class for in-memory storage of user sessions with automatic cleanup.
 * @implements TeqFw_Core_Shared_Api_Store_Memory
 */
export default class Fl64_Web_Session_Back_Store_Mem_Session {
    /**
     * @param {TeqFw_Core_Shared_Api_Logger} logger
     */
    constructor({TeqFw_Core_Shared_Api_Logger$$: logger}) {
        // VARS
        /**
         * @type {Map<string, [dto:Fl64_Web_Session_Back_Store_RDb_Schema_Session.Dto, sessionData:Object]>}
         */
        const store = new Map(); // Internal session storage
        let cleanupInterval = null;

        // FUNCS
        /**
         * Removes expired sessions from the store.
         */
        const cleanupExpired = function () {
            const now = Date.now();
            let removedCount = 0;

            for (const [key, {expiresAt}] of store.entries()) {
                if (expiresAt <= now) {
                    store.delete(key);
                    removedCount++;
                }
            }

            if (removedCount > 0) {
                logger.info(`Cleaned up ${removedCount} expired session(s).`);
            }
        };

        function stopCleanup() {
            if (cleanupInterval) clearInterval(cleanupInterval);
        }

        // MAIN
        /**
         * Saves a session with a unique ID and expiration time.
         * @param {Object} params
         * @param {string|number} params.key - Session ID.
         * @param {Object} params.data - Session details.
         * @param {number} [params.expiresAt] - Expiration timestamp. Defaults to 1 hour from now.
         */
        this.set = function ({key, data, expiresAt}) {
            if (!expiresAt) expiresAt = Date.now() + 3600 * 1000; // Default 1 hour
            store.set(key, {data, expiresAt});
            logger.info(`Session stored with ID: ${key}, expires at: ${new Date(expiresAt).toISOString()}`);
        };

        /**
         * Retrieves session details by ID.
         * @param {Object} params
         * @param {string} params.key - Session ID.
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
                    logger.info(`Session expired for ID: ${key}`);
                }
            } else {
                logger.info(`Session not found for ID: ${key}`);
            }

            return result;
        };

        /**
         * Deletes a session by ID.
         * @param {Object} params
         * @param {string} params.key - Session ID.
         */
        this.delete = function ({key}) {
            if (store.delete(key)) {
                logger.info(`Session removed for ID: ${key}`);
            } else {
                logger.info(`Session not found for removal: ${key}`);
            }
        };

        this.stopCleanup = stopCleanup;

        // Start automatic cleanup
        cleanupInterval = setInterval(cleanupExpired, 60000); // Every 1 minute

        // Ensure cleanup stops when the instance is destroyed
        process.on('exit', stopCleanup);
    }
}
