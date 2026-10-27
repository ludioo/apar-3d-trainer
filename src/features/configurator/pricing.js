export function calculatePrice(product, configuration) {
  const additions = ['agent', 'capacity', 'color'].map((key) => {
    const option = product.options[key].find((item) => item.id === configuration[`${key}Id`]);
    if (!option) throw new RangeError(`Unknown ${key}`);
    return option.priceAdd;
  });
  if (configuration.bracketEnabled) additions.push(product.options.bracket.priceAdd);
  return Object.fromEntries(['IDR', 'USD'].map((currency) => [
    currency, additions.reduce((total, price) => total + price[currency], product.basePrice[currency]),
  ]));
}

export function getSpecs(product, { agentId, capacityId }) {
  const agent = product.options.agent.find((item) => item.id === agentId);
  const capacity = product.options.capacity.find((item) => item.id === capacityId);
  const specs = agent?.specs[capacityId];
  if (!specs || !capacity) throw new RangeError('Unknown product variant');
  return { agent: agent.id, capacity: capacity.kg, fireClasses: agent.fireClasses, ...specs };
}
