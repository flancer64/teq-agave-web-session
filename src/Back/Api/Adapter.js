/* eslint-disable no-unused-vars */

/**
 * Interface for implementing an application-level adapter for this plugin.
 *
 * @interface
 */
export default class Fl64_Web_Session_Back_Api_Adapter {

    /**
     * Retrieves and processes user data for session purposes.
     *
     * @param {object} params - Parameters object.
     * @param {TeqFw_Db_Back_RDb_ITrans} [params.trx] - Database transaction instance.
     * @param {number} params.userId - Identifier of the user whose data is being accessed.
     * @return {Promise<{data:object, allowed:boolean, redirectUri:string}>} Resolves with a user data object.
     */
    async retrieveUserData({trx, userId}) {
        throw new Error(`Interface '${this.constructor.name}' must be implemented.`);
    }
}
