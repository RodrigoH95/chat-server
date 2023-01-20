const generateID = (length = 6) => {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    let pick = Math.floor(Math.random() * 2)
      ? letters[Math.floor(Math.random() * letters.length)]
      : numbers[Math.floor(Math.random() * numbers.length)];
    result += pick;
  }
  return result;
}

const getFormattedDateTime = () => {
  return new Date().toLocaleTimeString('es-AR', { hour: "2-digit", minute: "2-digit", timeZone: 'America/Argentina/Buenos_Aires' });
}

const formatMessageData = (data) => {
  const obj = {
    id: data.id,
    sender: data.sender,
    message: data.message,
    time: getFormattedDateTime(),
  }

  return obj;
}

console.log(generateID());

module.exports = { generateID, getFormattedDateTime, formatMessageData }