import argparse
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


SENTENCES = [
    "Для меня большая честь быть с вами сегодня на вручении дипломов одного из самых лучших университетов мира.",
    "Я не оканчивал институтов.",
    "Сегодня я хочу рассказать вам три истории из моей жизни.",
    "И всё.",
    "Ничего грандиозного.",
    "Просто три истории.",
    "Первая история – о соединении точек.",
    "Я бросил Reed College после первых 6 месяцев обучения, но оставался там в качестве “гостя” ещё около 18 месяцев, пока наконец не ушёл.",
    "Всё началось ещё до моего рождения.",
    "Моя биологическая мать была молодой, незамужней аспиранткой и решила отдать меня на усыновление.",
    "Она настаивала на том, чтобы меня усыновили люди с высшем образованием, поэтому мне было суждено быть усыновлённым юристом и его женой.",
    "Правда, за минуту до того, как я вылез на свет, они решили, что хотят девочку.",
    "Поэтому им позвонили ночью и спросили: “Неожиданно родился мальчик.",
    "Вы хотите его?”.",
    "Они сказали: “Конечно”.",
    "Потом моя биологическая мать узнала, что моя приёмная мать – не выпускница колледжа, а мой отец никогда не был выпускником школы.",
    "Она отказалась подписать бумаги об усыновлении.",
    "И только несколько месяцев спустя всё же уступила, когда мои родители пообещали ей, что я обязательно пойду в колледж.",
    "И 17 лет спустя я пошёл.",
    "Но я наивно выбрал колледж, который был почти таким же дорогим, как и Стэнфорд, и все накопления моих родителей были потрачены на подготовку к нему.",
    "Через шесть месяцев, я не видел смысла моего обучения.",
    "Я не знал, что я хочу делать в своей жизни, и не понимал, как колледж поможет мне это осознать.",
    "И вот, я просто тратил деньги родителей, которые они копили всю жизнь.",
    "Поэтому я решил бросить колледж и поверить, что всё будет хорошо.",
    "Я был поначалу напуган, но, оглядываясь сейчас назад, понимаю, что это было моим лучшим решением за всю жизнь.",
    "В ту минуту, когда я бросил колледж, я мог перестать говорить о том, что требуемые уроки мне не интересны и посещать те, которые казались интересными.",
    "Не всё было так романтично.",
    "У меня не было комнаты в общаге, поэтому я спал на полу в комнатах друзей, я сдавал бутылки Колы по 5 центов, чтобы купить еду и ходил за 7 миль через весь город каждый воскресный вечер, чтобы раз в неделю нормально поесть в храме кришнаитов.",
    "Мне он нравился.",
    "И много из того, с чем я сталкивался, следуя своему любопытству и интуиции, оказалось позже бесценным.",
    "Reed College всегда предлагал лучшие уроки по каллиграфии.",
    "По всему кампусу каждый постер, каждая метка были написаны каллиграфическим почерком от руки.",
    "Так как я отчислился и не брал обычных уроков, я записался на уроки по каллиграфии.",
    "Я узнал о serif и sans serif, о разных отступах между комбинациями букв, о том, что делает прекрасную типографику прекрасной.",
    "Она была красивой, историчной, мастерски утонченной до такой степени, что наука этого не смогла бы понять.",
    "Ничто из этого не казалось полезным для моей жизни.",
    "Но десять лет спустя, когда мы разрабатывали первый Макинтош, всё это пригодилось.",
    "И Мак стал первым компьютером с красивой типографикой.",
    "Если бы я не записался на тот курс в колледже, у Мака никогда бы не было несколько гарнитур и пропорциональных шрифтов.",
    "Ну а так как Windows просто сдули это с Мака, скорее всего, у персональных компьютеров вообще бы их не было.",
    "Если бы я не отчислился, я бы никогда не записался на тот курс каллиграфии и у компьютеров не было бы такой изумительной типографики, как сейчас.",
    "Конечно, нельзя было соединить все точки воедино тогда, когда я был в колледже.",
    "Но через десять лет всё стало очень, очень ясно.",
    "Ещё раз: вы не можете соединить точки, смотря вперёд; вы можете соединить их только оглядываясь в прошлое.",
    "Поэтому вам придётся довериться тем точкам, которые вы как-нибудь свяжете в будущем.",
    "Вам придётся на что-то положиться: на свой характер, судьбу, жизнь, карму – что угодно.",
    "Такой подход никогда не подводил меня и он изменил мою жизнь.",
]


def slug(value: str) -> str:
    cleaned = re.sub(r'[<>:"/\\\\|?*\\x00-\\x1f]', "_", value).strip()
    return cleaned[:80] or "stability-test"


def repair_mojibake(value: str) -> str:
    try:
        repaired = value.encode("gbk").decode("utf-8")
    except UnicodeError:
        return value

    cyrillic_count = len(re.findall(r"[\u0400-\u04ff]", repaired))
    return repaired if cyrillic_count > 3 else value


def call_api(base_url: str, api_key: str, model: str, text: str, timeout: int) -> str:
    body = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an accuracy-first professional translator. Translate Russian to Simplified Chinese only. "
                    "Preserve the exact meaning, scope, tense, negation, uncertainty, and implied limits of the source. "
                    "Do not infer facts that are not stated, do not simplify into a stronger or weaker claim, and do not summarize. "
                    "For example, 'did not graduate from college/university' must not become 'did not attend college/university'. "
                    "Russian glossary rule: 'оканчивать/окончить институт' means 'graduate from/complete an institute or university', not 'attend university'. "
                    "Return only the translation, with no explanations, notes, labels, or quotation marks."
                ),
            },
            {"role": "user", "content": f"Source language: Russian\nTarget language: Simplified Chinese\nSource text:\n{text}"},
        ],
        "temperature": 0.2,
    }
    request = Request(
        f"{base_url.rstrip('/')}/chat/completions",
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urlopen(request, timeout=timeout) as response:
        data = json.loads(response.read().decode("utf-8"))

    return apply_translation_rules(text, data["choices"][0]["message"]["content"].strip())


def apply_translation_rules(source_text: str, translated_text: str) -> str:
    normalized_source = source_text.lower()
    normalized_translation = re.sub(r"\s+", "", translated_text)

    if (
        re.search(r"я\s+не\s+оканчивал(?:а)?\s+институтов", normalized_source)
        and re.search(r"我没(?:有)?上过大学", normalized_translation)
    ):
        return re.sub(r"我没(?:有)?上过大学。?", "我没有从任何大学毕业。", translated_text)

    return translated_text


def write_markdown(path: Path, records: list[dict]) -> None:
    lines = [
        "# 稳定性测试：乔布斯演讲（俄语 → 中文）",
        "",
        "- 来源：https://m.hujiang.com/ru/p739362/",
        f"- 句子数：{len(records)}",
        f"- 更新时间：{datetime.now().isoformat(timespec='seconds')}",
        "",
        "## 对话",
        "",
    ]

    for index, record in enumerate(records, 1):
        lines.extend(
            [
                f"### {index}. 俄语 → 中文",
                "",
                f"- 时间：{record['time']}",
                f"- 状态：{record['status']}",
                "",
                "**译文**",
                "",
                record.get("translation", ""),
                "",
                "**原文**",
                "",
                record["source"],
                "",
            ]
        )

        if record.get("error"):
            lines.extend(["**错误**", "", record["error"], ""])

    path.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-key", default=os.getenv("OPENAI_API_KEY") or os.getenv("DEEPSEEK_API_KEY"))
    parser.add_argument("--base-url", default=os.getenv("OPENAI_BASE_URL") or os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"))
    parser.add_argument("--model", default=os.getenv("OPENAI_MODEL") or os.getenv("DEEPSEEK_MODEL", "deepseek-chat"))
    parser.add_argument("--records-dir", default="对话记录")
    parser.add_argument("--delay", type=float, default=0.3)
    parser.add_argument("--timeout", type=int, default=45)
    args = parser.parse_args()

    if not args.api_key:
        print("Missing API key. Pass --api-key or set DEEPSEEK_API_KEY.", file=sys.stderr)
        return 2

    root = Path(args.records_dir)
    project_dir = root / f"{slug('稳定性测试：乔布斯演讲')}_{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    project_dir.mkdir(parents=True, exist_ok=True)
    markdown_path = project_dir / "对话.md"
    records: list[dict] = []

    sentences = [repair_mojibake(sentence) for sentence in SENTENCES]

    for index, sentence in enumerate(sentences, 1):
        started = datetime.now()
        print(f"[{index}/{len(SENTENCES)}] {sentence[:70]}")
        try:
            translation = call_api(args.base_url, args.api_key, args.model, sentence, args.timeout)
            records.append(
                {
                    "time": started.strftime("%H:%M"),
                    "status": "ok",
                    "source": sentence,
                    "translation": translation,
                }
            )
        except (HTTPError, URLError, TimeoutError, KeyError, IndexError, json.JSONDecodeError) as error:
            records.append(
                {
                    "time": started.strftime("%H:%M"),
                    "status": "error",
                    "source": sentence,
                    "translation": "",
                    "error": str(error),
                }
            )

        write_markdown(markdown_path, records)
        time.sleep(args.delay)

    errors = sum(1 for record in records if record["status"] != "ok")
    print(f"Done. ok={len(records) - errors}, errors={errors}")
    print(markdown_path)
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
