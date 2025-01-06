/**
 * The Web Session data structure for Business Logic (Domain DTO).
 * @namespace Fl64_Web_Session_Shared_Dto_Session
 */

// MODULE'S CLASSES
/**
 * @memberOf Fl64_Web_Session_Shared_Dto_Session
 */
class Dto {
    /**
     * Date and time when the session was created.
     * @type {Date}
     */
    dateCreated;

    /**
     * Date and time when the session will expire.
     * @type {Date}
     */
    dateExpires;

    /**
     * Date and time of the last activity in the session.
     * @type {Date}
     */
    dateLast;

    /**
     * Internal numeric identifier for the session.
     * @type {number}
     */
    id;

    /**
     * Information about the client (browser, device). May be null if not provided.
     * @type {string|null}
     */
    userAgent;

    /**
     * IP address from which the session was opened.
     * @type {string}
     */
    userIp;

    /**
     * Reference to the user who owns the session.
     * @type {number}
     */
    userRef;

    /**
     * Unique string identifier for the session (UUID).
     * @type {string}
     */
    uuid;
}

/**
 * @implements TeqFw_Core_Shared_Api_Factory_Dto
 */
export default class Fl64_Web_Session_Shared_Dto_Session {
    /**
     * @param {TeqFw_Core_Shared_Util_Cast} cast
     */
    constructor({TeqFw_Core_Shared_Util_Cast$: cast}) {
        // INSTANCE METHODS
        /**
         * Create a new DTO and populate it with initialization data.
         * @param {Fl64_Web_Session_Shared_Dto_Session.Dto} [data]
         * @returns {Fl64_Web_Session_Shared_Dto_Session.Dto}
         */
        this.createDto = function (data) {
            // Create new DTO and populate with initial data
            const res = Object.assign(new Dto(), data);

            // Cast known attributes
            res.dateCreated = cast.date(data?.dateCreated);
            res.dateExpires = cast.date(data?.dateExpires);
            res.dateLast = cast.date(data?.dateLast);
            res.id = cast.int(data?.id);
            res.userAgent = cast.string(data?.userAgent);
            res.userIp = cast.string(data?.userIp);
            res.userRef = cast.int(data?.userRef);
            res.uuid = cast.string(data?.uuid);

            return res;
        };
    }
}
