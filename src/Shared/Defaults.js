/**
 * Plugin constants (hardcoded configuration) for shared code.
 */
export default class Fl64_Web_Session_Shared_Defaults {

    NAME = '@flancer64/teq-agave-web-session';

    /** @type {TeqFw_Web_Shared_Defaults} */
    MOD_WEB;

    ROUTE_LOGOUT = 'logout';

    SPACE = 'fl64-web-session';

    constructor(
        {
            TeqFw_Web_Shared_Defaults$: MOD_WEB
        }
    ) {
        this.MOD_WEB = MOD_WEB;
        Object.freeze(this);
    }
}
