/**
 * Persistent DTO with metadata for the RDB entity: Web Session.
 * @namespace Fl64_Web_Session_Back_Store_RDb_Schema_Session
 */

// MODULE'S VARS

/**
 * Path to the entity in the plugin's DEM.
 *
 * @type {string}
 */
const ENTITY = '/fl64/web/session';

/**
 * Attribute mappings for the entity.
 * @memberOf Fl64_Web_Session_Back_Store_RDb_Schema_Session
 */
const ATTR = {
    DATE_CREATED: 'date_created',
    DATE_EXPIRES: 'date_expires',
    DATE_LAST: 'date_last',
    ID: 'id',
    USER_AGENT: 'user_agent',
    USER_IP: 'user_ip',
    USER_REF: 'user_ref',
    UUID: 'uuid',
};
Object.freeze(ATTR);

// MODULE'S CLASSES

/**
 * DTO class representing the persistent structure of the Web Session entity.
 * @memberOf Fl64_Web_Session_Back_Store_RDb_Schema_Session
 */
class Dto {
    /**
     * Timestamp of when the session was created.
     *
     * @type {Date}
     */
    date_created;

    /**
     * Timestamp of when the session will expire.
     *
     * @type {Date}
     */
    date_expires;

    /**
     * Timestamp of the last activity in the session.
     *
     * @type {Date}
     */
    date_last;

    /**
     * Internal numeric identifier for the session.
     *
     * @type {number}
     */
    id;

    /**
     * Information about the client (browser, device). May be null if not provided.
     *
     * @type {string|null}
     */
    user_agent;

    /**
     * IP address from which the session was opened.
     *
     * @type {string}
     */
    user_ip;

    /**
     * Reference to the user who owns the session.
     *
     * @type {number}
     */
    user_ref;

    /**
     * Unique string identifier for the session (UUID).
     *
     * @type {string}
     */
    uuid;
}

/**
 * Implements metadata and utility methods for the Web Session entity.
 * @implements TeqFw_Db_Back_Api_RDb_Schema_Object
 */
export default class Fl64_Web_Session_Back_Store_RDb_Schema_Session {
    /**
     * Constructor for the Web Session persistent DTO class.
     *
     * @param {Fl64_Web_Session_Back_Defaults} DEF
     * @param {TeqFw_Core_Shared_Util_Cast} cast
     */
    constructor(
        {
            Fl64_Web_Session_Back_Defaults$: DEF,
            TeqFw_Core_Shared_Util_Cast$: cast
        }
    ) {
        // INSTANCE METHODS

        /**
         * @param {Fl64_Web_Session_Back_Store_RDb_Schema_Session.Dto|Object} [data]
         * @returns {Fl64_Web_Session_Back_Store_RDb_Schema_Session.Dto}
         */
        this.createDto = function (data) {
            const res = new Dto();
            if (data) {
                res.date_created = cast.date(data?.date_created);
                res.date_expires = cast.date(data?.date_expires);
                res.date_last = cast.date(data?.date_last);
                res.id = cast.int(data?.id);
                res.user_agent = cast.string(data?.user_agent);
                res.user_ip = cast.string(data?.user_ip);
                res.user_ref = cast.int(data?.user_ref);
                res.uuid = cast.string(data?.uuid);
            }
            return res;
        };

        // noinspection JSCheckFunctionSignatures
        /**
         * Returns the attribute map for the entity.
         *
         * @returns {typeof Fl64_Web_Session_Back_Store_RDb_Schema_Session.ATTR}
         */
        this.getAttributes = () => ATTR;

        /**
         * Returns the entity's path in the DEM.
         *
         * @returns {string}
         */
        this.getEntityName = () => `${DEF.NAME}${ENTITY}`;

        /**
         * Returns the primary key attributes for the entity.
         *
         * @returns {Array<string>}
         */
        this.getPrimaryKey = () => [ATTR.ID];
    }
}
