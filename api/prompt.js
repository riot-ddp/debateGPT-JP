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
- 価値カテゴリの設計根拠: Schwartz価値理論、BPVI、MFQ-Jを参考にした短縮選択式
- 最も重視する価値: {{PRIMARY_VALUE}}
- あわせて重視する価値: {{SPECIFIC_VALUES}}
- 価値カテゴリに基づく説得方略: {{VALUE_GUIDELINES}}
- 判断するときに重視する根拠: {{EVIDENCE_PREFERENCE}}
- この争点への自己関連性: {{SELF_RELEVANCE}}
- この争点についての懸念: {{CONCERNS}}
この情報を、相手が納得しやすい論点を選ぶために慎重に利用してください。価値カテゴリは相手を決めつけるためではなく、見落としてはいけない観点を選ぶための手がかりです。相手の価値観、判断根拠、自己関連性、懸念に沿って、過度に攻撃的ではなく、短く、具体的で、検証可能な理由を提示してください。ただし、これらのプロフィールそのものや、プロフィールを知っていることを明示してはいけません。`,

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
    VALUE_GUIDELINES: buildValueGuidelines(profile),
    EVIDENCE_PREFERENCE: joinProfileValues(profile.evidencePreference, profile.evidenceOther || profile.decisionStyle),
    SELF_RELEVANCE: profile.selfRelevanceLabel || profile.selfRelevance || "未回答",
    CONCERNS: profile.concerns || "未回答",
  });
}

function buildValueGuidelines(profile) {
  const values = new Set([
    profile.primaryValue,
    ...(Array.isArray(profile.specificValues) ? profile.specificValues : []),
  ].filter(Boolean));

  const guidelines = [];
  if (values.has("個人の自由・自己決定")) {
    guidelines.push("選択肢が増えること、強制ではないこと、本人の自己決定を尊重することを重視する");
  }
  if (values.has("公平性・弱い立場の人への配慮") || values.has("公平性・平等") || values.has("弱い立場の人の保護・害の回避")) {
    guidelines.push("制度上の不利益、負担の偏り、弱い立場の人への影響を具体的に扱う");
  }
  if (values.has("安全・生活の安定") || values.has("社会の安全・安定")) {
    guidelines.push("リスク、生活への影響、制度変更時の安定性を軽視せずに説明する");
  }
  if (values.has("家族・伝統・社会秩序") || values.has("伝統・秩序・既存制度との整合性")) {
    guidelines.push("既存制度や家族観を否定せず、段階的な制度設計や両立可能性を示す");
  }
  if (values.has("経済的合理性・効率") || values.has("成果・効率・費用対効果")) {
    guidelines.push("費用対効果、手続きコスト、社会的効率、実現可能性に触れる");
  }
  if (values.has("将来世代・社会全体への影響")) {
    guidelines.push("短期的な利害だけでなく、将来世代や社会全体への影響を含める");
  }
  if (values.has("調和・混乱回避")) {
    guidelines.push("断定や論破調を避け、相手の懸念を認めつつ、社会的混乱を抑える説明にする");
  }
  if (values.has("専門家・制度への信頼")) {
    guidelines.push("専門家の知見、制度設計、透明性、検証可能性を重視する");
  }

  return guidelines.length ? guidelines.join("。") : "選択された価値に沿って、相手の懸念を否定せずに論点を選ぶ";
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
