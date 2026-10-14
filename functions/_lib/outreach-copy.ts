// The emails the owner sends by hand from the contact centre.
//
// Copy SSOT: Plans/01_email_and_nurture/outreach-copy-v2.md (the research,
// the angle and the do-nots for each situation live there). Edit there first,
// then mirror here.
//
// THE RULES THESE ARE WRITTEN TO
//  - A personal note from Akshay, 50 to 125 words, plain paragraphs, one link
//    at most. Short personal plain-text mail is what gets replies and stays out
//    of the Promotions tab.
//  - The ask is a question they can answer in one line. A reply is worth more
//    than a click: it tells you the objection, and replies help deliverability.
//  - Quote achievement, never surveillance. Lessons finished and exercises
//    solved are theirs and flattering. Pricing visits, wall-hit counts and
//    "I saw you opened my email" are never said back to anyone.
//  - No prices: regional pricing means the number belongs on the page, in
//    their currency. No deadlines: none exists, and invented urgency is the
//    fastest way to lose a careful reader.
//  - Any email that asks for money carries the 14-day refund.
//  - No invented numbers. A paragraph whose figure is missing is dropped
//    whole, never padded (fillCopy below).
//  - Never compare the reader with other members, never talk the free side
//    down, never offer anything in exchange for a review.

export type Group = "hot" | "customer" | "reengage";

export interface OutreachTemplate {
  key: string;
  group: Group;
  label: string;
  when: string;          // the situation it is written for
  angle: string;         // what it does, shown to the owner in the composer
  avoid: string;         // what it must not do, shown beside the angle
  category: "offers" | "account";
  reason: string;        // the footer's "You get this because ..."
  requires: string[];    // tokens that must have a value for it to be offered
  subject: string;
  preheader: string;
  body: string;
}

const SITE = "https://r-statistics.co";

export const OUTREACH: OutreachTemplate[] = [
  {
    key: "checkout-help", group: "hot", label: "Checkout not finished",
    when: "Opened checkout in the last week and did not buy. The automatic recovery note (with its 15% code) may already have gone.",
    angle: "Service, not sales. Name the three real blockers, offer to fix each by email, and make a one-line reply the easy next step.",
    avoid: "A new discount on top of the automatic 15% (it teaches people to wait), counting their visits, guilt, \"just checking in\".",
    category: "offers", reason: "you started a checkout at r-statistics.co", requires: [],
    subject: "Can I help with your checkout?",
    preheader: "Card, currency, an invoice for work, or the plan itself. Each one is fixable.",
    body: [
      "Hi {first_name},",
      "Your checkout on r-statistics.co didn't go through, and I wanted to check in myself in case something got in the way.",
      "When this happens it's nearly always one of three things: the card or the currency, needing an invoice your employer can pay, or not being sure which plan is right. I can sort out any of those over email.",
      "Which was it for you? One line back is plenty.",
      `[Your checkout is still here when you're ready -> ${SITE}/pricing.html]`,
      "Akshay",
    ].join("\n\n"),
  },
  {
    key: "wall-goal", group: "hot", label: "Reached the paid part",
    when: "Reached a Pro lesson in the last week. The automatic wall note has usually already explained what is behind it.",
    angle: "Talk about their goal, not the product. Ask what they are learning R for and offer a personal recommendation, free lessons included. Mention the low-risk way in once.",
    avoid: "Repeating the automatic note's list of topics, saying how often they hit the wall, calling the free side thin.",
    category: "offers", reason: "you have an account on r-statistics.co", requires: ["track_name"],
    subject: "What are you learning R for?",
    preheader: "Tell me in a line and I'll point you to the lessons that matter most.",
    body: [
      "Hi {first_name},",
      "You've reached the paid part of the {track_name} track, so I wanted to write to you myself.",
      "Can I ask what you're learning R for? A job, a thesis, a project at work? Tell me in a line and I'll point you to the lessons that will matter most for it, free ones included.",
      "If you do decide to go further, the monthly plan is the easy way to try it, and every plan comes with a 14-day full refund.",
      `[See the plans in your currency -> ${SITE}/pricing.html]`,
      "Akshay",
    ].join("\n\n"),
  },
  {
    key: "plan-help", group: "hot", label: "Weighing up the plans",
    when: "Came back to the plans on two or more days in the last two weeks without opening checkout.",
    angle: "Decision help. The short honest version of which plan suits whom, the low-risk start, and an offer to recommend one, including \"free is enough for now\".",
    avoid: "Saying you saw them on the pricing page, quoting prices (they differ by country), pressure or deadlines.",
    category: "offers", reason: "you have an account on r-statistics.co", requires: [],
    subject: "The short version on the plans",
    preheader: "Which plan suits what, and when free is enough.",
    body: [
      "Hi {first_name},",
      "If you're weighing up the plans, here's the short version I'd give a friend.",
      "If you're working towards one thing, like analysis or forecasting, Single Track covers that track in full. If you'd like room to move between tracks, All-Access is the one most people pick. Monthly billing on either is the low-risk way in, and you can cancel from your account at any time.",
      "Every plan comes with a 14-day full refund, no questions asked.",
      "Tell me what you're working towards and I'll say honestly which one I'd pick, even if the answer is that free covers it for now.",
      `[Compare the plans -> ${SITE}/pricing.html]`,
      "Akshay",
    ].join("\n\n"),
  },
  {
    key: "work-pays", group: "hot", label: "Employer might pay",
    when: "A warm lead whose profile says they work (persona or job role), or who mentioned work. A second angle after checkout help or plan help.",
    angle: "Many companies have a training budget. Offer the paperwork that unlocks it (a receipt finance accepts, a note for the manager) and the team plan for groups.",
    avoid: "Assuming they are employed when the profile does not say so, promising an invoice format before you have checked you can produce it.",
    category: "offers", reason: "you have an account on r-statistics.co", requires: [],
    subject: "Could your employer cover this?",
    preheader: "Many training budgets do. I can help with the paperwork.",
    body: [
      "Hi {first_name},",
      "A lot of people learning R here are doing it for their job, and plenty of companies have a training budget that covers courses like this.",
      "If that might be you, I'm happy to help with the paperwork: a receipt your finance team will accept, or a short note for your manager on what the course covers. And if a few of you want to learn together, there's a team plan with a single invoice.",
      "Want me to send anything over? Just reply to this email.",
      `[See the plans, including teams -> ${SITE}/pricing.html]`,
      "Akshay",
    ].join("\n\n"),
  },
  {
    key: "follow-up", group: "hot", label: "Follow-up",
    when: "Your own email went two or more days ago and they clicked without buying, or four or more days ago with no reaction. Once per email, never twice.",
    angle: "Short and warm, one question, and an easy way to say no. Saying \"I won't chase\" is what makes people answer.",
    avoid: "\"Just bumping this\", \"Re:\" in the subject, a second pitch, mentioning that they opened or clicked.",
    category: "offers", reason: "you have an account on r-statistics.co", requires: ["last_note_date"],
    subject: "A quick question",
    preheader: "Then I'll leave it with you.",
    body: [
      "Hi {first_name},",
      "Following up on my note from {last_note_date}. Is there one thing standing between you and getting started? Tell me what it is and I'll give you a straight answer.",
      "And if now isn't the right time, that's completely fine. Say so and I won't chase.",
      "Akshay",
    ].join("\n\n"),
  },
  {
    key: "get-started", group: "customer", label: "Paid, not started",
    when: "Bought in the last month and has done very little since.",
    angle: "Protect the purchase. Point at one twenty-minute first step, invite them to say what is in the way, and (while it is open) remind them of the refund so honesty feels safe.",
    avoid: "Guilt, a feature tour, mentioning the refund once the 14 days have passed.",
    category: "offers", reason: "you have a paid plan on r-statistics.co", requires: [],
    subject: "Did you get started alright?",
    preheader: "If something's in the way, I'll clear it.",
    body: [
      "Hi {first_name},",
      "Thanks again for joining. It's been quiet since, which is usually a busy week rather than anything wrong.",
      "The quickest way in is the next lesson on your track. Twenty minutes is enough to know whether it's going to suit you.",
      `[Pick up your track -> ${SITE}/dashboard.html]`,
      "If something's in the way, or it isn't what you expected, reply and tell me.",
      "{refund_line}",
      "Akshay",
    ].join("\n\n"),
  },
  {
    key: "review", group: "customer", label: "Ask for a review",
    when: "A paying member for three weeks or more who has properly used it.",
    angle: "Specific, easy and permission-first. Two guiding questions, the critical parts welcomed, and nothing published without their yes on the exact wording.",
    avoid: "The word \"testimonial\", fishing for praise, offering anything in return (paid reviews are not honest reviews).",
    category: "offers", reason: "you have a paid plan on r-statistics.co", requires: [],
    subject: "Would you tell me what you think?",
    preheader: "Two lines is plenty, and the critical parts help most.",
    body: [
      "Hi {first_name},",
      "You've {progress_phrase} here, so you've seen enough to have a real opinion.",
      "Would you tell me what you make of it? Two questions, if it helps: what were you hoping to get from it, and has it done that? The critical parts are the most useful to me.",
      "If you're happy for a line of it to go on the site with your name and role, tell me and I'll send you the exact wording first. Nothing goes up without your yes.",
      "Akshay",
    ].join("\n\n"),
  },
  {
    key: "stay", group: "customer", label: "Plan set to cancel",
    when: "Their plan is set to end at the close of the billing period.",
    angle: "Respect the decision. Confirm their access, ask one question they can answer with a number, and offer a better-fitting plan only if their answer points there.",
    avoid: "A retention offer before they have said why, guilt, \"we're sad to see you go\".",
    category: "offers", reason: "you have a paid plan on r-statistics.co", requires: ["access_end_date"],
    subject: "Before your plan ends",
    preheader: "One question, and your access stays until {access_end_date}.",
    body: [
      "Hi {first_name},",
      "I saw your plan is set to end on {access_end_date}. You keep everything until then, and your progress stays on your profile afterwards.",
      "Could I ask what made you decide? Reply with a number if that's easier: 1, the price. 2, not enough time to use it. 3, it was missing something. 4, you got what you came for.",
      "If it's 1 or 2, tell me, because there may be a plan that suits you better. Either way, thank you for being a member.",
      "Akshay",
    ].join("\n\n"),
  },
  {
    key: "billing", group: "customer", label: "Payment failing",
    when: "Paddle reports the subscription past due.",
    angle: "Calm and practical: almost always an expired card. One link to fix it. A service email, so it can go even to someone who turned marketing off.",
    avoid: "Alarm, threats about losing access, anything that sells.",
    category: "account", reason: "you have a paid plan on r-statistics.co", requires: [],
    subject: "A payment problem on your plan",
    preheader: "Usually an expired card. A one-minute fix.",
    body: [
      "Hi {first_name},",
      "Your last payment for r-statistics.co didn't go through. That's almost always an expired card or a bank being careful, nothing dramatic.",
      "You can update your card here. It takes about a minute:",
      `[Update your payment details -> ${SITE}/account-billing.html]`,
      "If anything looks wrong on our side, reply and I'll look into it.",
      "Akshay",
    ].join("\n\n"),
  },
  {
    key: "upgrade", group: "customer", label: "Single Track, reaching other tracks",
    when: "On Single Track and has reached a Pro lesson in a track their plan does not cover.",
    angle: "A helpful heads-up: switching to All-Access is prorated and keeps everything. Offer an honest opinion on whether it is worth it.",
    avoid: "Implying they did something wrong, a hard sell, quoting the price difference (it depends on their currency and dates).",
    category: "offers", reason: "you have a paid plan on r-statistics.co", requires: ["track_name"],
    subject: "Moving into {track_name}?",
    preheader: "Switching to All-Access only charges the difference.",
    body: [
      "Hi {first_name},",
      "You've reached the {track_name} lessons, which sit outside your current plan.",
      "In case it's useful: you can switch to All-Access from the pricing page, and you only pay the difference for the time left on your plan. Everything you've done carries over.",
      `[See the switch on the pricing page -> ${SITE}/pricing.html]`,
      "If you're not sure it's worth it for you, ask me and I'll tell you honestly.",
      "Akshay",
    ].join("\n\n"),
  },
  {
    key: "probe", group: "reengage", label: "Went quiet",
    when: "Was active and has gone quiet in the last month.",
    angle: "A real question with no link. The only value of this email is an honest reply about what stopped them.",
    avoid: "Any sales link (it poisons the question), guilt, \"we miss you\".",
    category: "offers", reason: "you have an account on r-statistics.co", requires: ["progress_phrase"],
    subject: "Did you get stuck on something?",
    preheader: "No pitch. I'm just curious what stopped you.",
    body: [
      "Hi {first_name},",
      "You were going well, you'd {progress_phrase}, and then it went quiet.",
      "That's usually one of two things: life got busy, or something here was harder or duller than it should have been. If it's the second, I'd really like to know which bit.",
      "One line back is plenty. It helps me more than you'd think.",
      "Akshay",
    ].join("\n\n"),
  },
  {
    key: "welcome-back", group: "reengage", label: "Dormant, with a record",
    when: "Quiet for one to three months, with real work done before that.",
    angle: "Their own record is the reason to come back. Point at where they stopped and offer to pick the right next step for them.",
    avoid: "\"We miss you\", a discount, claiming nothing changed (daily lessons do close after three days).",
    category: "offers", reason: "you have an account on r-statistics.co", requires: ["progress_phrase"],
    subject: "Your work here is still where you left it",
    preheader: "Your progress is still on your profile.",
    body: [
      "Hi {first_name},",
      "It's been a while. Before you stopped, you'd {progress_phrase}, which is a real body of work.",
      "All of it is still on your profile, along with your XP.",
      `[Pick up where you left off -> ${SITE}/dashboard.html]`,
      "If you'd rather I pointed you at the right next thing, reply and tell me what you're working towards.",
      "Akshay",
    ].join("\n\n"),
  },
];

export const OUTREACH_BY_KEY = new Map(OUTREACH.map((t) => [t.key, t]));

export function outreachLabel(key: string): string {
  return OUTREACH_BY_KEY.get(key)?.label || key;
}

export type Tokens = Record<string, string>;

const TOKEN = /\{([a-z_]+)\}/g;

/* Fill a body. A paragraph that needs a token with no value is dropped whole
   (P3 of the copy book: never fake a figure). The greeting is the exception:
   "Hi {first_name}," becomes "Hi," rather than disappearing. */
export function fillCopy(text: string, t: Tokens): string {
  return text.split(/\n\n+/).map((p) => {
    if (/^Hi \{first_name\},$/.test(p.trim())) return t.first_name ? `Hi ${t.first_name},` : "Hi,";
    let missing = false;
    const out = p.replace(TOKEN, (m, k: string) => {
      const v = t[k];
      if (v === undefined) return m;           // unknown token: leave it visible
      if (v === "") missing = true;
      return v;
    });
    return missing ? null : out;
  }).filter((p): p is string => p !== null && p.trim() !== "").join("\n\n");
}

/* Subjects and preheaders cannot drop a paragraph, so an empty token is
   removed and the line tidied. */
export function fillLine(text: string, t: Tokens): string {
  return text.replace(TOKEN, (m, k: string) => (t[k] === undefined ? m : t[k]))
    .replace(/\s+([,.?])/g, "$1").replace(/,\s*$/, "").replace(/\s{2,}/g, " ").trim();
}

/* Tag links to this site so a visit from the email is attributable in
   analytics as well as in the click ledger. */
export function utmLinks(body: string, key: string): string {
  return body.replace(/^\[(.+?) -> (https:\/\/r-statistics\.co[^\]\s]*)\]$/gm, (_m, label: string, url: string) => {
    if (/[?&]utm_/.test(url)) return `[${label} -> ${url}]`;
    return `[${label} -> ${url}${url.includes("?") ? "&" : "?"}utm_source=email&utm_campaign=outreach-${key}]`;
  });
}

export function missingRequired(tpl: OutreachTemplate, t: Tokens): string[] {
  return tpl.requires.filter((k) => !t[k]);
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/* "finished 12 lessons and solved 23 exercises", or whichever half is true,
   or "" so the paragraph drops. */
export function progressPhrase(lessons: number, solved: number): string {
  const bits: string[] = [];
  if (lessons > 0) bits.push(`finished ${plural(lessons, "lesson", "lessons")}`);
  if (solved > 0) bits.push(`solved ${plural(solved, "exercise", "exercises")}`);
  return bits.join(" and ");
}
