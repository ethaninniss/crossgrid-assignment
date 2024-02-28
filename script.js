async function fetchData(url) {
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

function randomizeNumber(num) {
  return Math.floor(Math.random() * num);
}

async function getRandomAnswer() {
  const searchTitle = "bubble%20sort%20javascript";
  const url = `https://api.stackexchange.com/2.3/search?order=desc&sort=activity&intitle=${searchTitle}&site=stackoverflow&filter=!nNPvSNOgci`;
  let { items } = await fetchData(url);
  items = items.filter((e) => e.answer_count);
  const itemsIndex = randomizeNumber(items.length);
  const item = items[itemsIndex];
  const answerIndex = randomizeNumber(item.answers.length);
  const { answer_id } = item.answers[answerIndex];
  return answer_id;
}

async function getBody(id) {
  const url = `https://api.stackexchange.com/2.3/answers/${id}?order=desc&sort=activity&site=stackoverflow&filter=!nNPvSNdWme`;
  const data = await fetchData(url);
  const body = data.items[0].body;
  return body;
}

function formatBody(body) {
  const snippets = [];
  let s = "";
  let code = false;
  for (let i = 0; i < body.length; i++) {
    const cur = body[i];
    if (cur === "<") {
      if (body.slice(i, i + 7) === "</code>") {
        code = false;
        snippets.push(s);
        s = "";
        i += 6;
      }
      if (body.slice(i, i + 6) === "<code>") {
        code = true;
        i += 5;
      }
    }
    if (code) s += cur;
  }
  if (!snippets.length) return null;
  return snippets;
}

function formatCodeSnippet(code) {
  let isFunction = false;
  let argName = "";
  for (let i = 0; i < code.length; i++) {
    const cur = code[i];
    if (cur === "f") {
      if (code.slice(i, i + 8) === "function") {
        isFunction = true;
        i += 7;
      }
    }
    if (isFunction && cur === "(") {
      let j = i + 1;
      while (code[j] !== ")") {
        argName += code[j];
        j++;
      }
      break;
    }
  }
  if (!isFunction) return null;
  let l = 0,
    r = code.length - 1;
  while (l < r) {
    if (code[l] === "{" && code[r] === "}") break;
    if (code[l] !== "{") l++;
    if (code[r] !== "}") r--;
  }
  return [code.slice(l + 1, r), argName];
}

function runCodeSnippet(code, argName, arr) {
  const func = new Function(argName, code);
  return func(arr);
}

async function main(inputArr) {
  const answer_id = await getRandomAnswer();
  const body = await getBody(answer_id);
  const snippets = formatBody(body);
  if (!snippets) {
    console.log(
      "Answer found didn't have a code snippet. Looking for another answer."
    );
    return main(inputArr);
  }
  const snippet = snippets[randomizeNumber(snippets.length)];
  const code = formatCodeSnippet(snippet);
  if (!code) {
    console.log(
      "Code snippet found is not a function. Looking for another answer."
    );
    return main(inputArr);
  }
  const [formattedCodeSnippet, argName] = code;
  return runCodeSnippet(formattedCodeSnippet, argName, inputArr);
}

const res = main([4, 51, 62, 45, 31, 90, 42, 28, 96, 65, 33, 73]);
console.log(res);
