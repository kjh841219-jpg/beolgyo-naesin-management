import type {AddedPassage} from "./additionalQuizData";

const q=(en:string,ko:string)=>({
  en,ko,
  keywords:ko.replace(/[^가-힣A-Za-z0-9 ]/g," ").split(/\s+/).filter((word)=>word.length>=2).slice(0,6),
});

export const bisangHwangJongbaeLessons7And8Passages:AddedPassage[]=[
  {
    publisher:"비상교육 · 황종배",grade:"중학교 2학년",lesson:"7과",title:"Food Brings Us Together",
    sentences:[
      q("Hello, I'm Minchan!","안녕하세요, 저는 민찬이에요!"),
      q("Today, my family and I are at my grandmother's house to do gimjang.","오늘 저희 가족과 저는 김장을 하기 위해 할머니 댁에 있어요."),
      q("What is gimjang?","김장은 무엇일까요?"),
      q("It is a Korean cultural tradition to get together and make a lot of kimchi before winter comes.","그것은 겨울이 오기 전에 함께 모여 많은 김치를 만드는 한국의 문화적 전통이에요."),
      q("Gimjang is more than making kimchi.","김장은 김치를 만드는 것 이상이에요."),
      q("It's also about spending time with family.","그것은 또한 가족과 시간을 보내는 것에 관한 것이에요."),
      q("It is always good to get together.","함께 모이는 것은 언제나 좋아요."),
      q("Do you also have any special food traditions?","여러분도 어떤 특별한 음식 전통이 있나요?"),
      q("Hi, I'm Emil!","안녕하세요, 저는 Emil이에요!"),
      q("We also have this kind of cultural tradition in Azerbaijan.","아제르바이잔에도 이런 종류의 문화적 전통이 있어요."),
      q("Here's a picture from my aunt's wedding.","여기 제 이모 결혼식 사진이 있어요."),
      q("Do you see the thing on her shoulder?","그녀의 어깨 위에 있는 물건이 보이나요?"),
      q("It's a flatbread.","그것은 플랫브레드예요."),
      q("It is so big that it covers her shoulder.","그것은 매우 커서 그녀의 어깨를 덮어요."),
      q("We believe that putting the bread over the shoulder brings good luck.","우리는 그 빵을 어깨 위에 올려두는 것이 행운을 가져온다고 믿어요."),
      q("A flatbread is made only from flour, salt, and water.","플랫브레드는 밀가루, 소금, 물로만 만들어져요."),
      q("We eat this bread at every meal, but we make it bigger on special days.","우리는 매 끼니에 이 빵을 먹지만, 특별한 날에는 더 크게 만들어요."),
      q("So, everyone in the community gets together and helps out.","그래서 공동체에 있는 모든 사람이 함께 모여서 도와줘요."),
      q("Baking the bread together makes our community stronger.","함께 빵을 굽는 일은 우리 공동체를 더욱 단단하게 만들어 줘요."),
      q("I'm Vivian!","저는 Vivian이에요!"),
      q("Have you heard of hawker centers in Singapore?","여러분은 싱가포르에 있는 호커 센터에 대해 들어 본 적 있나요?"),
      q("Hawkers are people who sell food on the street.","호커는 길거리에서 음식을 파는 사람들을 말해요."),
      q("They formed the hawker centers and these centers have become a huge food community.","그들이 호커 센터를 만들었고, 이 센터들이 거대한 음식 공동체가 되었어요."),
      q("These centers are so popular that they are always full of people.","이 센터들은 매우 인기 있어서 늘 사람들로 가득 차요."),
      q("There are all kinds of food, from Chinese noodles to Malaysian curry to Indonesian satay.","중국식 국수부터 말레이시아식 카레, 인도네시아식 사테까지 모든 종류의 음식들이 있어요."),
      q("My friends and I are from different countries.","제 친구들과 저는 서로 다른 나라 출신이에요."),
      q("We all have different food tastes.","우리는 모두 음식 취향이 달라요."),
      q("But at the hawker centers, we can always find something we like.","하지만 호커 센터에서 우리는 항상 우리가 좋아하는 것을 찾을 수 있어요."),
      q("Sometimes, we share the tables with strangers and end up becoming friends.","때때로 우리는 낯선 사람들과 테이블을 함께 쓰다가 친구가 되기도 해요."),
      q("It is fun to enjoy the food with good people.","좋은 사람들과 함께 음식을 즐기는 건 재미있어요."),
      q("That's why I love this hawker culture.","그게 제가 이 호커 문화를 사랑하는 이유예요.")
    ]
  },
  {
    publisher:"비상교육 · 황종배",grade:"중학교 2학년",lesson:"8과",title:"The Last Wild Race",
    sentences:[
      q("Do you know what the most challenging race in the world is?","여러분은 세상에서 가장 도전적인 경주가 무엇인지 아시나요?"),
      q("It is 'The Last Wild Race'!","그것은 ‘마지막 야생 경주(The Last Wild Race)’입니다!"),
      q("You should join us in Southern Patagonia, Chile.","여러분은 칠레의 남부 파타고니아에서 우리와 함께하셔야 합니다."),
      q("It is one of the last wild areas on Earth!","이곳은 지구상의 마지막 야생 지역 중 하나입니다!"),
      q("Every year, many teams from all over the world join the race.","매년 전 세계에서 온 많은 팀들이 이 경주에 참여합니다."),
      q("For this race, you need not only strength but also teamwork.","이 경주를 위해서, 여러분은 힘뿐만 아니라 팀워크도 필요합니다."),
      q("What Is the Race Like?","경주는 어떤 모습일까요?"),
      q("The race course is more than 500 kilometers long and it changes every year.","경주 코스는 500km 이상 길이가 되고 그것은 매년 바뀝니다."),
      q("Do you know when the teams find out the course for the year?","팀들이 그해의 코스를 언제 알게 되는지 아시나요?"),
      q("Just a day before the race!","바로 경주 하루 전입니다!"),
      q("During the race, each team goes through the wild by doing different activities.","경주 동안, 각 팀은 다양한 활동들을 함으로써 야생을 통과합니다."),
      q("They walk on rough ground, ride bikes on tough roads, and row boats on rapid water.","그들은 거친 땅을 걷고, 험한 길에서 자전거를 타며, 속도가 빠른 물 위에서 배를 젓습니다."),
      q("The race is not just about sports.","그 경주는 단지 스포츠에 관한 것만은 아닙니다."),
      q("The teams also need to take care of nature.","팀들은 또한 자연을 돌볼 필요가 있습니다."),
      q("They must not make fires or leave trash behind during the race.","그들은 경주 중에 불을 피우거나 쓰레기를 남기지 말아야 합니다."),
      q("Everyone should protect the natural environment of Southern Patagonia.","모두가 남부 파타고니아의 자연환경을 보호해야 합니다."),
      q("What Are the Rules of the Race?","경주의 규칙은 무엇인가요?"),
      q("To join the event, all teams must follow a few rules.","이 행사에 참가하기 위해 모든 팀들은 몇 가지 규칙을 따라야 합니다."),
      q("For example, a team of four must have at least one man and one woman.","예를 들어, 4명으로 구성된 팀에는 적어도 한 명의 남자와 한 명의 여자가 있어야 합니다."),
      q("Every member must show that they are healthy.","모든 팀원은 그들이 건강하다는 것을 보여줘야 합니다."),
      q("Also, each team must pass some tests that check their skills in using ropes, reading maps, and giving first aid.","또한, 각 팀은 로프 사용하기, 지도 읽기, 응급 처치하기에서의 기술들을 확인하는 몇 가지 테스트를 통과해야 합니다."),
      q("This is important because the race is very tough, and everyone needs to be ready for the challenges.","이것은 중요한데 왜냐하면 경주가 매우 힘들어서 모든 사람이 도전에 준비되어 있어야 하기 때문입니다."),
      q("To finish the race, each team must reach every checkpoint.","경주를 끝내기 위해, 각 팀은 모든 체크포인트에 도달해야 합니다."),
      q("The first team to finish the race wins.","가장 먼저 경주를 마치는 팀이 승리합니다."),
      q("Join Us!","함께하세요!"),
      q("Are you ready to experience 'The Last Wild Race'?","‘마지막 야생 경주’를 경험할 준비가 되셨나요?"),
      q("Don't miss out on this amazing adventure!","이 놀라운 모험을 놓치지 마세요!"),
      q("This wild journey is not only exciting but also meaningful.","이 야생의 여정은 흥미진진할 뿐만 아니라 의미도 있을 것입니다."),
      q("Sign up today and enjoy moments that will last a lifetime.","오늘 바로 등록하고 평생 지속될 순간들을 즐겨보세요.")
    ]
  }
];
