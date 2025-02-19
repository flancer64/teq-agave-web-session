export default class Fl64_Web_Session_Back_Plugin_Start {
    /**
     * @param {Fl64_Web_Session_Back_Plugin_Z_Cron} zCron
     */
    constructor(
        {
            Fl64_Web_Session_Back_Plugin_Z_Cron$: zCron,
        }
    ) {
        return function () {
            zCron.start();
        };
    }
}
