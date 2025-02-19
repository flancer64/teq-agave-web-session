/**
 * Plugin constants (hardcoded configuration) for frontend code.
 */
export default class Fl64_Web_Session_Back_Defaults {
    COOKIE_REDIRECT = 'teq_redirect';
    COOKIE_SESSION = 'teq_session';

    /** @type {TeqFw_Web_Back_Defaults} */
    MOD_WEB;

    NAME;

    SESSION_LIFETIME_SEC = 31536000; // 1 year

    /** @type {Fl64_Web_Session_Shared_Defaults} */
    SHARED;

    /**
     * @param {TeqFw_Web_Back_Defaults} MOD_WEB
     * @param {Fl64_Web_Session_Shared_Defaults} SHARED
     */
    constructor(
        {
            TeqFw_Web_Back_Defaults$: MOD_WEB,
            Fl64_Web_Session_Shared_Defaults$: SHARED,
        }
    ) {
        this.MOD_WEB = MOD_WEB;
        this.SHARED = SHARED;
        this.NAME = SHARED.NAME;
        Object.freeze(this);
    }
}
