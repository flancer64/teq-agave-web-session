/**
 * Handles logout requests.
 */
export default class Fl64_Web_Session_Back_Web_Handler_A_Logout {
    /**
     * Initializes the handler with required dependencies.
     *
     * @param {typeof import('node:http2')} http2
     * @param {TeqFw_Web_Back_Help_Respond} respond
     * @param {Fl64_Web_Session_Back_Manager} session
     */
    constructor(
        {
            'node:http2': http2,
            TeqFw_Web_Back_Help_Respond$: respond,
            Fl64_Web_Session_Back_Manager$: session,
        }
    ) {
        // VARS
        const {
            HTTP2_HEADER_LOCATION,
        } = http2.constants;

        // MAIN
        /**
         * Handles the provider selection action.
         *
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} req - Incoming HTTP request
         * @param {module:http.ServerResponse|module:http2.Http2ServerResponse} res - HTTP response object
         *
         * @return {Promise<boolean>}
         */
        this.run = async function (req, res) {
            await session.close({req, res});
            respond.code303_SeeOther({
                res, headers: {[HTTP2_HEADER_LOCATION]: '/'}
            });
            return true;
        };
    }
}

 