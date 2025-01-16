/**
 * Interface for user data providers in the session management system.
 * This service is responsible for retrieving and processing user data
 * in the context of session initialization or validation.
 *
 * @interface
 */
export default class Fl64_Web_Session_Back_Api_Service_UserDataProvider {
    /**
     * Retrieves and processes user data for session purposes.
     *
     * @param {TeqFw_Db_Back_RDb_ITrans} trx - Database transaction instance.
     * @param {number} userId - Identifier of the user whose data is being accessed.
     * @return {Promise<{data:Object}>} Resolves with user data object.
     * @throws {Error} If the service is not implemented in a subclass.
     */
    async perform({trx, userId}) {
        throw new Error(`Service '${this.constructor.name}' must be implemented.`);
    }
}
