export default class Fl64_Web_Session_Back_Plugin_Z_Cron {
    /**
     * @param {TeqFw_Core_Shared_Api_Logger} logger
     * @param {Fl64_Web_Session_Back_Store_Mem_RedirectUrl} memRedirectUrl
     * @param {Fl64_Web_Session_Back_Store_Mem_Session} memSession
     * @param {Fl64_Web_Session_Back_Act_Clean} actCleanDb
     */
    constructor(
        {
            TeqFw_Core_Shared_Api_Logger$$: logger,
            Fl64_Web_Session_Back_Store_Mem_RedirectUrl$: memRedirectUrl,
            Fl64_Web_Session_Back_Store_Mem_Session$: memSession,
            Fl64_Web_Session_Back_Act_Clean$: actCleanDb,
        }
    ) {
        // VARS
        const DAY_MS = 86400000; // 24 hours in milliseconds
        const MIN_10_MS = 600000; // 10 minutes in milliseconds
        const MIN_20_MS = 1200000; // 20 minutes in milliseconds

        let intervalDbSession = null;
        let intervalMemRedirect = null;
        let intervalMemSession = null;
        let timeoutDbSession = null;
        let timeoutDbSessionNextRun = null;

        // FUNCS

        function startDbSession() {
            // Generate a random delay between 10 and 20 minutes
            const randomDelay = Math.floor(Math.random() * (MIN_20_MS - MIN_10_MS + 1)) + MIN_10_MS;

            logger.info(`The 'actCleanDb' process will start after a random delay of ${randomDelay} ms.`);

            // Schedule the first execution after the random delay
            timeoutDbSession = setTimeout(async () => {
                try {
                    await actCleanDb.run();
                    logger.info(`First 'actCleanDb' execution completed after a ${randomDelay} ms delay.`);
                } catch (error) {
                    logger.exception(error);
                }

                // Schedule daily execution at 03:10 UTC
                const now = new Date();
                const nextRun = new Date(now);
                nextRun.setUTCHours(3, 12, 0, 0); // 03:12 UTC
                if (now > nextRun) {
                    nextRun.setUTCDate(nextRun.getUTCDate() + 1); // Move to the next day if already past 03:10 UTC
                }

                const timeUntilNextRun = nextRun.getTime() - now.getTime();

                logger.info(`Next 'actCleanDb' execution scheduled for ${nextRun.toUTCString()}.`);

                // Schedule execution at the calculated time
                timeoutDbSessionNextRun = setTimeout(async () => {
                    try {
                        await actCleanDb.run();
                        logger.info(`'actCleanDb' is now running daily at 03:12 UTC.`);
                    } catch (error) {
                        logger.exception(error);
                    }

                    // Set interval for daily execution
                    intervalDbSession = setInterval(() => {
                        actCleanDb.run().catch(logger.exception);
                    }, DAY_MS);
                }, timeUntilNextRun);
            }, randomDelay);
        }

        // MAIN
        this.start = function () {
            intervalMemRedirect = setInterval(memRedirectUrl.cleanup, 60000); // Every 1 minute
            logger.info(`Cleanup process for 'memRedirectUrl' is started.`);
            intervalMemSession = setInterval(memSession.cleanup, 60000); // Every 1 minute
            logger.info(`Cleanup process for 'memSession' is started.`);
            startDbSession();
        };

        this.stop = function () {
            if (intervalDbSession) {
                clearInterval(intervalDbSession);
                logger.info(`Cleanup process for 'actCleanDb' is stopped.`);
            }
            if (intervalMemRedirect) {
                clearInterval(intervalMemRedirect);
                logger.info(`Cleanup process for 'memRedirectUrl' is stopped.`);
            }
            if (intervalMemSession) {
                clearInterval(intervalMemSession);
                logger.info(`Cleanup process for 'memSession' is stopped.`);
            }
            if (timeoutDbSession) {
                clearTimeout(timeoutDbSession);
                logger.info(`Initial 'actCleanDb' execution (random delay) has been stopped.`);
            }
            if (timeoutDbSessionNextRun) {
                clearTimeout(timeoutDbSessionNextRun);
                logger.info(`Scheduled execution of 'actCleanDb' at 03:12 UTC has been stopped.`);
            }
        };
    }
}
