const generateID = (length = 6) => {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    let pick = Math.floor(Math.random() * 2)
      ? letters[Math.floor(Math.random() * letters.length)]
      : numbers[Math.floor(Math.random() * numbers.length)];
    result += pick;
  }
  return result;
}

console.log(generateID());

module.exports = { generateID }