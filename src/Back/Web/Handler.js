/**
 * Dispatcher for handling HTTP requests in the plugin space.
 */
export default class Fl64_Web_Session_Back_Web_Handler {
    /**
     * Initializes the handler with required dependencies.
     *
     * @param {typeof import('node:http2')} http2
     * @param {Fl64_Web_Session_Back_Defaults} DEF
     * @param {TeqFw_Core_Shared_Api_Logger} logger
     * @param {TeqFw_Web_Back_Help_Respond} respond
     * @param {Fl64_Web_Session_Back_Web_Handler_A_Logout} aLogout
     */
    constructor(
        {
            'node:http2': http2,
            Fl64_Web_Session_Back_Defaults$: DEF,
            TeqFw_Core_Shared_Api_Logger$$: logger,
            TeqFw_Web_Back_Help_Respond$: respond,
            Fl64_Web_Session_Back_Web_Handler_A_Logout$: aLogout,
        }
    ) {
        // VARS
        const {
            HTTP2_METHOD_GET,
            HTTP2_METHOD_POST,
        } = http2.constants;

        // FUNCS

        /**
         * Extracts the relative path parts from the request URL.
         *
         * The method removes the query string and extracts the portion of the path
         * that follows the predefined namespace (`DEF.SHARED.SPACE`). The resulting
         * path is split into an array of segments.
         *
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} req - Incoming HTTP request.
         * @returns {string[]} Array of path segments relative to `DEF.SHARED.SPACE`.
         */
        function getPathParts(req) {
            const fullPath = req.url.split('?')[0];
            const baseIndex = fullPath.indexOf(DEF.SHARED.SPACE);
            const relativePath = fullPath.slice(baseIndex + DEF.SHARED.SPACE.length + 1);
            return relativePath.split('/');
        }

        /**
         * Handles incoming HTTP requests and delegates processing to specific handlers.
         *
         * @param {module:http.IncomingMessage|module:http2.Http2ServerRequest} req
         * @param {module:http.ServerResponse|module:http2.Http2ServerResponse} res
         */
        async function process(req, res) {
            try {
                const parts = getPathParts(req);
                const endpoint = parts[0];
                switch (endpoint) {
                    case DEF.SHARED.ROUTE_LOGOUT:
                        await aLogout.run(req, res);
                        break;
                    default:
                        // If the endpoint is not recognized, do nothing and let other handlers process it
                        break;
                }
            } catch (error) {
                logger.exception(error);
                respond.code500_InternalServerError({res, body: error.message});
            }
        }

        /**
         * Provides the function to process requests.
         * @returns {Function}
         */
        this.getProcessor = () => process;

        /**
         * Placeholder for initialization logic.
         */
        this.init = async function () { };

        /**
         * Checks if the request can be handled by this instance.
         *
         * @param {Object} options
         * @param {string} options.method
         * @param {Object} options.address
         * @returns {boolean}
         */
        this.canProcess = function ({method, address} = {}) {
            return (
                ((method === HTTP2_METHOD_GET) || (method === HTTP2_METHOD_POST))
                && (address?.space === DEF.SHARED.SPACE)
            );
        };
    }
}
