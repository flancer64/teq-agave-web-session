import {container} from '@teqfw/test';
import assert from 'assert';

// GET OBJECTS FROM CONTAINER
/** @type {Fl64_Web_Session_Shared_Dto_Session} */
const domDto = await container.get('Fl64_Web_Session_Shared_Dto_Session$');
/** @type {Fl64_Web_Session_Back_Store_RDb_Schema_Session} */
const rdbDto = await container.get('Fl64_Web_Session_Back_Store_RDb_Schema_Session$');
/** @type {Fl64_Web_Session_Back_Convert_Session} */
const converter = await container.get('Fl64_Web_Session_Back_Convert_Session$');

describe('Fl64_Web_Session_Back_Convert_Session', () => {
    const sampleRdbDto = rdbDto.createDto();
    const sampleDomDto = domDto.createDto();

    beforeEach(() => {
        // Initialize RDB DTO
        sampleRdbDto.date_created = new Date('2023-01-01T00:00:00Z');
        sampleRdbDto.date_expires = new Date('2023-01-02T00:00:00Z');
        sampleRdbDto.date_last = new Date('2023-01-01T12:00:00Z');
        sampleRdbDto.id = 1;
        sampleRdbDto.user_agent = 'Mozilla/5.0';
        sampleRdbDto.user_ip = '192.168.0.1';
        sampleRdbDto.user_ref = 123;
        sampleRdbDto.uuid = 'uuid-12345';

        // Initialize Domain DTO
        sampleDomDto.dateCreated = new Date('2023-01-01T00:00:00Z');
        sampleDomDto.dateExpires = new Date('2023-01-02T00:00:00Z');
        sampleDomDto.dateLast = new Date('2023-01-01T12:00:00Z');
        sampleDomDto.id = 1;
        sampleDomDto.userAgent = 'Mozilla/5.0';
        sampleDomDto.userIp = '192.168.0.1';
        sampleDomDto.userRef = 123;
        sampleDomDto.uuid = 'uuid-12345';
    });

    it('should convert RDB DTO to Domain DTO correctly', () => {
        const domDtoConverted = converter.db2dom({dbSession: sampleRdbDto});
        assert.deepStrictEqual(
            domDtoConverted,
            sampleDomDto,
            'Converted Domain DTO should match the sample Domain DTO'
        );
    });

    it('should convert Domain DTO to RDB DTO correctly', () => {
        const rdbDtoConverted = converter.dom2db({session: sampleDomDto});
        assert.deepStrictEqual(
            rdbDtoConverted,
            sampleRdbDto,
            'Converted RDB DTO should match the sample RDB DTO'
        );
    });
});
