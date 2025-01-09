import assert from 'assert';
import {createContainer} from '@teqfw/test';
import {dbConnect, dbCreateFkEntities, dbDisconnect, dbReset, initConfig} from '../../../../common.mjs';

// SETUP CONTAINER
const container = await createContainer();
await initConfig(container);

// SETUP ENVIRONMENT
/** @type {Fl64_Web_Session_Back_Store_RDb_Repo_Session} */
const repoSession = await container.get('Fl64_Web_Session_Back_Store_RDb_Repo_Session$');
const ATTR = repoSession.getSchema().getAttributes();

// TEST CONSTANTS
const USER_AGENT = 'Mozilla/5.0';
const USER_IP = '192.168.0.1';
const UUID = 'session_uuid';
const DATE_CREATED = new Date();
const DATE_EXPIRES = new Date(new Date().getTime() + 3600000); // 1 hour later
let SESSION_ID, USER_REF;

// Test Suite for Session Repository
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
        dto.date_created = DATE_CREATED;
        dto.date_expires = DATE_EXPIRES;
        dto.date_last = new Date();
        dto.user_agent = USER_AGENT;
        dto.user_ip = USER_IP;
        dto.user_ref = USER_REF;
        dto.uuid = UUID;

        const {primaryKey} = await repoSession.createOne({dto});
        SESSION_ID = primaryKey[ATTR.ID];
        assert.ok(primaryKey, 'Session should be created');
    });

    it('should read an existing session by ID', async () => {
        const {record} = await repoSession.readOne({key: {id: SESSION_ID}});

        assert.ok(record, 'Session should exist');
        assert.strictEqual(record.id, SESSION_ID, 'Session ID should match');
        assert.strictEqual(record.user_agent, USER_AGENT, 'User agent should match');
    });

    it('should list all sessions', async () => {
        const {records} = await repoSession.readMany({});

        assert.ok(records.length > 0, 'There should be at least one session');
    });

    it('should update an existing session', async () => {
        const {record} = await repoSession.readOne({key: {id: SESSION_ID}});
        record.user_agent = 'Updated-Agent';

        const {updatedCount} = await repoSession.updateOne({
            key: {id: SESSION_ID},
            updates: {user_agent: 'Updated-Agent'}
        });

        assert.strictEqual(updatedCount, 1, 'One session should be updated');
        const {record: updated} = await repoSession.readOne({key: {id: SESSION_ID}});
        assert.strictEqual(updated.user_agent, 'Updated-Agent', 'User agent should be updated');
    });

    it('should delete an existing session', async () => {
        const {deletedCount} = await repoSession.deleteOne({key: {id: SESSION_ID}});

        assert.strictEqual(deletedCount, 1, 'One session should be deleted');
    });
});
