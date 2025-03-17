/**
 * An action that removes expired sessions from the RDB.
 *
 * @implements {TeqFw_Core_Shared_Api_Action}
 */
export default class Fl64_Web_Session_Back_Act_Clean {
    /**
     * @param {TeqFw_Core_Shared_Api_Logger} logger
     * @param {TeqFw_Db_Back_App_TrxWrapper} trxWrapper
     * @param {Fl64_Web_Session_Back_Store_RDb_Repo_Session} repoSession
     */
    constructor(
        {
            TeqFw_Core_Shared_Api_Logger$$: logger,
            TeqFw_Db_Back_App_TrxWrapper$: trxWrapper,
            Fl64_Web_Session_Back_Store_RDb_Repo_Session$: repoSession,
        }
    ) {
        // VARS
        const A_SESS = repoSession.getSchema().getAttributes();

        // MAIN
        /**
         * Executes the cleanup process for expired sessions.
         *
         * @param {Object} params
         * @param {TeqFw_Db_Back_RDb_ITrans} [params.trx] - Optional transaction object.
         * @returns {Promise<Object>}
         */
        this.run = async function ({trx: trxOuter} = {}) {
            logger.info('Starting cleanup of expired sessions.');

            await trxWrapper.execute(trxOuter, async (trx) => {
                const now = new Date();
                const conditions = {[A_SESS.DATE_EXPIRES]: ['<', now]};
                const {deletedCount} = await repoSession.deleteMany({trx, conditions});

                if (deletedCount) {
                    logger.info(`Deleted ${deletedCount} expired session(s) from the database.`);
                }
            });

            logger.info('Expired session cleanup completed.');
        };

    }
}
