function rollDice() {
  const input = document.getElementById("formula").value.replace(/\s+/g, "");
  const resultBox = document.getElementById("result");
  try {
    const total = evaluateDiceFormula(input);
    resultBox.textContent = `${input} → ${total}`;
  } catch (e) {
    resultBox.textContent = "Invalid formula.";
  }
}

function evaluateDiceFormula(expr) {
  // Parse tokens like 2d6, d20kh1, +, -, numbers
  return expr.replace(/(\d*)d(\d+)(kh\d+|kl\d+)?/g, (_, n, s, mod) => {
    const rolls = Array.from({ length: n || 1 }, () => 1 + Math.floor(Math.random() * s));
    let res = rolls;
    if (mod) {
      const m = parseInt(mod.slice(2), 10);
      res = mod.startsWith("kh") ? rolls.sort((a,b)=>b-a).slice(0,m)
                                 : rolls.sort((a,b)=>a-b).slice(0,m);
    }
    return res.reduce((a,b)=>a+b,0);
  }).split(/(?=[+\-])/).reduce((sum, term)=>sum + Number(eval(term)), 0);
}
