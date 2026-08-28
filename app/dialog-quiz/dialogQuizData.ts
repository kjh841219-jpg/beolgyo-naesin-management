import { historicalDialogSets } from "./historicalDialogQuizData";

export type DialogLine={speaker:string;en:string;ko:string};
export type DialogSet={publisher:string;grade:string;lesson:string;title:string;source:string;lines:DialogLine[]};
const l=(speaker:string,en:string,ko:string):DialogLine=>({speaker,en,ko});

const recentDialogSets:DialogSet[]=[
 {publisher:"천재교육 · 소영순",grade:"중학교 2학년",lesson:"6과",title:"공유 자전거 이용하기",source:"(2022개정)2026년_중2_천재(소영순)_6과_[01]내용정리 플러스.pdf",lines:[
  l("W","Excuse me, how can I use this bike?","실례합니다, 이 자전거를 어떻게 사용할 수 있나요?"),l("M","It's simple. First, sign up for our app. Then, add your credit card.","간단해요. 먼저 저희 앱에 등록하세요. 그다음 신용카드를 추가하세요."),l("W","Umm, okay. I did. What's next?","음, 알겠어요. 했어요. 그다음은요?"),l("M","Lastly, tag your phone on the bike.","마지막으로 자전거에 휴대 전화를 태그하세요."),l("W","Oh, it worked.","오, 됐어요."),l("M","Great. Enjoy your ride.","좋아요. 즐겁게 타세요."),l("W","Thank you.","감사합니다.") ]},
 {publisher:"천재교육 · 소영순",grade:"중학교 2학년",lesson:"6과",title:"박물관 가는 버스",source:"(2022개정)2026년_중2_천재(소영순)_6과_[01]내용정리 플러스.pdf",lines:[
  l("B","Mom, many buses stop here.","엄마, 여기에 많은 버스들이 서네요."),l("W","That's true. We should be careful not to take the wrong bus.","맞아. 우리는 버스를 잘못 타지 않도록 조심해야 해."),l("B","Which bus do we have to take?","우리는 어떤 버스를 타야 해요?"),l("W","We should take bus number 270.","우리는 270번 버스를 타야 해."),l("B","Okay, Mom. How long will it take to get to the museum?","알겠어요, 엄마. 박물관에 가는 데 얼마나 걸릴까요?"),l("W","It'll take about 30 minutes.","30분 정도 걸릴 거야."),l("B","The name of the stop is National Science Museum, right?","정류장 이름이 국립 과학 박물관 맞죠?"),l("W","Yes, don't forget to prepare your bus card.","응, 버스 카드를 준비하는 것을 잊지 마."),l("B","Oh, I got it.","아, 알겠어요.") ]},
 {publisher:"천재교육 · 소영순",grade:"중학교 2학년",lesson:"6과",title:"키오스크로 주문하기",source:"(2022개정)2026년_중2_천재(소영순)_6과_[01]내용정리 플러스.pdf",lines:[
  l("M","Excuse me, I want to order with this machine. Can you help me, please?","실례합니다, 이 기계로 주문하고 싶은데요. 저를 도와주실 수 있나요?"),l("W","Of course. First, select your hamburger on the screen.","물론이죠. 먼저 화면에서 햄버거를 선택하세요."),l("M","Hmm. I want to have a cheeseburger.","음. 저는 치즈버거를 먹고 싶어요."),l("W","Second, choose your side dish and drink. What do you want?","두 번째로 사이드 메뉴와 음료를 고르세요. 무엇을 원하세요?"),l("M","I want to have French fries and orange juice.","감자튀김과 오렌지주스를 먹고 싶어요."),l("W","Then, pay on the next page. That's all.","그런 다음 다음 페이지에서 결제하세요. 그게 다예요."),l("M","Okay, I got it. Thanks.","네, 알겠어요. 감사합니다."),l("W","You're welcome.","천만에요.") ]},
 {publisher:"천재교육 · 소영순",grade:"중학교 2학년",lesson:"6과",title:"에어프라이어 사용법",source:"(2022개정)2026년_중2_천재(소영순)_6과_[01]내용정리 플러스.pdf",lines:[
  l("Lily","Dad, I want to use the air fryer.","아빠, 저 에어프라이어를 사용하고 싶어요."),l("Dad","The air fryer? What do you want to do with it, Lily?","에어프라이어? 그것으로 무엇을 하고 싶니, Lily?"),l("Lily","I'd like to bake sweet potatoes. How do I use the air fryer?","고구마를 굽고 싶어요. 에어프라이어를 어떻게 사용하나요?"),l("Dad","It's simple. First, put some sweet potatoes in the air fryer.","간단해. 먼저 에어프라이어에 고구마를 좀 넣어."),l("Lily","Okay, I did. What's next?","알겠어요. 했어요. 그다음은요?"),l("Dad","Then, turn the round button to set the temperature to 200 degrees Celsius.","그다음 둥근 버튼을 돌려서 온도를 200도로 맞춰."),l("Lily","200 degrees Celsius, anything else?","200도요. 또 다른 건요?"),l("Dad","Lastly, set the time to 20 minutes and press the start button.","마지막으로 시간을 20분으로 설정하고 시작 버튼을 눌러."),l("Lily","Oh, it's easy.","오, 쉽네요."),l("Dad","Right. Don't forget to use oven gloves when you take them out.","맞아. 고구마를 꺼낼 때 오븐 장갑을 사용하는 것을 잊지 마."),l("Lily","I see. Thanks, Dad.","알겠어요. 고마워요, 아빠.") ]},
 {publisher:"비상교육 · 황종배",grade:"중학교 2학년",lesson:"6과",title:"역사 보고서",source:"(2022개정)2026년_중2_비상(황종배)_6과_[01]내용정리 플러스.pdf",lines:[
  l("Henry","What are you writing, Sophia?","Sophia, 너 뭐 쓰고 있어?"),l("Sophia","I'm writing my history report.","나는 역사 보고서를 쓰고 있어."),l("Henry","History report? Oh, no! I forgot about it.","역사 보고서? 오, 안 돼! 나 그걸 깜빡했어."),l("Sophia","It's due tomorrow. You don't have much time. You have to start writing it right away.","그거 내일까지야. 너는 시간이 별로 없어. 당장 쓰기 시작해야 해."),l("Henry","You're right. I should.","네 말이 맞아. 그래야겠어.") ]},
 {publisher:"비상교육 · 황종배",grade:"중학교 2학년",lesson:"6과",title:"과학 실험 안전",source:"(2022개정)2026년_중2_비상(황종배)_6과_[01]내용정리 플러스.pdf",lines:[
  l("Ms. Kim","Are you all ready to do our science experiment?","과학 실험할 준비 모두 다 됐나요?"),l("Tom and Emma","Yes, we are.","네, 준비됐어요."),l("Ms. Kim","Wait, Tom. You have to wear safety glasses first.","잠깐, Tom. 너는 먼저 안전 안경을 착용해야 해."),l("Tom","Oh, I'm sorry, Ms. Kim.","아, 죄송합니다, 김 선생님."),l("Ms. Kim","Remember safety always comes first.","항상 안전이 최우선이라는 걸 기억하렴.") ]},
 {publisher:"비상교육 · 황종배",grade:"중학교 2학년",lesson:"6과",title:"저녁 식사 시간",source:"(2022개정)2026년_중2_비상(황종배)_6과_[01]내용정리 플러스.pdf",lines:[
  l("M","Mom, can I go out and play soccer with my friends?","엄마, 친구들과 축구하러 나가도 돼요?"),l("W","Sure. But remember, grandma is coming over for dinner tonight.","물론이지. 하지만 오늘 밤에 할머니가 저녁 식사하러 오신다는 걸 기억하렴."),l("M","Yes, Mom. When should I come home?","네, 엄마. 언제 집에 와야 해요?"),l("W","You have to come home by 6:00 p.m.","너는 오후 6시까지는 집에 와야 해."),l("M","I see. I'll come home by then.","알겠어요. 그때까지 집에 올게요.") ]},
 {publisher:"비상교육 · 황종배",grade:"중학교 2학년",lesson:"6과",title:"캠핑장 규칙",source:"(2022개정)2026년_중2_비상(황종배)_6과_[01]내용정리 플러스.pdf",lines:[
  l("M","Here we are at the campsite, Kate.","여기 캠핑장에 도착했구나, Kate."),l("W","I really like it here, Dad.","저는 정말 여기가 좋아요, 아빠."),l("M","I'm happy that you like it. Look, here are some rules we have to follow. Let's see.","네가 좋아해서 행복하구나. 봐, 여기 우리가 따라야 할 규칙들이 있구나."),l("W","Okay. What are the rules?","알겠어요. 규칙들이 뭐예요?"),l("M","First, we have to take our trash home. We should take care of nature.","첫째, 우리는 쓰레기를 집으로 가져가야 해. 우리는 자연을 보호해야 해."),l("W","I see.","알겠어요."),l("M","And one more, we have to be quiet after 10 p.m. Some people go to sleep early.","그리고 하나 더, 우리는 밤 10시 이후에는 조용히 해야 해. 어떤 사람들은 일찍 자거든."),l("W","Okay, Dad.","알겠어요, 아빠.") ]},
 {publisher:"비상교육 · 황종배",grade:"중학교 2학년",lesson:"6과",title:"과학관 우주 구역",source:"(2022개정)2026년_중2_비상(황종배)_6과_[01]내용정리 플러스.pdf",lines:[
  l("Olivia","There are many sections in this science museum.","이 과학 박물관에는 많은 구역이 있어."),l("Noah","Yes. Where do you want to go first?","맞아. 너는 먼저 어디로 가고 싶어?"),l("Olivia","The space section. I'm really curious about the moon.","우주 구역. 나는 달에 대해 정말 궁금해."),l("Noah","Then, let's go there first.","그럼 먼저 거기로 가자.") ]},
 {publisher:"비상교육 · 황종배",grade:"중학교 2학년",lesson:"6과",title:"과학 캠프",source:"(2022개정)2026년_중2_비상(황종배)_6과_[01]내용정리 플러스.pdf",lines:[
  l("M","Kate, do you know anything about the science camp this year?","Kate, 너는 올해 과학 캠프에 대해 뭐 아는 거 있어?"),l("W","Yeah. It's from September 10th to 12th on the school field.","응. 9월 10일부터 12일까지 학교 운동장에서 열려."),l("M","Are there any special programs at the camp?","캠프에 특별한 프로그램이 있니?"),l("W","Yes. There's a special talk about life in the sea.","응. 바다 속 생명에 관한 특별 강연이 있어."),l("M","Oh, I'm really curious about that.","오, 나는 그것에 대해 정말 궁금해."),l("W","Me, too. Are you going to go to the camp?","나도 그래. 너는 캠프에 갈 거니?"),l("M","Yes, I am.","응, 갈 거야."),l("W","Great. I'll see you there.","잘됐네. 거기서 봐.") ]}
];

const allDialogSets:DialogSet[]=[...historicalDialogSets,...recentDialogSets];
const miraeDialogSets=allDialogSets
 .filter(set=>set.publisher==="미래엔 · 최연희")
 .sort((a,b)=>Number.parseInt(a.lesson)-Number.parseInt(b.lesson));
let miraeIndex=0;

export const dialogSets:DialogSet[]=allDialogSets.map(set=>
 set.publisher==="미래엔 · 최연희"?miraeDialogSets[miraeIndex++]:set
);
