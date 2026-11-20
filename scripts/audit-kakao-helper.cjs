// Non-UI regression checks. This script never opens Kakao or sends messages.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const helper = fs.readFileSync(path.join(root, 'tools/kakao-helper/kakao-connect.ahk'), 'utf8');
const page = fs.readFileSync(path.join(root, 'app/admin/page.tsx'), 'utf8');
const install = fs.readFileSync(path.join(root, 'tools/kakao-helper/install.ps1'), 'utf8');
let passed = 0;
function check(name, predicate) {
  assert.ok(predicate, name);
  console.log(`PASS ${name}`);
  passed++;
}
check('Hidden main-window lookup restores visibility settings', /FindMain\(\)[\s\S]*?DetectHiddenWindows true[\s\S]*?finally[\s\S]*?DetectHiddenWindows previousSetting/.test(helper));
check('Hidden lookup only accepts logged-in main-view structure', /WinGetTitle\("ahk_id " hwnd\) = "카카오톡" && DllCall\("GetDlgItem", "Ptr", hwnd, "Int", 132/.test(helper));
check('Search is scoped to visible chat-list container', /"Int", 1150/.test(helper) && /SearchEdit\(view\)[\s\S]*?IsWindowVisible/.test(helper));
check('Search shortcut targets Kakao instead of foreground window', helper.includes('ControlSend("^f", view)') && !helper.includes('Send "^f"'));
check('Background search still verifies the exact search control', helper.includes('SearchEdit(ChatView(main)) != search'));
check('No direct WM_SETTEXT message composition', !/ControlSetText\(text, editor\)/.test(helper));
check('Clipboard contents are restored after paste', /savedClipboard := ClipboardAll\(\)[\s\S]*?finally[\s\S]*?A_Clipboard := savedClipboard/.test(helper));
check('Real paste and Enter events are used', helper.includes('SendEvent "^v"') && helper.includes('SendEvent "{Enter}"'));
check('Exact editor focus checked immediately before Enter', /AssertEditor\(chat, editor\)\s+SendEvent "\{Enter\}"/.test(helper));
check('Result receipt is persisted before sending', helper.indexOf('IniWrite("attempted-') < helper.indexOf('SendEvent "{Enter}"'));
check('Uncertain send cannot be retried without explicit confirmation', /previousAttempt != ""[\s\S]*?MsgBox[\s\S]*?YesNo Default2[\s\S]*?retryConsent != "Yes"/.test(helper));
check('Lock is acquired for all three native modes', helper.indexOf('sendLock := DllCall("CreateMutex"') < helper.indexOf('    if mode = "send" {'));
const catchBody = helper.slice(helper.lastIndexOf('} catch as err {'));
check('Error dialogs do not retain operation lock', catchBody.indexOf('ReleaseMutex') >= 0 && catchBody.indexOf('ReleaseMutex') < catchBody.indexOf('MsgBox'));
check('Diagnostic tests cannot send or show error dialogs', /--self-test"[\s\S]*?RunSelfTests\(\)[\s\S]*?ExitApp 0/.test(helper) && /if A_Args.Length = 1 && A_Args\[1\] = "--self-test"\s+ExitApp 1/.test(catchBody));
check('Browser distinguishes request from delivery', /state: "requested"/.test(page) && page.includes('웹 표시만으로 전송 성공을 보장하지'));
check('Saved-room actions use a native link rather than programmatic navigation', /href=\{kakaoPcUri\(item, mode, room\)\}/.test(page) && !page.includes('window.location.href = `beolgyo-kakao:'));
check('Overlong protocol addresses fail visibly instead of being silently submitted', page.includes('event.currentTarget.href.length > 1900') && page.includes('내용은 잘라서 보내지 않았습니다'));
check('Edge and Chrome share authenticated server room configuration', page.includes('Microsoft Edge / Google Chrome') && page.includes('외부 앱 열기 확인창') && page.includes('/api/admin/kakao-rooms') && page.includes('공통 연결 다시 불러오기'));
check('Installer checks official runtime checksum', install.includes('Get-FileHash') && install.includes('https://www.autohotkey.com/download/ahk-v2.zip'));
check('Installer registers a dedicated application name and command', install.includes('Applications\\BeolgyoKakaoConnector.exe') && install.includes("-Name 'FriendlyAppName'") && install.includes('$application\\shell\\open\\command') && install.includes("-Name 'ApplicationName'"));
check('Installer notifies Windows of association changes', install.includes('SHChangeNotify(0x08000000, 0x1000'));
for (const mode of ['test', 'compose', 'send']) {
  const message = '[벌교미래엔영어]\n김정해 3/12 · 25점 😊\n따뜻하게 응원합니다.';
  const query = new URLSearchParams({room: '미래엔영어벌교김정해', mode, text: mode === 'test' ? '' : message});
  const uri = new URL(`beolgyo-kakao://${mode}?${query}`);
  check(`Browser URL roundtrip (${mode})`, uri.hostname === mode && uri.searchParams.get('room') === '미래엔영어벌교김정해' && uri.searchParams.get('text') === (mode === 'test' ? '' : message));
}
console.log(`KAKAO_REGRESSION_CHECKS_PASSED=${passed}`);
