import {randomUUID} from 'crypto';

/**
 * Manager for user sessions, providing methods to create, validate, and terminate sessions.
 */
export default class Fl64_Web_Session_Back_Manager {
    /**
     * @param {Fl64_Web_Session_Back_Defaults} DEF
     * @param {TeqFw_Core_Shared_Api_Logger} logger - instance
     * @param {TeqFw_Web_Back_Util_Cookie} utilCookie
     * @param {TeqFw_Db_Back_RDb_IConnect} conn
     * @param {Fl64_Web_Session_Back_Store_RDb_Repo_Session} repoSess
     */
    constructor(
        {
            Fl64_Web_Session_Back_Defaults$: DEF,
            TeqFw_Core_Shared_Api_Logger$$: logger,
            TeqFw_Web_Back_Util_Cookie$: utilCookie,
            TeqFw_Db_Back_RDb_IConnect$: conn,
            Fl64_Web_Session_Back_Store_RDb_Repo_Session$: repoSess,
        }
    ) {
        // VARS
        const A_SESS = repoSess.getSchema().getAttributes();

        // FUNCS

        /**
         * Calculates the expiration time for a session.
         * @param {number} lifetime - Lifetime of the session in seconds.
         * @returns {Date} Expiration time.
         */
        const calculateExpiration = (lifetime) => {
            const res = new Date();
            const sessionLifetime = lifetime || DEF.SESSION_LIFETIME_SEC;
            res.setSeconds(res.getSeconds() + sessionLifetime);
            return res;
        };

        // MAIN

        /**
         * Establishes a new session for the user.
         * @param {Object} params
         * @param {number} params.userId - The unique identifier of the user.
         * @param {Object} [params.data] - Additional session data (e.g., tokens, roles, preferences).
         * @param {number} [params.lifetime] - The lifetime of the session in seconds. Defaults to the configured session lifetime if not provided.
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} params.httpRequest - The HTTP request object associated with the user's action.
         * @param {module:http.ServerResponse|module:http2.Http2ServerResponse} params.httpResponse - The HTTP response object for setting cookies or headers related to the session.
         * @param {TeqFw_Db_Back_RDb_ITrans} params.trx - The database transaction context to ensure atomic operations.
         * @returns {Promise<{sessionId: number, sessionUuid: string}>}
         */
        this.establishSession = async function ({userId, data = {}, lifetime, httpRequest, httpResponse, trx}) {
            let sessionId, sessionUuid;
            if (userId) {
                const trxLocal = trx ?? await conn.startTransaction();
                try {
                    // Extract IP address & user-agent
                    const ipAddress = httpRequest.headers['x-forwarded-for']?.split(',')[0]?.trim() || httpRequest.socket.remoteAddress;
                    const userAgent = httpRequest.headers['user-agent'];
                    const now = new Date();
                    /** @type {Fl64_Web_Session_Back_Store_RDb_Schema_Session.Dto} */
                    const dto = repoSess.createDto();
                    dto.date_created = now;
                    dto.date_expires = calculateExpiration(lifetime);
                    dto.date_last = now;
                    dto.user_agent = userAgent;
                    dto.user_ip = ipAddress;
                    dto.user_ref = userId;
                    dto.uuid = randomUUID();
                    const {primaryKey} = await repoSess.createOne({trx, dto});
                    dto.id = primaryKey.id;
                    if (!trx) await trxLocal.commit();
                    // create and set cookie
                    const cookie = utilCookie.create({
                        expires: dto.date_expires,
                        name: DEF.COOKIE_SESSION,
                        path: '/',
                        sameSite: 'None',
                        value: dto.uuid,
                    });
                    utilCookie.set({response: httpResponse, cookie});
                    logger.info(`New session is established for user #${dto.user_ref} from IP ${dto.user_ip}`);
                    sessionId = dto.id;
                    sessionUuid = dto.uuid;
                } catch (error) {
                    if (!trx) await trxLocal.rollback();
                    logger.error(`Error during session establishing: ${error.message}`);
                    throw error;
                }
            } else {
                logger.error(`Cannot establish a session for user w/o ID.`);
            }
            return {sessionId, sessionUuid};
        };

        /**
         * Retrieves the session ID from the HTTP request and fetches the session data from the database.
         *
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} req - Incoming HTTP request.
         * @param {TeqFw_Db_Back_RDb_ITrans} [trx] - Database transaction context.
         * @returns {Promise<{dto:Fl64_Web_Session_Back_Store_RDb_Schema_Session.Dto}>} - The session data as a DTO, or null if no valid session is found.
         */
        this.getSessionFromRequest = async function ({req, trx}) {
            let dto = null;
            const sessionUuid = utilCookie.get({request: req, cookie: DEF.COOKIE_SESSION});
            if (sessionUuid) {
                const activeTrx = trx ?? await conn.startTransaction();
                try {
                    // Fetch session from the database by UUID
                    const key = {[A_SESS.UUID]: sessionUuid};
                    const {record} = await repoSess.readOne({trx: activeTrx, key});
                    if (!trx) await activeTrx.commit();
                    if (!record)
                        logger.info(`Session not found for session ID: ${sessionUuid}`);
                    else
                        dto = record;
                } catch (error) {
                    if (!trx) await activeTrx.rollback();
                    logger.error(`Error retrieving session from request: ${error.message}`);
                    throw error;
                }
            } else {
                logger.info('No sessionId found in the cookies.');
            }
            return {dto};
        };
    }
}
