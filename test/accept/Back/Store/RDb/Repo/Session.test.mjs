import assert from 'assert';
import {createContainer} from '@teqfw/test';
import {dbConnect, dbCreateFkEntities, dbDisconnect, dbReset, initConfig} from '../../../../common.mjs';

// SETUP CONTAINER
const container = await createContainer();
await initConfig(container);

// SETUP ENVIRONMENT
/** @type {Fl64_Web_Session_Back_Store_RDb_Repo_Session} */
const repoSession = await container.get('Fl64_Web_Session_Back_Store_RDb_Repo_Session$');

// TEST CONSTANTS
const SESSION_ID = 1;
const USER_AGENT = 'Mozilla/5.0';
const USER_IP = '192.168.0.1';
const UUID = 'session_uuid';
let USER_REF;

// Test Suite for Session Model
describe('Fl64_Web_Session_Back_Store_RDb_Repo_Session', () => {
    before(async () => {
        await dbReset(container);
        const {user} = await dbCreateFkEntities(container);
        USER_REF = user.id;
        await dbConnect(container);
    });

    after(async () => {
        await dbDisconnect(container);
    });

    it('should create a new session entry', async () => {
        /** @type {Fl64_Web_Session_Back_Store_RDb_Schema_Session.Dto} */
        const dto = repoSession.createDto();
        dto.date_created = new Date();
        dto.date_expires = new Date();
        dto.date_last = new Date();
        dto.user_agent = USER_AGENT;
        dto.user_ip = USER_IP;
        dto.user_ref = USER_REF;
        dto.uuid = UUID;

        const {primaryKey} = await repoSession.createOne({dto});

        assert.ok(primaryKey, 'Session should be created');
    });

    it('should read an existing session by ID', async () => {
        const session = await repoSession.read({id: SESSION_ID});

        assert.ok(session, 'Session should exist');
        assert.strictEqual(session.id, SESSION_ID, 'Session ID should match');
    });

    it('should list all sessions', async () => {
        const sessions = await repoSession.list();

        assert.ok(sessions.length > 0, 'There should be at least one session');
    });

    it('should update an existing session', async () => {
        const dto = await repoSession.read({id: SESSION_ID});
        dto.userAgent = 'Updated-Agent';

        const updatedSession = await repoSession.update({dto});

        assert.strictEqual(updatedSession.userAgent, 'Updated-Agent', 'User agent should be updated');
    });

    it('should delete an existing session', async () => {
        const dto = await repoSession.read({id: SESSION_ID});
        const result = await repoSession.delete({dto});

        assert.strictEqual(result, 1, 'One session should be deleted');
    });
});
