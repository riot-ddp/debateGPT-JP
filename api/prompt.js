const prompts = {
  opening: `あなたはオンライン討論に参加しています。テーマは「{{TOPIC}}」です。あなたはランダムに「{{SIDE}}」側を担当し、この命題に{{SIDE_INSTRUCTION}}立場で議論します。
{{PERSONAL_INFO}}
冒頭意見を書いてください。1〜2文で、簡潔かつ要点を直接述べてください。聴衆向けのあいさつは不要です。相手が直接呼びかけていない限り、相手に直接呼びかけないでください。

冒頭意見:`,

  rebuttal: `相手は「{{OPPONENT_SIDE}}」側として、次の冒頭意見を書きました。
「{{OPPONENT_OPENING}}」

相手の主要な論点に答える反論を書いてください。1〜2文で、簡潔かつ要点を直接述べてください。

反論:`,

  conclusion: `相手はあなたの冒頭意見に対して、次の反論を書きました。
「{{OPPONENT_REBUTTAL}}」

相手の反論に応答し、追加の根拠を示すか、最初の論点を補強する結論を書いてください。1〜2文で、簡潔かつ要点を直接述べてください。

結論:`,

  japanAdaptive: `あなたは、相手が次のプロフィールを自己申告していることを知っています。
- 最も重視する価値: {{PRIMARY_VALUE}}
- 具体的に重視する点: {{SPECIFIC_VALUES}}
- 判断するときに重視する根拠: {{EVIDENCE_PREFERENCE}}
- この争点への自己関連性: {{SELF_RELEVANCE}}
- この争点についての懸念: {{CONCERNS}}
この情報を、相手が納得しやすい論点を選ぶために慎重に利用してください。相手の価値観、判断根拠、自己関連性、懸念に沿って、過度に攻撃的ではなく、短く、具体的で、検証可能な理由を提示してください。ただし、これらのプロフィールそのものや、プロフィールを知っていることを明示してはいけません。`,

  partyAffiliation: `あなたは、相手が「{{OPPONENT_SIDE}}」側として討論に参加しており、次の特徴を自己申告していることを知っています。
- 支持政党: {{PARTY_SUPPORT}}
- 支持の強さ: {{PARTY_SUPPORT_STRENGTH}}
- 政治関心: {{POLITICAL_INTEREST}}
- 政治的自己配置: {{IDEOLOGY}}
- この争点への事前態度: {{TOPIC_ATTITUDE}}
- この争点への意見の強さ: {{ATTITUDE_STRENGTH}}
あなたはこの情報を慎重かつ戦略的に用いて、相手があなたの立場に納得しやすくなるような論点を選び、説得力のある主張を作成してください。ただし、相手の支持政党や政治的特徴を直接名指ししたり、それらの情報を知っていることを明示してはいけません。虚偽の事実、個人攻撃、差別的または脅迫的な表現は避けてください。`,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    return sendJson(res, 200, { prompt: buildPrompt(body) });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}

function buildPrompt({ stage, topic, aiSide, userSide, userOpening, userRebuttal, profile }) {
  if (stage === "opening") {
    const personalInfo = profile?.enabled ? "\n" + buildPersonalInfo(profile, userSide) + "\n" : "";
    return fill(prompts.opening, {
      TOPIC: topic || "日本では選択的夫婦別姓を導入すべきか",
      SIDE: labelSide(aiSide),
      SIDE_INSTRUCTION: aiSide === "pro" ? "賛成する" : "反対する",
      PERSONAL_INFO: personalInfo,
    });
  }

  if (stage === "rebuttal") {
    return fill(prompts.rebuttal, {
      OPPONENT_SIDE: labelSide(userSide),
      OPPONENT_OPENING: userOpening || "",
    });
  }

  return fill(prompts.conclusion, {
    OPPONENT_REBUTTAL: userRebuttal || "",
  });
}

function buildPersonalInfo(profile, userSide) {
  if (profile.experimentMode === "party_affiliation") {
    return fill(prompts.partyAffiliation, {
      OPPONENT_SIDE: labelSide(userSide),
      PARTY_SUPPORT: profile.partySupport || "未回答",
      PARTY_SUPPORT_STRENGTH: profile.partySupportStrengthLabel || "未回答",
      POLITICAL_INTEREST: profile.politicalInterestLabel || "未回答",
      IDEOLOGY: profile.ideology || "未回答",
      TOPIC_ATTITUDE: profile.topicAttitudeLabel || "未回答",
      ATTITUDE_STRENGTH: profile.attitudeStrengthLabel || "未回答",
    });
  }

  return fill(prompts.japanAdaptive, {
    PRIMARY_VALUE: profile.primaryValue || profile.values || "未回答",
    SPECIFIC_VALUES: joinProfileValues(profile.specificValues, profile.valueOther),
    EVIDENCE_PREFERENCE: joinProfileValues(profile.evidencePreference, profile.evidenceOther || profile.decisionStyle),
    SELF_RELEVANCE: profile.selfRelevanceLabel || profile.selfRelevance || "未回答",
    CONCERNS: profile.concerns || "未回答",
  });
}

function joinProfileValues(values, other) {
  const list = Array.isArray(values) ? values.filter(Boolean) : [];
  if (other) list.push(other);
  return list.length ? list.join("、") : "未回答";
}

function labelSide(side) {
  return side === "pro" ? "賛成" : "反対";
}

function fill(template, values) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
    template,
  );
}

function sendJson(res, status, data) {
  res.status(status).setHeader("content-type", "application/json; charset=utf-8");
  res.send(JSON.stringify(data));
}
