/**
 * Manager for user sessions, providing methods to create, validate, and terminate sessions.
 */
export default class Fl64_Web_Session_Back_Manager {
    /**
     * @param {typeof import('node:crypto')} crypto
     * @param {typeof import('node:http2')} http2
     * @param {Fl64_Web_Session_Back_Defaults} DEF
     * @param {TeqFw_Core_Shared_Api_Logger} logger - instance
     * @param {TeqFw_Web_Back_Util_Cookie} utilCookie
     * @param {TeqFw_Db_Back_App_TrxWrapper} trxWrapper - Database transaction wrapper
     * @param {Fl64_Web_Session_Back_Store_RDb_Repo_Session} repoSess
     * @param {Fl64_Web_Session_Back_Store_Mem_RedirectUrl} memRedirectUrl
     * @param {Fl64_Web_Session_Back_Store_Mem_Session} memSession
     * @param {Fl64_Web_Session_Back_Api_Adapter} adapter
     */
    constructor(
        {
            'node:crypto': crypto,
            'node:http2': http2,
            Fl64_Web_Session_Back_Defaults$: DEF,
            TeqFw_Core_Shared_Api_Logger$$: logger,
            TeqFw_Web_Back_Util_Cookie$: utilCookie,
            TeqFw_Db_Back_App_TrxWrapper$: trxWrapper,
            Fl64_Web_Session_Back_Store_RDb_Repo_Session$: repoSess,
            Fl64_Web_Session_Back_Store_Mem_RedirectUrl$: memRedirectUrl,
            Fl64_Web_Session_Back_Store_Mem_Session$: memSession,
            Fl64_Web_Session_Back_Api_Adapter$: adapter,
        }
    ) {
        // VARS
        const {
            HTTP2_HEADER_SET_COOKIE,
        } = http2.constants;
        const {randomUUID} = crypto;

        const COOKIE_LIFETIME_REDIRECT = 3600; // 1 hour
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
         * @param {object} params
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
         * @param {object} params
         * @param {TeqFw_Db_Back_RDb_ITrans} params.trx - The database transaction context to ensure atomic operations.
         * @param {number} params.userId - The unique identifier of the user.
         * @param {number} [params.lifetime] - The lifetime of the session in seconds. Defaults to the configured session lifetime if not provided.
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} [params.httpRequest] - deprecated
         * @param {module:http.ServerResponse|module:http2.Http2ServerResponse} [params.httpResponse] - deprecated
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} params.req - The HTTP request object associated with the user's action.
         * @param {module:http.ServerResponse|module:http2.Http2ServerResponse} params.res - The HTTP response object for setting cookies or headers related to the session.
         * @returns {Promise<{sessionId: number, sessionUuid: string, sessionData: object, redirectUri:string}>}
         */
        this.establish = async function ({trx: trxOuter, userId, lifetime, httpRequest, httpResponse, req, res}) {
            let sessionId, sessionUuid, sessionData, redirectUri;
            if (userId) {
                const request = req || httpRequest; // Fallback to deprecated parameter
                const response = res || httpResponse; // Fallback to deprecated parameter

                await trxWrapper.execute(trxOuter, async (trx) => {
                    // Prepare session data (IP address, user-agent, ...)
                    const ipAddress = request.headers['x-forwarded-for']?.split(',')[0]?.trim() || request.socket.remoteAddress;
                    const userAgent = request.headers['user-agent'];
                    const now = new Date();
                    // compose session DTO and create a DB record
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
                    const {data, allowed, redirectUri: uriOnDisallow} = await adapter.retrieveUserData({trx, userId});
                    if (allowed) {
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
                    } else {
                        redirectUri = uriOnDisallow;
                        logger.error(`Cannot establish a session for user #${userId} because the user is not allowed to use this session manager.`);
                    }
                });
            } else {
                logger.error(`Cannot establish a session for user w/o ID.`);
            }
            return {sessionId, sessionUuid, sessionData, redirectUri};
        };

        /**
         * Retrieves the session ID from the HTTP request and fetches the session data from the database.
         *
         * @param {object} params - Database transaction context.
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
                            const {data} = await adapter.retrieveUserData({trx, userId: record.user_ref});
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
            }
            return {dto, sessionData};
        };

        /**
         * Checks if the HTTP request contains session data.
         *
         * @param {object} params - Parameters for checking the session.
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} params.req - The HTTP request object.
         * @returns {boolean} - True if a session exists, otherwise false.
         */
        this.hasSession = function ({req}) {
            const sessionUuid = utilCookie.get({request: req, cookie: DEF.COOKIE_SESSION});
            return !!sessionUuid;
        };

        /**
         * Retrieves the redirect URL from memory and optionally removes it.
         *
         * @param {object} params - The parameters for the function.
         * @param {module:http.IncomingMessage} params.req - The incoming HTTP request.
         * @param {boolean} [params.remove=false] - Whether to remove the redirect URL after retrieval.
         * @returns {Promise<{url: string | null}>} The URL associated with the redirect, or null if not found.
         */
        this.retrieveRedirectUrl = async function ({req, remove = false}) {
            let url = null;
            const key = utilCookie.get({request: req, cookie: DEF.COOKIE_REDIRECT});
            if (key) {
                url = memRedirectUrl.get({key});
                if (url && remove) memRedirectUrl.delete({key});
            }
            return {url};
        };

        /**
         * Stores the redirect URL in memory and composes a cookie for it.
         *
         * @param {object} params - The parameters for the function.
         * @param {string} params.redirectUrl - The redirect URL to be stored.
         * @returns {Promise<{headers: Object}>} The headers, including the set-cookie header with the redirect key.
         */
        this.storeRedirectUrl = async function ({redirectUrl}) {
            const key = randomUUID();
            await memRedirectUrl.set({key, redirectUrl});
            const cookie = utilCookie.create({
                expires: COOKIE_LIFETIME_REDIRECT, // Max-Age: 3600 sec.
                name: DEF.COOKIE_REDIRECT,
                path: '/',
                sameSite: 'None',
                value: key,
            });
            const headers = {
                [HTTP2_HEADER_SET_COOKIE]: cookie,
            };
            return {headers};
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
