import {randomUUID} from 'crypto';

/**
 * Manager for user sessions, providing methods to create, validate, and terminate sessions.
 */
export default class Fl64_Web_Session_Back_Manager {
    /**
     * @param {Fl64_Web_Session_Back_Defaults} DEF
     * @param {TeqFw_Core_Shared_Api_Logger} logger - instance
     * @param {TeqFw_Web_Back_Util_Cookie} utilCookie
     * @param {TeqFw_Db_Back_App_TrxWrapper} trxWrapper - Database transaction wrapper
     * @param {Fl64_Web_Session_Back_Store_RDb_Repo_Session} repoSess
     * @param {Fl64_Web_Session_Back_Store_Mem_Session} memSession
     * @param {Fl64_Web_Session_Back_Api_Service_UserDataProvider} serviceUserDataProvider
     */
    constructor(
        {
            Fl64_Web_Session_Back_Defaults$: DEF,
            TeqFw_Core_Shared_Api_Logger$$: logger,
            TeqFw_Web_Back_Util_Cookie$: utilCookie,
            TeqFw_Db_Back_App_TrxWrapper$: trxWrapper,
            Fl64_Web_Session_Back_Store_RDb_Repo_Session$: repoSess,
            Fl64_Web_Session_Back_Store_Mem_Session$: memSession,
            Fl64_Web_Session_Back_Api_Service_UserDataProvider$: serviceUserDataProvider,
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
         * @param {Object} params
         * @param {TeqFw_Db_Back_RDb_ITrans} [params.trx] - The database transaction context to ensure atomic operations.
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} params.req - The HTTP request object associated with the user's action.
         * @param {module:http.ServerResponse|module:http2.Http2ServerResponse} params.res - The HTTP response object for setting cookies or headers related to the session.
         * @return {Promise<void>}
         */
        this.close = async function ({trx: trxOuter, req, res}) {
            const uuid = utilCookie.get({request: req, cookie: DEF.COOKIE_SESSION});
            if (uuid) {
                const cookie = utilCookie.clear({name: DEF.COOKIE_SESSION});
                utilCookie.set({response: res, cookie});
                const cached = memSession.get({key: uuid});
                if (cached) {
                    memSession.delete({key: uuid});
                    logger.info(`User session '${uuid}' is deleted from the memory cache.`);
                } else {
                    logger.info(`User session '${uuid}' is not found in the memory cache.`);
                }
                await trxWrapper.execute(trxOuter, async (trx) => {
                    const key = {[A_SESS.UUID]: uuid};
                    const {record} = await repoSess.readOne({trx, key});
                    if (record) {
                        await repoSess.deleteOne({trx, key});
                        logger.info(`User session '${uuid}' is deleted from DB.`);
                    }
                });
            }
        };

        /**
         * Establishes a new session for the user.
         *
         * @param {Object} params
         * @param {TeqFw_Db_Back_RDb_ITrans} params.trx - The database transaction context to ensure atomic operations.
         * @param {number} params.userId - The unique identifier of the user.
         * @param {number} [params.lifetime] - The lifetime of the session in seconds. Defaults to the configured session lifetime if not provided.
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} [params.httpRequest] - deprecated
         * @param {module:http.ServerResponse|module:http2.Http2ServerResponse} [params.httpResponse] - deprecated
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} params.req - The HTTP request object associated with the user's action.
         * @param {module:http.ServerResponse|module:http2.Http2ServerResponse} params.res - The HTTP response object for setting cookies or headers related to the session.
         * @returns {Promise<{sessionId: number, sessionUuid: string, sessionData: Object}>}
         */
        this.establish = async function ({trx: trxOuter, userId, lifetime, httpRequest, httpResponse, req, res}) {
            let sessionId, sessionUuid, sessionData;
            if (userId) {
                const request = req || httpRequest; // Fallback to deprecated parameter
                const response = res || httpResponse; // Fallback to deprecated parameter

                await trxWrapper.execute(trxOuter, async (trx) => {
                    // Prepare session data (IP address, user-agent, ...)
                    const ipAddress = request.headers['x-forwarded-for']?.split(',')[0]?.trim() || request.socket.remoteAddress;
                    const userAgent = request.headers['user-agent'];
                    const now = new Date();
                    // compose session DTO and create DB record
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
                    dto.id = primaryKey[A_SESS.ID];
                    // get session data related to a project that uses this session manager
                    const {data} = await serviceUserDataProvider.perform({trx, userId});
                    // create and set cookie
                    const cookie = utilCookie.create({
                        expires: dto.date_expires,
                        name: DEF.COOKIE_SESSION,
                        path: '/',
                        sameSite: 'None',
                        value: dto.uuid,
                    });
                    utilCookie.set({response, cookie});
                    memSession.set({key: dto.uuid, data: [dto, data], expiresAt: dto.date_expires.getTime()});
                    logger.info(`New session is established for user #${dto.user_ref} from IP ${dto.user_ip}`);
                    sessionId = dto.id;
                    sessionUuid = dto.uuid;
                    sessionData = data;
                });
            } else {
                logger.error(`Cannot establish a session for user w/o ID.`);
            }
            return {sessionId, sessionUuid, sessionData};
        };

        /**
         * Retrieves the session ID from the HTTP request and fetches the session data from the database.
         *
         * @param {Object} params - Database transaction context.
         * @param {TeqFw_Db_Back_RDb_ITrans} [params.trx] - Database transaction context.
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} params.req - Incoming HTTP request.
         * @returns {Promise<{dto:Fl64_Web_Session_Back_Store_RDb_Schema_Session.Dto, sessionData:*}>} - The session DTO & data, or null if no valid session is found.
         */
        this.getFromRequest = async function ({trx: trxOuter, req}) {
            let dto = null, sessionData = null;
            const uuid = utilCookie.get({request: req, cookie: DEF.COOKIE_SESSION});
            if (uuid) {
                const cached = memSession.get({key: uuid});
                if (cached) {
                    dto = cached[0];
                    sessionData = cached[1];
                } else {
                    await trxWrapper.execute(trxOuter, async (trx) => {
                        // Fetch session from the database by UUID
                        const key = {[A_SESS.UUID]: uuid};
                        const {record} = await repoSess.readOne({trx, key});
                        if (!record)
                            // don't log session UUID for established sessions
                            logger.info(`Session not found for session UUID: ${uuid}`);
                        else {
                            dto = record;
                            const {data} = await serviceUserDataProvider.perform({trx, userId: record.user_ref});
                            sessionData = data;
                            const foundInCache = memSession.get({key: uuid});
                            if (!foundInCache) {
                                memSession.set({
                                    key: uuid,
                                    data: [dto, sessionData],
                                    expiresAt: dto.date_expires.getTime()
                                });
                                logger.info(`User session #${dto.id} is loaded into the memory cache.`);
                            }
                        }
                    });
                }
            } else {
                logger.info('No sessionId found in the cookies.');
            }
            return {dto, sessionData};
        };

        /**
         * Checks if the HTTP request contains session data.
         *
         * @param {Object} params - Parameters for checking the session.
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} params.req - The HTTP request object.
         * @returns {boolean} - True if a session exists, otherwise false.
         */
        this.hasSession = function ({req}) {
            const sessionUuid = utilCookie.get({request: req, cookie: DEF.COOKIE_SESSION});
            return !!sessionUuid;
        };

        /**
         * Update session data in memory storage.
         * @param {{dto:Fl64_Web_Session_Back_Store_RDb_Schema_Session.Dto, sessionData:*}} session
         * @return {Promise<void>}
         */
        this.updateSessionData = async function ({session}) {
            const {dto, sessionData: data} = session;
            memSession.set({key: dto.uuid, data: [dto, data], expiresAt: dto.date_expires.getTime()});
        };
    }
}
