import type {DialogSet} from "./dialogQuizData";

const l=(speaker:string,en:string,ko:string)=>({speaker,en,ko});
const source="(2022개정)2026년_중2_비상(황종배)_7과_[01]내용정리 플러스.pdf";
const common={publisher:"비상교육 · 황종배",grade:"중학교 2학년",lesson:"7과",source};

export const bisangHwangJongbaeMiddle2Lesson7DialogSets:DialogSet[]=[
  {...common,title:"한라산 등반 경험",lines:[
    l("Olivia","Have you climbed Hallasan?","너는 한라산에 올라가 본 적 있어?"),
    l("Liam","No, I haven't. Have you?","아니, 없어. 너는?"),
    l("Olivia","No, but I'm going to go there with my uncle this weekend.","나는 없지만, 이번 주말에 삼촌과 함께 거기에 갈 거야."),
    l("Liam","That's cool. I hope you have a great time with your family.","멋지다. 네가 가족과 좋은 시간을 보내길 바라."),
    l("Olivia","Thanks.","고마워.")
  ]},
  {...common,title:"시드니 여행 계획",lines:[
    l("Emma","What are you going to do this winter?","너는 이번 겨울에 뭐 할 거야?"),
    l("Noah","I'm going to travel to Sydney. Have you been there?","나는 시드니로 여행 갈 거야. 너는 거기에 가 본 적 있어?"),
    l("Emma","No, I haven't. What are your plans there?","아니, 없어. 거기서 너의 계획은 뭐야?"),
    l("Noah","I'm going to visit the Sydney Opera House with my family.","나는 가족과 함께 시드니 오페라 하우스를 방문할 거야."),
    l("Emma","Sounds exciting!","정말 신나겠다!")
  ]},
  {...common,title:"Steve Kim의 마술쇼",lines:[
    l("Chloe","What are you watching?","너는 무엇을 보고 있니?"),
    l("Ethan","I'm watching Steve Kim's magic show. Have you watched his show before?","난 Steve Kim의 마술쇼를 보고 있어. 너는 그의 쇼를 전에 본 적 있어?"),
    l("Chloe","Yes, I have. I really like his show.","응, 있어. 난 그의 쇼를 정말 좋아해."),
    l("Ethan","Look at this card magic. It is amazing.","이 카드 마술 좀 봐. 정말 놀라워."),
    l("Chloe","Yeah, he moves his hands really fast!","응, 그는 손을 정말 빠르게 움직인다!")
  ]},
  {...common,title:"베트남 문화 원데이 클래스",lines:[
    l("M","Excuse me, I'd like to sign up for a one-day class.","실례합니다, 저는 원데이 클래스를 신청하고 싶어요."),
    l("W","Have you taken a one-day class here before?","여기서 전에 원데이 클래스를 들어 본 적 있으세요?"),
    l("M","No, this is my first time.","아니요, 이번이 처음이에요."),
    l("W","Okay, I'll help you. What do you want to learn?","알겠습니다, 제가 도와드릴게요. 무엇을 배우고 싶으세요?"),
    l("M","I'm interested in experiencing foreign cultures.","저는 외국 문화를 체험하는 데 관심이 있어요."),
    l("W","Then, we have two Vietnamese culture classes. One is hat-making and the other is traditional cooking.","그러면 베트남 문화 수업이 두 가지가 있어요. 하나는 모자 만들기이고, 다른 하나는 전통 요리예요."),
    l("M","Oh, I'd love to make a Vietnamese hat.","오, 저는 베트남 모자를 만들어 보고 싶어요."),
    l("W","That's a great choice! The hat-making class is a lot of fun.","좋은 선택이에요! 모자 만들기 수업은 매우 재미있어요.")
  ]},
  {...common,title:"간식으로 만든 핫도그",lines:[
    l("Susan","Hi, Dad. I'm home.","안녕하세요, 아빠. 저 집에 왔어요."),
    l("Dad","Hi, Susan. I've made some hot dogs for a snack. Would you like some?","안녕, Susan. 간식으로 핫도그를 만들었어. 좀 먹어 볼래?"),
    l("Susan","Actually, I just had gimbap with my friends. Can I have them later?","사실, 방금 친구들과 김밥을 먹고 왔어요. 나중에 먹어도 될까요?"),
    l("Dad","Sure. I'll put them in the refrigerator.","물론이지. 냉장고에 넣어 둘게."),
    l("Susan","Thank you, Dad.","감사합니다, 아빠.")
  ]},
  {...common,title:"크림 떡볶이",lines:[
    l("Lily","Are you making spaghetti, Uncle David? It smells really good.","David 삼촌, 스파게티 만들고 계세요? 냄새가 정말 좋아요."),
    l("David","No. I'm making tteokbokki.","아니야. 떡볶이를 만들고 있어."),
    l("Lily","Is it really tteokbokki? The sauce is white.","정말 떡볶이 맞아요? 소스가 하얀데요."),
    l("David","Yes. I've made a creamy one. Would you like some?","응. 크림 소스로 만들었어. 좀 먹어 볼래?"),
    l("Lily","Okay, I'll try it.","네, 한 번 먹어 볼게요.")
  ]},
  {...common,title:"아침을 못 먹은 Grace",lines:[
    l("Grace","I'm so hungry, but it's only 10 a.m.","나 배가 너무 고파, 그런데 아직 오전 10시야."),
    l("Owen","Didn't you eat anything in the morning?","너는 아침에 아무것도 안 먹었어?"),
    l("Grace","No. I woke up late, so I couldn't.","응. 나는 늦게 일어나서 못 먹었어."),
    l("Owen","I brought some sandwiches. Would you like some?","내가 샌드위치를 좀 가져왔어. 좀 먹어 볼래?"),
    l("Grace","Oh, that would be great. Thank you.","오, 너무 좋아. 고마워.")
  ]},
  {...common,title:"Lucy가 만든 파에야",lines:[
    l("M","What are you cooking, Lucy?","Lucy, 너는 뭐 요리하고 있어?"),
    l("Lucy","I'm making paella. I'm going to share it with my friends at school tomorrow.","나는 파에야를 만들고 있어. 내일 학교에서 친구들과 그걸 나눠 먹을 거야."),
    l("M","Oh, what is paella?","오, 파에야가 뭐야?"),
    l("Lucy","It's a traditional Spanish rice dish with seafood and vegetables.","그건 해산물과 채소가 들어간 스페인 전통 쌀 요리야."),
    l("M","It smells nice.","냄새가 좋다."),
    l("Lucy","Would you like some?","좀 먹어 볼래?"),
    l("M","Yes, I'd like some. Wow, it tastes really good. I'm sure your friends will love this.","응, 먹어 볼게. 와, 정말 맛있다. 네 친구들은 분명 이걸 좋아할 거야."),
    l("Lucy","Thanks. I hope so.","고마워. 그러길 바라.")
  ]}
];
