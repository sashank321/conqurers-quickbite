const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `QB-${dateStr}-${randomDigits}`;
};

module.exports = generateOrderNumber;
