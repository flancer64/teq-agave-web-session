export default class Fl64_Web_Session_Back_Plugin_Z_Cron {
    /**
     * @param {TeqFw_Core_Shared_Api_Logger} logger
     * @param {Fl64_Web_Session_Back_Store_Mem_RedirectUrl} memRedirectUrl
     * @param {Fl64_Web_Session_Back_Store_Mem_Session} memSession
     */
    constructor(
        {
            TeqFw_Core_Shared_Api_Logger$$: logger,
            Fl64_Web_Session_Back_Store_Mem_RedirectUrl$: memRedirectUrl,
            Fl64_Web_Session_Back_Store_Mem_Session$: memSession,
        }
    ) {
        // VARS
        let cleanupRedirectUrl = null;
        let cleanupSession = null;

        // MAIN
        this.start = function () {
            cleanupRedirectUrl = setInterval(memRedirectUrl.cleanup, 60000); // Every 1 minute
            logger.info(`Cleanup process for 'memRedirectUrl' is started.`);
            cleanupSession = setInterval(memSession.cleanup, 60000); // Every 1 minute
            logger.info(`Cleanup process for 'memSession' is started.`);
        };

        this.stop = function () {
            if (cleanupRedirectUrl) {
                clearInterval(cleanupRedirectUrl);
                logger.info(`Cleanup process for 'memRedirectUrl' is stopped.`);
            }
            if (cleanupSession) {
                clearInterval(cleanupSession);
                logger.info(`Cleanup process for 'memSession' is stopped.`);
            }
        };
    }
}
