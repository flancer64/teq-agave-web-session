/**
 * Converts Domain DTO to/from related DTOs (Persistent, etc.) for Web Session.
 * @implements TeqFw_Core_Back_Api_Convert
 */
export default class Fl64_Web_Session_Back_Convert_Session {
    /**
     * @param {TeqFw_Core_Shared_Util_Cast} cast
     * @param {Fl64_Web_Session_Shared_Dto_Session} domDto
     * @param {Fl64_Web_Session_Back_Store_RDb_Schema_Session} rdbDto
     */
    constructor(
        {
            TeqFw_Core_Shared_Util_Cast$: cast,
            Fl64_Web_Session_Shared_Dto_Session$: domDto,
            Fl64_Web_Session_Back_Store_RDb_Schema_Session$: rdbDto,
        }
    ) {
        // INSTANCE METHODS

        /**
         * Converts the persistent DTO (RDB) to the domain DTO.
         * @param {Fl64_Web_Session_Back_Store_RDb_Schema_Session.Dto} dbSession
         * @returns {Fl64_Web_Session_Shared_Dto_Session.Dto}
         */
        this.db2dom = function ({dbSession}) {
            const res = domDto.createDto();
            res.dateCreated = cast.date(dbSession?.date_created);
            res.dateExpires = cast.date(dbSession?.date_expires);
            res.dateLast = cast.date(dbSession?.date_last);
            res.id = cast.int(dbSession?.id);
            res.userAgent = cast.string(dbSession?.user_agent);
            res.userIp = cast.string(dbSession?.user_ip);
            res.userRef = cast.int(dbSession?.user_ref);
            res.uuid = cast.string(dbSession?.uuid);
            return res;
        };

        /**
         * Converts the domain DTO to the persistent DTO (RDB).
         * @param {Fl64_Web_Session_Shared_Dto_Session.Dto} session
         * @returns {Fl64_Web_Session_Back_Store_RDb_Schema_Session.Dto}
         */
        this.dom2db = function ({session}) {
            const dbSession = rdbDto.createDto();
            dbSession.date_created = cast.date(session?.dateCreated);
            dbSession.date_expires = cast.date(session?.dateExpires);
            dbSession.date_last = cast.date(session?.dateLast);
            dbSession.id = cast.int(session?.id);
            dbSession.user_agent = cast.string(session?.userAgent);
            dbSession.user_ip = cast.string(session?.userIp);
            dbSession.user_ref = cast.int(session?.userRef);
            dbSession.uuid = cast.string(session?.uuid);
            return dbSession;
        };
    }
}
