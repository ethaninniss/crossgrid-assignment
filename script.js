// This is a helper function that I created to just fetch data from a url
async function fetchData(url) {
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

// This is a helper function that I created that just picks a random number from 0 to the num argument passed in
// This is just used to pick a random index from an array
// For example an array of questions or an array of answers
function randomizeNumber(num) {
  return Math.floor(Math.random() * num);
}

// This function uses the fetchData helper function to fetch data from the Stack Exhange API to return a random answer id
async function getRandomAnswer() {
  // I used the /search endpoint from the API and passed in a title of questions that I wanted to search for
  // The title I used was 'bubble sort javascript'
  const searchTitle = "bubble%20sort%20javascript";
  const url = `https://api.stackexchange.com/2.3/search?order=desc&sort=activity&intitle=${searchTitle}&site=stackoverflow&filter=!nNPvSNOgci`;
  let { items } = await fetchData(url);
  items = items.filter((e) => e.answer_count); // Here I filtered all the questions that have an answer count that isn't 0
  const itemsIndex = randomizeNumber(items.length); // I then grabbed a random index using randomizeNumber helper function
  const item = items[itemsIndex];
  const answerIndex = randomizeNumber(item.answers.length); // I then grabbed a random index using randomizeNumber helper function
  const { answer_id } = item.answers[answerIndex];
  return answer_id; // Here I just returned the answer id that was randomly chosen
}

// This function uses the fetchData helper function to fetch data from the Stack Exhange API to get the body of the HTML for that answer id
async function getBody(id) {
  // I used the /answers/${id} endpoint from the API as well as a filter to pick out the answers HTML
  // This is the filter: !nNPvSNdWme
  const url = `https://api.stackexchange.com/2.3/answers/${id}?order=desc&sort=activity&site=stackoverflow&filter=!nNPvSNdWme`;
  const data = await fetchData(url);
  // Here I just extracted the body and returned it
  const body = data.items[0].body;
  return body;
}

// This function takes in the body and extracts the code snippets only and removes all text
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

// This function takes in a code snippet and returns only the code inside the function as well as the argument name
// The reason why I did this is because in the next step I turned this string into an actual function that I can run
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

// This function takes in a code snippet, an argumentName, and an array of numbers
// It turns this string of code into an actual function that can be ran
function runCodeSnippet(code, argName, arr) {
  const func = new Function(argName, code);
  return func(arr);
}

// This is the main function that calls all the other helper functions to arrive at the returned solution
async function main(inputArr) {
  const answer_id = await getRandomAnswer();
  const body = await getBody(answer_id);
  const snippets = formatBody(body);
  // If there aren't any code snippets I will just rerun the function until I find an answer that has code snippets
  if (!snippets) {
    console.log(
      "Answer found didn't have a code snippet. Looking for another answer."
    );
    return main(inputArr);
  }
  const snippet = snippets[randomizeNumber(snippets.length)];
  const code = formatCodeSnippet(snippet);
  // If the code snippet isn't a function I will just rerun the function until I find an answer that has a code snippet that is a function
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
