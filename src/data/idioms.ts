import type { Idiom } from "../types/models";

const normalizeList = (value: string[] | string | undefined): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

/** Full idiom definitions. Topics reference these by phrase in `idioms: [...]`. */
export const createIdiom = ({
  idiom,
  date = "",
  meaning = "",
  pronunciation = "",
  example = "",
  usage = "",
  summary = "",
  notes = "",
  questions = [],
  favorite = false,
  completed = false,
}: {
  idiom: string;
  date?: string;
  meaning?: string;
  pronunciation?: string;
  example?: string;
  usage?: string;
  summary?: string;
  notes?: string;
  questions?: string[] | string;
  favorite?: boolean;
  completed?: boolean;
}): Idiom => ({
  idiom,
  date,
  meaning,
  pronunciation,
  example,
  usage,
  summary,
  notes,
  questions: normalizeList(questions),
  favorite,
  completed,
});

const q = (...items: string[]) => items;

export const idiomData: Idiom[] = [
  // Outgrowing friends — 2026-10-23
  createIdiom({
    idiom: "Grow apart",
    date: "2026-10-23",
    pronunciation: "ɡrəʊ əˈpɑːt",
    meaning: "To slowly become less close because lives, values, or interests change.",
    example: "They did not fight; they just grew apart after university.",
    usage: "Use for friendships or relationships that fade without a dramatic ending.",
    questions: q(
      "Have you ever grown apart from someone you still like?",
      "Is growing apart always sad, or sometimes healthy?",
    ),
  }),
  createIdiom({
    idiom: "Lose touch",
    date: "2026-10-23",
    pronunciation: "luːz tʌtʃ",
    meaning: "To stop communicating regularly with someone you used to know well.",
    example: "We were close in school, but we lost touch after I moved away.",
    usage: "Common for old friends, classmates, and former colleagues.",
    questions: q(
      "Who have you lost touch with, and do you miss them?",
      "Is losing touch always an accident?",
    ),
  }),
  createIdiom({
    idiom: "Through thick and thin",
    date: "2026-10-23",
    pronunciation: "θruː θɪk ən θɪn",
    meaning: "To stay loyal in both easy times and difficult times.",
    example: "A real friend stays with you through thick and thin, not only when life is convenient.",
    usage: "Use to describe lasting loyalty.",
    questions: q(
      "Who has stayed with you through thick and thin?",
      "Does loyalty mean you can never grow apart?",
    ),
  }),
  createIdiom({
    idiom: "Fair-weather friend",
    date: "2026-10-23",
    pronunciation: "feə ˈweðə frend",
    meaning: "Someone who is friendly only when things are easy or useful.",
    example: "When he lost his job, he learned who was a friend and who was only a fair-weather friend.",
    usage: "Use as criticism of shallow loyalty.",
    questions: q(
      "How can you recognize a fair-weather friend?",
      "Have you ever been a fair-weather friend without meaning to?",
    ),
  }),
  createIdiom({
    idiom: "Birds of a feather",
    date: "2026-10-23",
    pronunciation: "bɜːdz əv ə ˈfeðə",
    meaning: "People who are similar often become friends and stay close.",
    example: "They became close quickly — birds of a feather, with the same humor and the same values.",
    usage: "Short for birds of a feather flock together.",
    questions: q(
      "Do you need to be birds of a feather to stay friends?",
      "Can people stay close after they stop being similar?",
    ),
  }),

  // Fake it until you make it — 2026-10-22
  createIdiom({
    idiom: "Fake it till you make it",
    date: "2026-10-22",
    pronunciation: "feɪk ɪt tɪl ju meɪk ɪt",
    meaning: "To act confident or skilled until the feeling or ability becomes real.",
    example: "She was nervous before the talk, so she faked it till she made it and spoke as if she belonged there.",
    usage: "Use for courage in new roles, interviews, or public speaking.",
    questions: q(
      "When has faking it till you make it helped you?",
      "Is this advice honest, or does it teach people to hide?",
    ),
  }),
  createIdiom({
    idiom: "Put on a brave face",
    date: "2026-10-22",
    pronunciation: "pʊt ɒn ə breɪv feɪs",
    meaning: "To look calm or strong even when you feel afraid or upset.",
    example: "He put on a brave face at work, even though he felt completely unprepared.",
    usage: "Use when someone hides worry to keep going.",
    questions: q(
      "When do you put on a brave face?",
      "Does this protect you, or isolate you?",
    ),
  }),
  createIdiom({
    idiom: "Keep up appearances",
    date: "2026-10-22",
    pronunciation: "kiːp ʌp əˈpɪərənsɪz",
    meaning: "To hide problems so that life still looks successful or under control.",
    example: "They kept up appearances on social media, but they were struggling at home.",
    usage: "Often about image, pride, or social pressure.",
    questions: q(
      "Why do people work so hard to keep up appearances?",
      "What is the cost of looking fine when you are not?",
    ),
  }),
  createIdiom({
    idiom: "In over your head",
    date: "2026-10-22",
    pronunciation: "ɪn ˈəʊvə jə hed",
    meaning: "To be in a situation that is too difficult for your current skill or experience.",
    example: "On the first day of the new job, she felt in over her head.",
    usage: "Use when a challenge is bigger than your preparation.",
    questions: q(
      "Have you ever felt in over your head?",
      "Should you admit it, or fake confidence until you catch up?",
    ),
  }),
  createIdiom({
    idiom: "Talk the talk",
    date: "2026-10-22",
    pronunciation: "tɔːk ðə tɔːk",
    meaning: "To speak as if you have the skill, confidence, or values — whether or not you fully live them yet.",
    example: "He could talk the talk in meetings, but he still needed practice to walk the walk.",
    usage: "Often paired with walk the walk; can be praise or criticism.",
    questions: q(
      "Is talking the talk a useful first step?",
      "How do you know when someone only talks the talk?",
    ),
  }),

  // Time and healing — 2026-10-21
  createIdiom({
    idiom: "Time heals all wounds",
    date: "2026-10-21",
    pronunciation: "taɪm hiːlz ɔːl wuːndz",
    meaning: "The idea that pain becomes easier as time passes.",
    example: "After the breakup she kept telling herself that time heals all wounds, but some days still felt heavy.",
    usage: "Often used as comfort, though it is not always true.",
    questions: q(
      "Do you believe time heals all wounds?",
      "When is this phrase helpful, and when is it too simple?",
    ),
  }),
  createIdiom({
    idiom: "Water under the bridge",
    date: "2026-10-21",
    pronunciation: "ˈwɔːtər ˈʌndə ðə brɪdʒ",
    meaning: "A past problem that you no longer want to argue about.",
    example: "We argued last year, but that is water under the bridge now.",
    usage: "Use when a conflict is treated as finished.",
    questions: q(
      "What in your life is truly water under the bridge?",
      "Can something be water under the bridge for one person and not the other?",
    ),
  }),
  createIdiom({
    idiom: "Let bygones be bygones",
    date: "2026-10-21",
    pronunciation: "let ˈbaɪɡɒnz bi ˈbaɪɡɒnz",
    meaning: "To forgive or stop talking about past mistakes and start again.",
    example: "They decided to let bygones be bygones and rebuild the friendship.",
    usage: "Use when people choose peace over old arguments.",
    questions: q(
      "When is it wise to let bygones be bygones?",
      "Is this the same as pretending nothing happened?",
    ),
  }),
  createIdiom({
    idiom: "Turn over a new leaf",
    date: "2026-10-21",
    pronunciation: "tɜːn ˈəʊvər ə njuː liːf",
    meaning: "To change your behavior and begin a better way of living.",
    example: "After years of avoiding the problem, he turned over a new leaf and started being honest.",
    usage: "Use for a fresh start in habits, character, or relationships.",
    questions: q(
      "Have you ever tried to turn over a new leaf?",
      "What makes a new start last instead of fading after a week?",
    ),
  }),
  createIdiom({
    idiom: "Wipe the slate clean",
    date: "2026-10-21",
    pronunciation: "waɪp ðə sleɪt kliːn",
    meaning: "To forget past mistakes and treat the situation as if it is new.",
    example: "She wanted to wipe the slate clean, but trust still needed time to return.",
    usage: "Use when people offer a complete fresh start.",
    questions: q(
      "Can you really wipe the slate clean after a serious hurt?",
      "What is the difference between a clean slate and real healing?",
    ),
  }),

  // Saying no — 2026-10-11
  createIdiom({
    idiom: "Draw the line",
    date: "2026-10-11",
    pronunciation: "drɔː ðə laɪn",
    meaning: "To set a limit on what you will accept or do.",
    example: "She was happy to help after work, but she drew the line at answering messages at midnight.",
    usage: "Use when someone decides a request or behavior has gone too far.",
    questions: q(
      "Where do you draw the line with friends or family?",
      "Is it harder to draw the line with people you love?",
    ),
  }),
  createIdiom({
    idiom: "Stand your ground",
    date: "2026-10-11",
    pronunciation: "stænd jə ɡraʊnd",
    meaning: "To refuse to change your decision or opinion, even under pressure.",
    example: "He stood his ground and said he could not take on another project this week.",
    usage: "Use when someone stays firm instead of giving in.",
    questions: q(
      "When was the last time you stood your ground?",
      "Is standing your ground the same as being stubborn?",
    ),
  }),
  createIdiom({
    idiom: "Bite your tongue",
    date: "2026-10-11",
    pronunciation: "baɪt jə tʌŋ",
    meaning: "To stay quiet even though you want to speak, disagree, or refuse.",
    example: "She bit her tongue instead of saying no, and then spent the weekend doing extra work.",
    usage: "Use when someone holds back a true reaction to keep peace.",
    questions: q(
      "When do you bite your tongue, and do you regret it later?",
      "Is biting your tongue kindness, fear, or both?",
    ),
  }),
  createIdiom({
    idiom: "Bend over backwards",
    date: "2026-10-11",
    pronunciation: "bend ˈəʊvə ˈbækwədz",
    meaning: "To try extremely hard to please someone or meet their needs.",
    example: "He bent over backwards for the group, but nobody noticed how tired he was.",
    usage: "Often used when effort to help becomes excessive.",
    questions: q(
      "Who do you bend over backwards for, and is it healthy?",
      "Does this habit create gratitude or expectation?",
    ),
  }),
  createIdiom({
    idiom: "Walk all over someone",
    date: "2026-10-11",
    pronunciation: "wɔːk ɔːl ˈəʊvə ˈsʌmwʌn",
    meaning: "To treat someone badly because they never refuse or defend themselves.",
    example: "If you never say no, some people will walk all over you without even noticing.",
    usage: "Use when a person is used or ignored because they are too agreeable.",
    questions: q(
      "Have you ever let someone walk all over you?",
      "What is the first sign that this is happening?",
    ),
  }),

  // Comparing yourself — 2026-10-05
  createIdiom({
    idiom: "The grass is always greener",
    date: "2026-10-05",
    pronunciation: "ðə ɡrɑːs ɪz ˈɔːlweɪz ˈɡriːnə",
    meaning: "Other people's situations always seem better than your own.",
    example: "She keeps changing jobs because she believes the grass is always greener somewhere else.",
    usage: "Use when someone idealizes another life or choice.",
    questions: q(
      "When have you felt the grass was greener somewhere else?",
      "Does this idiom warn us against comparison?",
    ),
  }),
  createIdiom({
    idiom: "Keep up with the Joneses",
    date: "2026-10-05",
    pronunciation: "kiːp ʌp wɪð ðə ˈdʒəʊnzɪz",
    meaning: "To try to match the lifestyle, possessions, or status of people around you.",
    example: "They bought a bigger car just to keep up with the Joneses.",
    usage: "Often about social pressure and spending.",
    questions: q(
      "Is keeping up with the Joneses more common online now?",
      "What does this habit do to happiness?",
    ),
  }),
  createIdiom({
    idiom: "Green with envy",
    date: "2026-10-05",
    pronunciation: "ɡriːn wɪð ˈenvi",
    meaning: "Extremely envious of someone else's success or advantages.",
    example: "He was green with envy when his colleague got the promotion.",
    usage: "Informal; strong envy.",
    questions: q(
      "Can being green with envy ever push someone to grow?",
      "How do you handle envy without becoming bitter?",
    ),
  }),
  createIdiom({
    idiom: "Apples and oranges",
    date: "2026-10-05",
    pronunciation: "ˈæplz ənd ˈɒrɪndʒɪz",
    meaning: "Two things that are too different to be fairly compared.",
    example: "Comparing your quiet progress with their public success is apples and oranges.",
    usage: "Use when a comparison is unfair or meaningless.",
    questions: q(
      "When is comparing two lives just apples and oranges?",
      "Why do people still make unfair comparisons?",
    ),
  }),
  createIdiom({
    idiom: "Raise the bar",
    date: "2026-10-05",
    pronunciation: "reɪz ðə bɑː",
    meaning: "To set a higher standard than before.",
    example: "Her discipline raised the bar for everyone on the team.",
    usage: "Can be motivating when the standard is personal, not competitive.",
    questions: q(
      "Is raising the bar healthier than competing with others?",
      "Who should raise the bar for your life: you or other people?",
    ),
  }),

  // Liked or Respected — 2026-09-24
  createIdiom({
    idiom: "Put someone on a pedestal",
    date: "2026-09-24",
    pronunciation: "pʊt ˈsʌmwʌn ɒn ə ˈpedɪstl",
    meaning: "To admire someone so much that you treat them as perfect or better than ordinary people.",
    example: "Fans often put celebrities on a pedestal and ignore their mistakes.",
    usage: "Use when admiration becomes unrealistic or excessive.",
    questions: q(
      "Have you ever put someone on a pedestal?",
      "Is it healthy to put people on a pedestal?",
    ),
  }),
  createIdiom({
    idiom: "Win someone over",
    date: "2026-09-24",
    pronunciation: "wɪn ˈsʌmwʌn ˈəʊvə",
    meaning: "To persuade someone to like you, support you, or agree with you.",
    example: "She won the team over with honesty and hard work, not charm alone.",
    usage: "Use when trust or support is gained gradually.",
    questions: q(
      "What usually helps you win someone over?",
      "Can you win people over without changing who you are?",
    ),
  }),
  createIdiom({
    idiom: "Look up to",
    date: "2026-09-24",
    pronunciation: "lʊk ʌp tuː",
    meaning: "To admire and respect someone.",
    example: "Many students look up to teachers who are both kind and demanding.",
    usage: "Use for genuine respect, often toward role models.",
    questions: q(
      "Who do you look up to, and why?",
      "Is looking up to someone different from wanting to be liked by them?",
    ),
  }),
  createIdiom({
    idiom: "Be in someone's good books",
    date: "2026-09-24",
    pronunciation: "biː ɪn ˈsʌmwʌnz ɡʊd bʊks",
    meaning: "To be liked or approved of by someone at the moment.",
    example: "He is in the manager's good books after finishing the project early.",
    usage: "Informal; often about temporary approval.",
    questions: q(
      "Is being in someone's good books the same as being respected?",
      "How quickly can you fall out of someone's good books?",
    ),
  }),
  createIdiom({
    idiom: "Go along to get along",
    date: "2026-09-24",
    pronunciation: "ɡəʊ əˈlɒŋ tə ɡet əˈlɒŋ",
    meaning: "To agree or stay quiet just to keep peace, even if you do not fully agree.",
    example: "She went along to get along in the meeting, but she was not convinced.",
    usage: "Use when people choose harmony over honesty.",
    questions: q(
      "When is going along to get along wise, and when is it weak?",
      "Does this habit make people like you more or respect you less?",
    ),
  }),

  // Control Your Thoughts — 2026-09-23
  createIdiom({
    idiom: "Hit the nail on the head",
    date: "2026-09-23",
    pronunciation: "hɪt ðə neɪl ɒn ðə hed",
    meaning: "To describe something exactly right.",
    example: "When she said we were avoiding the hard decision, she hit the nail on the head.",
    usage: "Use when someone names the truth precisely.",
    questions: q(
      "Can you remember a time when someone hit the nail on the head?",
      "Is exact honesty always welcome?",
    ),
  }),
  createIdiom({
    idiom: "Food for thought",
    date: "2026-09-23",
    pronunciation: "fuːd fə θɔːt",
    meaning: "An idea that is interesting and worth thinking about carefully.",
    example: "His question about habits gave us real food for thought.",
    usage: "Use after hearing an idea that deserves reflection.",
    questions: q(
      "What recent idea gave you food for thought?",
      "Does food for thought always change your behavior?",
    ),
  }),
  createIdiom({
    idiom: "Cross your mind",
    date: "2026-09-23",
    pronunciation: "krɒs jɔː maɪnd",
    meaning: "To come into your thoughts briefly.",
    example: "It crossed my mind that I might be overthinking the situation.",
    usage: "Use for sudden or passing thoughts.",
    questions: q(
      "What kinds of thoughts cross your mind when you are stressed?",
      "Should we act on every thought that crosses our mind?",
    ),
  }),
  createIdiom({
    idiom: "Lost in thought",
    date: "2026-09-23",
    pronunciation: "lɒst ɪn θɔːt",
    meaning: "So focused on your thinking that you do not notice what is around you.",
    example: "She was lost in thought and almost missed her stop.",
    usage: "Use for deep or distracted thinking.",
    questions: q(
      "When do you usually get lost in thought?",
      "Is being lost in thought helpful or unhelpful?",
    ),
  }),
  createIdiom({
    idiom: "On your mind",
    date: "2026-09-23",
    pronunciation: "ɒn jɔː maɪnd",
    meaning: "Occupying your thoughts, often because you are worried or concerned.",
    example: "You seem quiet today. Is something on your mind?",
    usage: "Common in caring check-ins and everyday conversation.",
    questions: q(
      "How do you know when something is really on your mind?",
      "Does talking about what is on your mind make it lighter?",
    ),
  }),

  // Truly Attractive — 2026-09-22
  createIdiom({
    idiom: "Catch someone's eye",
    date: "2026-09-22",
    pronunciation: "kætʃ ˈsʌmwʌnz aɪ",
    meaning: "To attract someone's attention, often because of appearance or presence.",
    example: "His calm confidence caught everyone's eye as soon as he entered.",
    usage: "Use for first attention, not necessarily deep attraction.",
    questions: q(
      "What usually catches your eye first in a person?",
      "Can personality catch someone's eye as much as appearance?",
    ),
  }),
  createIdiom({
    idiom: "Turn heads",
    date: "2026-09-22",
    pronunciation: "tɜːn hedz",
    meaning: "To attract a lot of attention because you look impressive or unusual.",
    example: "She turned heads at the event, but her kindness left a stronger impression.",
    usage: "Often about appearance; can be positive or superficial.",
    questions: q(
      "Is turning heads the same as being attractive long-term?",
      "What makes someone turn heads for reasons beyond looks?",
    ),
  }),
  createIdiom({
    idiom: "Have a way with people",
    date: "2026-09-22",
    pronunciation: "hæv ə weɪ wɪð ˈpiːpl",
    meaning: "To be naturally skilled at communicating with and attracting others.",
    example: "He has a way with people that makes strangers feel comfortable quickly.",
    usage: "Use for social ease and interpersonal skill.",
    questions: q(
      "Do you think having a way with people is natural or learned?",
      "How is this different from being fake?",
    ),
  }),
  createIdiom({
    idiom: "Wear your heart on your sleeve",
    date: "2026-09-22",
    pronunciation: "weə jɔː hɑːt ɒn jɔː sliːv",
    meaning: "To show your feelings openly instead of hiding them.",
    example: "She wears her heart on her sleeve, so people always know how she feels.",
    usage: "Use for emotional openness and vulnerability.",
    questions: q(
      "Is wearing your heart on your sleeve attractive or risky?",
      "When should people hide their feelings instead?",
    ),
  }),
  createIdiom({
    idiom: "Fall for someone",
    date: "2026-09-22",
    pronunciation: "fɔːl fə ˈsʌmwʌn",
    meaning: "To start feeling romantic attraction or love for someone.",
    example: "He fell for her after noticing how thoughtfully she treated others.",
    usage: "Informal; romantic contexts.",
    questions: q(
      "What makes people fall for someone beyond first impressions?",
      "Can you fall for someone's character more than their appearance?",
    ),
  }),

  // Love and leave — 2026-09-20
  createIdiom({
    idiom: "Bite the bullet",
    date: "2026-09-20",
    pronunciation: "baɪt ðə ˈbʊlɪt",
    meaning: "To force yourself to do something difficult or unpleasant because it is necessary.",
    example: "They bit the bullet and ended the relationship kindly but clearly.",
    usage: "Use for hard but necessary decisions.",
    questions: q(
      "When is leaving someone a case of biting the bullet?",
      "Does delaying a hard goodbye make it easier or harder?",
    ),
  }),
  createIdiom({
    idiom: "Call it quits",
    date: "2026-09-20",
    pronunciation: "kɔːl ɪt kwɪts",
    meaning: "To decide to stop doing something, especially a relationship or effort.",
    example: "After months of conflict, they finally called it quits.",
    usage: "Informal; endings and stop decisions.",
    questions: q(
      "How do people know it is time to call it quits?",
      "Can calling it quits still be an act of care?",
    ),
  }),
  createIdiom({
    idiom: "Go your separate ways",
    date: "2026-09-20",
    pronunciation: "ɡəʊ jɔː ˈseprət weɪz",
    meaning: "To end a relationship or partnership and live different lives.",
    example: "They still cared for each other, but they needed to go their separate ways.",
    usage: "Use for mutual or inevitable endings.",
    questions: q(
      "Is going your separate ways always a failure?",
      "Can love remain after people go their separate ways?",
    ),
  }),
  createIdiom({
    idiom: "Have a soft spot for",
    date: "2026-09-20",
    pronunciation: "hæv ə sɒft spɒt fə",
    meaning: "To feel special affection or kindness toward someone.",
    example: "She still had a soft spot for him even after they broke up.",
    usage: "Use for lasting fondness that may not equal a healthy relationship.",
    questions: q(
      "Can you have a soft spot for someone and still leave them?",
      "Does a soft spot make leaving harder?",
    ),
  }),
  createIdiom({
    idiom: "A blessing in disguise",
    date: "2026-09-20",
    pronunciation: "ə ˈblesɪŋ ɪn dɪsˈɡaɪz",
    meaning: "Something that seems bad at first but later leads to a good result.",
    example: "Ending that relationship was a blessing in disguise for both of them.",
    usage: "Use after setbacks that later prove helpful.",
    questions: q(
      "Can leaving someone become a blessing in disguise?",
      "Why is it hard to see blessings in disguise at the time?",
    ),
  }),

  // Impossible to forget — 2026-09-16
  createIdiom({
    idiom: "Stick in your mind",
    date: "2026-09-16",
    pronunciation: "stɪk ɪn jɔː maɪnd",
    meaning: "To be remembered clearly for a long time.",
    example: "That conversation stuck in my mind for years.",
    usage: "Use for strong, lasting memories.",
    questions: q(
      "What kinds of people stick in your mind?",
      "Do painful memories stick more than happy ones?",
    ),
  }),
  createIdiom({
    idiom: "Ring a bell",
    date: "2026-09-16",
    pronunciation: "rɪŋ ə bel",
    meaning: "To sound familiar, even if you cannot remember the details.",
    example: "His name rings a bell, but I cannot remember where we met.",
    usage: "Use for partial or uncertain recognition.",
    questions: q(
      "Why do some names ring a bell years later?",
      "Is ringing a bell the same as truly remembering someone?",
    ),
  }),
  createIdiom({
    idiom: "Slip your mind",
    date: "2026-09-16",
    pronunciation: "slɪp jɔː maɪnd",
    meaning: "To be forgotten, usually temporarily.",
    example: "Sorry I didn't reply — your message completely slipped my mind.",
    usage: "Use for ordinary forgetting, not deep emotional memory.",
    questions: q(
      "What usually slips your mind when you are busy?",
      "Why do unimportant details slip our minds more easily?",
    ),
  }),
  createIdiom({
    idiom: "Trip down memory lane",
    date: "2026-09-16",
    pronunciation: "trɪp daʊn ˈmeməri leɪn",
    meaning: "To spend time remembering pleasant experiences from the past.",
    example: "Looking at old photos sent us on a trip down memory lane.",
    usage: "Usually positive nostalgia.",
    questions: q(
      "When do you take a trip down memory lane?",
      "Can nostalgia make someone harder to forget?",
    ),
  }),
  createIdiom({
    idiom: "Come back to haunt you",
    date: "2026-09-16",
    pronunciation: "kʌm bæk tə hɔːnt juː",
    meaning: "To cause problems later because of something from the past.",
    example: "Unfinished conversations can come back to haunt you years later.",
    usage: "Use for past events that return emotionally or practically.",
    questions: q(
      "Can people we try to forget come back to haunt us?",
      "How do we stop the past from haunting the present?",
    ),
  }),

  // Kept from original seed for Money topic later / general use
  createIdiom({
    idiom: "Break the ice",
    date: "2026-09-24",
    pronunciation: "breɪk ði aɪs",
    meaning: "To make people feel more comfortable in a social situation.",
    example: "He told a short funny story to break the ice at the start of the meeting.",
    usage: "Use when people meet for the first time or feel awkward.",
    questions: q(
      "What is a natural way to break the ice with someone new?",
      "Is humor always a good way to break the ice?",
    ),
  }),
  // Money and happiness — 2026-09-08
  createIdiom({
    idiom: "Cost an arm and a leg",
    date: "2026-09-08",
    pronunciation: "kɒst ən ɑːm ənd ə leɡ",
    meaning: "To be extremely expensive.",
    example: "The tickets cost an arm and a leg, so we decided to travel another week.",
    usage: "Informal; high prices.",
    questions: q(
      "What costs an arm and a leg but still feels worth it?",
      "When does a high price become unreasonable?",
    ),
  }),
  createIdiom({
    idiom: "Money does not grow on trees",
    date: "2026-09-08",
    pronunciation: "ˈmʌni dʌz nɒt ɡrəʊ ɒn triːz",
    meaning: "Money is limited and should not be wasted.",
    example: "We cannot buy every gadget — money does not grow on trees.",
    usage: "Often said when advising someone to spend carefully.",
    questions: q(
      "When did you last hear that money does not grow on trees?",
      "Does this saying encourage healthy spending or fear?",
    ),
  }),
  createIdiom({
    idiom: "Tighten your belt",
    date: "2026-09-08",
    pronunciation: "ˈtaɪtn jɔː belt",
    meaning: "To spend less money because you need to save or have less income.",
    example: "After rent went up, they had to tighten their belt for a few months.",
    usage: "Use for temporary financial discipline.",
    questions: q(
      "When is it wise to tighten your belt?",
      "Can tightening your belt improve happiness?",
    ),
  }),
  createIdiom({
    idiom: "Live beyond your means",
    date: "2026-09-08",
    pronunciation: "lɪv bɪˈjɒnd jɔː miːnz",
    meaning: "To spend more money than you can afford.",
    example: "Living beyond your means can create stress even if your lifestyle looks impressive.",
    usage: "Use for unsustainable spending habits.",
    questions: q(
      "Why do people live beyond their means?",
      "Is social pressure a major cause?",
    ),
  }),
  createIdiom({
    idiom: "Pay the price",
    date: "2026-09-08",
    pronunciation: "peɪ ðə praɪs",
    meaning: "To suffer the consequences of a decision or action.",
    example: "If you chase status too hard, you may pay the price with your peace of mind.",
    usage: "Can be financial or emotional consequences.",
    questions: q(
      "Have you ever paid the price for a money decision?",
      "Can happiness make us pay a price too?",
    ),
  }),
  createIdiom({
    idiom: "Slow and steady wins the race",
    date: "2026-10-06",
    pronunciation: "sloʊ ənd ˈstɛdi wɪnz ðə reɪs",
    meaning: "A consistent and calm effort usually leads to better results than rushing.",
    example: "She stopped comparing herself to others and focused on the idea that slow and steady wins the race.",
    usage: "Use to encourage patience, persistence, and realistic progress.",
    questions: q(
      "When have you seen slow and steady effort beat a rushed plan?",
      "Does this idea still work in a fast-moving world?",
    ),
  }),
  createIdiom({
    idiom: "Take your time",
    date: "2026-10-06",
    pronunciation: "teɪk jər taɪm",
    meaning: "To proceed without rushing or feeling pressured.",
    example: "Take your time deciding — a thoughtful choice is better than a rushed one.",
    usage: "Use when someone needs space to think carefully.",
    questions: q(
      "When do you need to hear someone say, 'take your time'?",
      "Does being in a hurry ever improve your decisions?",
    ),
  }),
  createIdiom({
    idiom: "Pace yourself",
    date: "2026-10-06",
    pronunciation: "peɪs jərˈself",
    meaning: "To avoid overdoing things by keeping a sustainable rhythm.",
    example: "If you pace yourself, you can stay productive without burning out.",
    usage: "Use for managing energy, workload, and effort over time.",
    questions: q(
      "How do you know when you are not pacing yourself well?",
      "Why do people struggle to pace themselves even when they know the value of it?",
    ),
  }),
  createIdiom({
    idiom: "At a snail's pace",
    date: "2026-10-06",
    pronunciation: "ət ə sneɪlz peɪs",
    meaning: "To move very slowly, especially when progress feels frustratingly gradual.",
    example: "The project moved at a snail's pace because every step needed careful review.",
    usage: "Use when progress is slow but steady or disappointing.",
    questions: q(
      "What types of goals feel like they move at a snail's pace?",
      "Can slow progress still be healthy progress?",
    ),
  }),
  createIdiom({
    idiom: "No rush",
    date: "2026-10-06",
    pronunciation: "noʊ rʌʃ",
    meaning: "A way of saying that there is no need to hurry.",
    example: "No rush — I would rather we make a better decision than rush the choice.",
    usage: "Common in polite, reassuring conversation.",
    questions: q(
      "When is saying 'no rush' more helpful than pushing someone to act quickly?",
      "Does this phrase make people feel calmer or more lazy?",
    ),
  }),
  createIdiom({
    idiom: "Put yourself out there",
    date: "2026-10-25",
    pronunciation: "pʊt jərˈself aʊt ðer",
    meaning: "To make yourself visible or share your ideas, even if it feels uncomfortable.",
    example: "Posting her artwork online was a way to put herself out there.",
    usage: "Use when someone takes a social risk by sharing or showing who they are.",
    questions: q(
      "When is it helpful to put yourself out there?",
      "Can you be yourself online without sharing everything?",
    ),
  }),
  createIdiom({
    idiom: "Keep it to yourself",
    date: "2026-10-25",
    pronunciation: "kiːp ɪt tə jərˈself",
    meaning: "To choose not to tell other people something.",
    example: "He decided to keep the personal details to himself instead of posting them.",
    usage: "Use when someone chooses to keep information private.",
    questions: q(
      "What kinds of information would you rather keep to yourself?",
      "Is it ever difficult to keep something to yourself online?",
    ),
  }),
  createIdiom({
    idiom: "Leave a digital footprint",
    date: "2026-10-25",
    pronunciation: "liːv ə ˈdɪdʒɪtəl ˈfʊtprɪnt",
    meaning: "To leave a record of your activity when you use the internet.",
    example: "Every public comment can leave a digital footprint.",
    usage: "Use when talking about information or activity that remains online.",
    questions: q(
      "What should people consider before leaving a digital footprint?",
      "Can someone ever completely erase their digital footprint?",
    ),
  }),
  createIdiom({
    idiom: "In the public eye",
    date: "2026-10-25",
    pronunciation: "ɪn ðə ˈpʌblɪk aɪ",
    meaning: "Known or watched by many people.",
    example: "People in the public eye may find it harder to protect their private lives.",
    usage: "Use for people who receive a lot of attention from the public.",
    questions: q(
      "Would you enjoy being in the public eye?",
      "Should famous people have the same right to privacy as everyone else?",
    ),
  }),
  createIdiom({
    idiom: "For all to see",
    date: "2026-10-25",
    pronunciation: "fɔːr ɔːl tə siː",
    meaning: "Visible to everyone, rather than kept private.",
    example: "She was surprised to find that the photo was posted online for all to see.",
    usage: "Use when something is shared openly or made public.",
    questions: q(
      "Would you be comfortable with your private life being there for all to see?",
      "Should people ask permission before sharing someone else's photo for all to see?",
    ),
  }),
];
