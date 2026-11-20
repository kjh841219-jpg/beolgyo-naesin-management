const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {validateKakaoRooms, mergeKakaoRoomSources, kakaoRoomConflicts} = require('../app/kakao-room-config.ts');
let count=0;
function check(name, action){action();console.log(`PASS ${name}`);count++;}
check('Korean names preserved and outer whitespace trimmed',()=>assert.equal(validateKakaoRooms({test:' 테스트방 '}).test,'테스트방'));
for(const value of [null,[],{test:''},{test:'a\nb'},{test:'a'.repeat(121)},JSON.parse('{"__proto__":"test"}'),{test:1}])check('Invalid room configuration rejected',()=>assert.throws(()=>validateKakaoRooms(value)));
check('Server recipient wins over stale local browser configuration',()=>assert.deepEqual(mergeKakaoRoomSources({one:'old',two:'local'},{one:'shared'}),{one:'shared',two:'local'}));
check('Conflict detection does not mutate either input',()=>{const input={one:'old',two:'same'},shared={one:'new',two:'same'};assert.deepEqual(kakaoRoomConflicts(input,shared),['one']);assert.equal(input.one,'old');assert.equal(shared.one,'new');});
check('New bindings do not conflict',()=>assert.deepEqual(kakaoRoomConflicts({one:'new'},{}),[]));
const route=fs.readFileSync(path.resolve(__dirname,'../app/api/admin/kakao-rooms/route.ts'),'utf8');
const store=fs.readFileSync(path.resolve(__dirname,'../app/record-store.ts'),'utf8');
check('Every read and write requires administrator authentication',()=>assert.equal((route.match(/if \(!await isAdminAuthenticated\(\)\)/g)||[]).length,2));
check('Room data is never publicly cached',()=>assert.ok(route.includes('private, no-store')));
check('Import preserves already configured recipients atomically',()=>assert.ok(store.includes('ON CONFLICT (key) DO NOTHING')));
check('Different browser bindings have separate database keys',()=>assert.ok(store.includes('kakao-room-v1:')&&store.includes('createHash("sha256").update(contactKey)')));
console.log(`KAKAO_ROOM_SYNC_CHECKS_PASSED=${count}`);
